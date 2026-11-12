"""
Views (endpoints) for the posts app.

Each View class corresponds to one or more HTTP methods against
one URL pattern. The URLs themselves are wired in urls.py.
"""
import logging

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.posts.constants import (
    COMMENTS_PAGE_SIZE,
    FEED_PAGE_SIZE,
    LETTERS_PAGE_SIZE,
)
from apps.posts.models import AnonymousLetter, Comment, Post, Reaction
from apps.posts.permissions import (
    CanInteractWithPost,
    CommentsEnabled,
    IsAuthorOrReadOnly,
)
from apps.posts.serializers import (
    AnonymousLetterCreateSerializer,
    AnonymousLetterInboxSerializer,
    CommentCreateSerializer,
    CommentSerializer,
    PostCreateSerializer,
    PostSerializer,
)
from apps.posts.services.feed import build_feed

logger = logging.getLogger(__name__)


#
# Feed
#

class FeedListView(generics.ListAPIView):
    """
    GET /api/posts/
    Returns the main feed — approved posts, filtered by category/intent.

    Query parameters:
      ?category=life|love|mental_health|family
      ?intent=vent|advice|similar|talk
    """
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None  # use DRF's default PageNumberPagination via settings

    def get_queryset(self):
        return build_feed(
            viewer=self.request.user,
            category=self.request.query_params.get('category'),
            intent=self.request.query_params.get('intent'),
        )


class MyPostsView(generics.ListAPIView):
    """
    GET /api/posts/mine/
    Returns all posts by the current user (approved, pending, and
    even removed — because the author should be able to see their
    own moderation state).
    """
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Post.objects.filter(author=self.request.user)
            .select_related('author')
            .prefetch_related('reactions')
            .order_by('-created_at')
        )


class PostCreateView(generics.CreateAPIView):
    """
    POST /api/posts/
    Create a new post. Author is set from request.user.
    """
    serializer_class = PostCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def create(self, request, *args, **kwargs):
        # Use the write serializer for validation, but the read
        # serializer for the response — so the client immediately
        # gets author_info, reactions, etc.
        write = self.get_serializer(data=request.data)
        write.is_valid(raise_exception=True)
        post = write.save(author=request.user)
        return Response(
            PostSerializer(post, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class PostDetailView(generics.RetrieveDestroyAPIView):
    """
    GET    /api/posts/<id>/   → single post (respects privacy & blocks)
    DELETE /api/posts/<id>/   → soft-delete (author only)
    """
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny, IsAuthorOrReadOnly]

    def get_queryset(self):
        # Author can see their own pending/removed posts; everyone
        # else only sees approved posts.
        if self.request.user.is_authenticated:
            return Post.objects.filter(
                models.Q(status='approved', is_removed=False)
                | models.Q(author=self.request.user)
            )
        return Post.objects.filter(status='approved', is_removed=False)

    def perform_destroy(self, instance):
        # Soft delete only — never hard-delete from the API.
        instance.is_removed = True
        instance.save(update_fields=['is_removed'])


#
# Comments
#

class CommentListView(generics.ListAPIView):
    """
    GET /api/posts/<post_id>/comments/
    Returns approved top-level comments for a post, with their reply
    counts. Use the child endpoint to fetch replies.
    """
    serializer_class = CommentSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        post = get_object_or_404(Post, pk=self.kwargs['post_id'], status='approved', is_removed=False)
        if not post.allow_comments:
            return Comment.objects.none()
        return (
            post.comments.approved()
            .top_level()
            .filter(is_removed=False)
            .visible_to(self.request.user)
            .select_related('author', 'post')
            .order_by('created_at')
        )


class CommentCreateView(generics.CreateAPIView):
    """
    POST /api/posts/<post_id>/comments/
    Create a top-level comment or a one-level reply.

    Business rules enforced here:
      - post must exist and be approved
      - post must allow comments
      - parent (if provided) must be a top-level comment on the same post
      - viewer must not be blocked by the post author
    """
    serializer_class = CommentCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, post_id):
        post = get_object_or_404(Post, pk=post_id, status='approved', is_removed=False)
        if not post.allow_comments:
            return Response(
                {'detail': 'Comments are disabled for this post.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not post.can_be_viewed_by(request.user):
            return Response(
                {'detail': 'You cannot comment on this post.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        write = self.get_serializer(data=request.data)
        write.is_valid(raise_exception=True)
        parent_id = write.validated_data.get('parent')

        parent = None
        if parent_id:
            parent = Comment.objects.filter(
                pk=parent_id, post=post, status='approved', is_removed=False,
            ).first()
            if not parent:
                return Response({'detail': 'Parent comment not found.'}, status=400)
            if parent.parent_id is not None:
                return Response(
                    {'detail': 'Replies are one level deep only.'},
                    status=400,
                )

        comment = write.save(author=request.user, post=post, parent=parent)
        return Response(
            CommentSerializer(comment, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class CommentRepliesView(generics.ListAPIView):
    """
    GET /api/posts/comments/<comment_id>/replies/
    Returns the one-level replies to a top-level comment.
    """
    serializer_class = CommentSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        parent = get_object_or_404(Comment, pk=self.kwargs['comment_id'], status='approved', is_removed=False)
        return (
            parent.replies.filter(status='approved', is_removed=False)
            .visible_to(self.request.user)
            .select_related('author', 'post')
            .order_by('created_at')
        )


#
# Reactions
#

class ReactionToggleView(APIView):
    """
    POST /api/posts/<post_id>/react/
    Body: {"type": "love"} or {"type": "me_too"}
    Toggles the reaction for the current user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_id):
        post = get_object_or_404(Post, pk=post_id, status='approved', is_removed=False)
        if not post.can_be_viewed_by(request.user):
            return Response({'detail': 'Unavailable.'}, status=403)

        reaction_type = request.data.get('type')
        if reaction_type not in ('love', 'me_too'):
            return Response({'detail': 'Invalid reaction type.'}, status=400)

        with transaction.atomic():
            existing = Reaction.objects.filter(
                post=post, user=request.user, reaction_type=reaction_type,
            )
            if existing.exists():
                existing.delete()
                toggled = False
            else:
                Reaction.objects.create(post=post, user=request.user, reaction_type=reaction_type)
                toggled = True

        return Response({'toggled': toggled, 'type': reaction_type})


#
# Anonymous Letters
#

class LetterSendView(APIView):
    """
    POST /api/posts/<post_id>/letters/
    Send an anonymous letter to the post's author.

    Rules:
      - post must exist, be approved
      - you cannot send a letter to your own post
      - you cannot send more than one letter per post (prevents spam
        via repeated letters; the sender can edit? No — letters are
        immutable. Delete and resend is not allowed either. This is a
        single-touch note.)
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_id):
        post = get_object_or_404(Post, pk=post_id, status='approved', is_removed=False)
        if post.author_id == request.user.id:
            return Response({'detail': 'You cannot send a letter to yourself.'}, status=400)
        if not post.can_be_viewed_by(request.user):
            return Response({'detail': 'Unavailable.'}, status=403)

        if AnonymousLetter.objects.filter(post=post, sender=request.user).exists():
            return Response(
                {'detail': 'You already sent a letter on this post.'},
                status=409,
            )

        write = AnonymousLetterCreateSerializer(data=request.data)
        write.is_valid(raise_exception=True)
        letter = write.save(post=post, sender=request.user)
        return Response(
            AnonymousLetterInboxSerializer(letter, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class LetterInboxView(generics.ListAPIView):
    """
    GET /api/posts/letters/inbox/
    All letters received on the current user's posts, newest first.
    Only visible to the author of those posts.
    """
    serializer_class = AnonymousLetterInboxSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            AnonymousLetter.objects.filter(post__author=self.request.user)
            .select_related('sender', 'post')
            .order_by('-created_at')
        )


class LetterMarkReadView(APIView):
    """
    POST /api/posts/letters/<letter_id>/read/
    Mark a letter as read. Only the recipient (post author) can do this.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, letter_id):
        letter = AnonymousLetter.objects.filter(
            pk=letter_id, post__author=request.user,
        ).first()
        if not letter:
            return Response({'detail': 'Not found.'}, status=404)
        if not letter.is_read:
            letter.is_read = True
            letter.save(update_fields=['is_read'])
        return Response({'is_read': True})