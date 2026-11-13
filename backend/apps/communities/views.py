"""
Views for the communities app.

Endpoint groups:
  1. Community list & detail
  2. Membership join/leave + my-memberships
  3. Community posts (list / create / delete)
  4. Discussions (list / create / close / detail)
  5. Discussion messages (list / create)

Business rules live in the views; the serializer only shapes data.
This split keeps the API surface predictable: you can trace every
rule back to a specific view method.
"""
import logging

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.communities.constants import (
    COMMUNITIES_PAGE_SIZE,
    COMMUNITY_POSTS_PAGE_SIZE,
    DISCUSSION_MESSAGES_PAGE_SIZE,
    DISCUSSIONS_PAGE_SIZE,
)
from apps.communities.models import (
    Community,
    CommunityMembership,
    CommunityPost,
    Discussion,
    DiscussionMessage,
)
from apps.communities.permissions import (
    IsCommunityAdmin,
    IsMemberOfCommunity,
    DiscussionIsOpen,
)
from apps.communities.serializers import (
    CommunityDetailSerializer,
    CommunityListSerializer,
    CommunityPostCreateSerializer,
    CommunityPostSerializer,
    DiscussionCreateSerializer,
    DiscussionMessageCreateSerializer,
    DiscussionMessageSerializer,
    DiscussionSerializer,
    MembershipSerializer,
)
from apps.communities.services.discussions import close_discussion
from apps.communities.services.membership import (
    is_member,
    join_community,
    leave_community,
)

logger = logging.getLogger(__name__)


# Community list & detail

class CommunityListView(generics.ListAPIView):
    """
    GET /api/communities/
    List all official communities with member/post counts.
    Annotated via `with_counts()` so the response is a single query.
    """
    serializer_class = CommunityListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Community.objects.official().with_counts()

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        # Precompute the set of community IDs the current user is a member
        # of, so the serializer can short-circuit with a set lookup instead
        # of one query per community.
        user = self.request.user
        if user.is_authenticated:
            ctx['membership_community_ids'] = set(
                CommunityMembership.objects.filter(user=user).values_list('community_id', flat=True)
            )
        return ctx


class CommunityDetailView(generics.RetrieveAPIView):
    """
    GET /api/communities/<slug>/
    Detail view with admin roster.
    """
    serializer_class = CommunityDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'
    queryset = Community.objects.prefetch_related('admins')


# Membership

class JoinCommunityView(APIView):
    """
    POST /api/communities/<slug>/join/
    Idempotent — if already a member, returns 200 with `joined=True`.
    Creates a CommunityMembership row on first call.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        community = get_object_or_404(Community, slug=slug)
        join_community(request.user, community)
        return Response({'joined': True}, status=status.HTTP_201_CREATED)


class LeaveCommunityView(APIView):
    """
    POST /api/communities/<slug>/leave/
    Deletes the membership. Idempotent — returns `left=False` if not a member.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        community = get_object_or_404(Community, slug=slug)
        deleted = leave_community(request.user, community)
        return Response({'left': deleted})


class MyMembershipsView(generics.ListAPIView):
    """
    GET /api/communities/me/
    List all communities the current user has joined.
    """
    serializer_class = MembershipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            CommunityMembership.objects
            .filter(user=self.request.user)
            .select_related('community')
            .order_by('-joined_at')
        )


# Community posts

class CommunityPostListView(generics.ListAPIView):
    """
    GET /api/communities/<slug>/posts/
    List visible (non-archived) posts in a community, pinned first.
    """
    serializer_class = CommunityPostSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        community = get_object_or_404(Community, slug=self.kwargs['slug'])
        return (
            community.posts.visible()
            .pinned_first()
            .select_related('author', 'community')
        )


class CommunityPostCreateView(APIView):
    """
    POST /api/communities/<slug>/posts/
    Create a community post.

    Two modes:
      - Admin of the community     → `is_admin_post=True`, always public.
      - Regular member (any user)  → `is_admin_post=False`, honors `is_anonymous`.
                                      If media is attached, service forces public.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        community = get_object_or_404(Community, slug=slug)
        serializer = CommunityPostCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        is_admin = community.admins.filter(id=request.user.id).exists()

        with transaction.atomic():
            post = CommunityPost.objects.create(
                community=community,
                author=request.user,
                is_admin_post=is_admin,
                title=serializer.validated_data['title'],
                content=serializer.validated_data['content'],
                media=serializer.validated_data.get('media'),
                media_type=serializer.validated_data.get('media_type', 'none'),
                is_anonymous=serializer.validated_data.get('is_anonymous', True),
            )
        return Response(
            CommunityPostSerializer(post, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class CommunityPostDeleteView(APIView):
    """
    DELETE /api/communities/<slug>/posts/<post_id>/
    Soft-archive a post. Author or community admin only.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, slug, post_id):
        community = get_object_or_404(Community, slug=slug)
        post = get_object_or_404(CommunityPost, pk=post_id, community=community)
        is_admin = community.admins.filter(id=request.user.id).exists()
        if post.author_id != request.user.id and not is_admin:
            return Response(
                {'detail': 'You cannot delete this post.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        post.is_archived = True
        post.save(update_fields=['is_archived'])
        return Response(status=status.HTTP_204_NO_CONTENT)


# Discussions

class DiscussionListView(generics.ListAPIView):
    """
    GET /api/communities/<slug>/discussions/
    List all visible discussions in a community.
    Optional ?status=open|closed filter.
    """
    serializer_class = DiscussionSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        community = get_object_or_404(Community, slug=self.kwargs['slug'])
        qs = community.discussions.visible().select_related('admin', 'community')
        status_filter = self.request.query_params.get('status')
        if status_filter == 'open':
            qs = qs.filter(status='open')
        elif status_filter == 'closed':
            qs = qs.filter(status='closed')
        return qs.order_by('-created_at')


class DiscussionCreateView(APIView):
    """
    POST /api/communities/<slug>/discussions/
    Admins only. Creates a discussion with a mandatory close_at timer.

    Business rule: only community admins can create discussions.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        community = get_object_or_404(Community, slug=slug)
        if not community.admins.filter(id=request.user.id).exists():
            return Response(
                {'detail': 'Only community admins can create discussions.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = DiscussionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            discussion = Discussion.objects.create(
                community=community,
                admin=request.user,
                title=serializer.validated_data['title'],
                description=serializer.validated_data['description'],
                is_sensitive=serializer.validated_data.get('is_sensitive', False),
                close_at=serializer.validated_data['close_at'],
                status='open',
            )
        return Response(
            DiscussionSerializer(discussion, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class DiscussionDetailView(generics.RetrieveAPIView):
    """
    GET /api/communities/discussions/<id>/
    Retrieve a discussion. Sensitive discussions return the full body —
    the frontend is responsible for the blur/click gate.
    """
    serializer_class = DiscussionSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Discussion.objects.visible().select_related('admin', 'community')


class DiscussionCloseView(APIView):
    """
    POST /api/communities/discussions/<id>/close/
    Admins can close early. The Celery task also closes when the timer
    expires, but this lets admins react to heated threads in real time.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        discussion = get_object_or_404(Discussion, pk=pk)
        community = discussion.community
        if not community.admins.filter(id=request.user.id).exists():
            return Response(
                {'detail': 'Only community admins can close this discussion.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        close_discussion(discussion)
        return Response(
            DiscussionSerializer(discussion, context={'request': request}).data,
        )


# Discussion messages

class DiscussionMessageListView(generics.ListAPIView):
    """
    GET /api/communities/discussions/<id>/messages/
    List messages chronologically. Works for open AND closed discussions —
    users can always read history.
    """
    serializer_class = DiscussionMessageSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        discussion = get_object_or_404(Discussion, pk=self.kwargs['pk'])
        return (
            discussion.messages.visible()
            .chronological()
            .select_related('author')
        )


class DiscussionMessageCreateView(APIView):
    """
    POST /api/communities/discussions/<id>/messages/
    Post a message. Rules:
      - Discussion must exist.
      - Discussion must be active (open + timer not expired).
      - User must be a member of the community.
      - Respects `is_anonymous` from the payload.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        discussion = get_object_or_404(Discussion.objects.select_related('community'), pk=pk)

        if not discussion.is_active:
            return Response(
                {'detail': 'This discussion has closed.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not is_member(request.user, discussion.community):
            return Response(
                {'detail': 'Join this community to participate in discussions.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = DiscussionMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = DiscussionMessage.objects.create(
            discussion=discussion,
            author=request.user,
            content=serializer.validated_data['content'],
            is_anonymous=serializer.validated_data.get('is_anonymous', True),
        )
        return Response(
            DiscussionMessageSerializer(message, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )