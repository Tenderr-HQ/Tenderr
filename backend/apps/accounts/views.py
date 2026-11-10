import logging

from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    AvatarUpload,
    Block,
    Companion,
    StandWith,
    UserDeactivationLog,
    UserSession,
)
from .permissions import CanViewProfile
from .serializers import (
    AvatarHistorySerializer,
    AvatarUploadSerializer,
    BlockSerializer,
    CompanionControlSerializer,
    MeSerializer,
    PrivateUserSerializer,
    ProfileUpdateSerializer,
    PublicUserSerializer,
    SessionSerializer,
    StandWithItemSerializer,
    UsernameUpdateSerializer,
    ViewerAwareUserSerializer,
)
from .services.avatars import clear_avatar, process_and_save_avatar
from .services.search import search_users
from .utils import get_client_ip

logger = logging.getLogger(__name__)
User = get_user_model()


# ---------- Self ----------

class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ProfileUpdateSerializer
        return MeSerializer

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        s = self.get_serializer(user, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(MeSerializer(user, context={'request': request}).data)


class ChangeUsernameView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        s = UsernameUpdateSerializer(data=request.data, context={'user': request.user})
        s.is_valid(raise_exception=True)
        request.user.username = s.validated_data['username']
        request.user.save(update_fields=['username'])
        return Response(MeSerializer(request.user, context={'request': request}).data)


# ---------- Avatar ----------

class AvatarUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        s = AvatarUploadSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        rec = process_and_save_avatar(request.user, s.validated_data['avatar'])
        return Response(AvatarHistorySerializer(rec, context={'request': request}).data, status=201)

    def delete(self, request):
        clear_avatar(request.user)
        return Response(status=204)


class AvatarHistoryView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AvatarHistorySerializer

    def get_queryset(self):
        return AvatarUpload.objects.filter(user=self.request.user)


# ---------- Public profile ----------

class PublicProfileView(generics.RetrieveAPIView):
    queryset = User.objects.filter(is_active=True)
    permission_classes = [permissions.AllowAny, CanViewProfile]
    lookup_field = 'username'

    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        viewer = request.user if request.user.is_authenticated else None
        if user.is_profile_private and not user.can_be_viewed_by(viewer):
            return Response(PrivateUserSerializer(user, context={'request': request}).data)
        return Response(ViewerAwareUserSerializer(user, context={'request': request}).data)


class UserSearchView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = PublicUserSerializer

    def get_queryset(self):
        return search_users(self.request.query_params.get('q', ''))


# ---------- Stand With ----------

class StandWithToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, username):
        target = User.objects.filter(username__iexact=username, is_active=True).first()
        if not target:
            return Response({'detail': 'User not found.'}, status=404)
        if target.id == request.user.id:
            return Response({'detail': "You can't stand with yourself."}, status=400)

        # Safety: silently fail if a block exists (prevents retaliatory standing-with)
        if Block.objects.filter(blocker=target, blocked=request.user).exists():
            return Response({'detail': 'Unavailable.'}, status=403)

        obj, created = StandWith.objects.get_or_create(stander=request.user, target=target)
        if not created:
            obj.delete()
            return Response({'standing_with': False})
        return Response({'standing_with': True}, status=201)


class MyStandWithListView(generics.ListAPIView):
    """Only the authenticated user ever sees their own stand-with list."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StandWithItemSerializer

    def get_queryset(self):
        return StandWith.objects.filter(stander=self.request.user).select_related('target')


# ---------- Companion ----------

class CompanionRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, username):
        target = User.objects.filter(username__iexact=username, is_active=True).first()
        if not target:
            return Response({'detail': 'User not found.'}, status=404)
        if target.id == request.user.id:
            return Response({'detail': "You can't companion yourself."}, status=400)

        if Block.objects.filter(blocker=target, blocked=request.user).exists() \
                or Block.objects.filter(blocker=request.user, blocked=target).exists():
            return Response({'detail': 'Unavailable.'}, status=403)

        if not target.accepts_companion_requests:
            return Response({'detail': 'This user is not accepting companion requests.'}, status=403)

        if Companion.objects.filter(initiator=target, recipient=request.user, status='pending').exists():
            return Response({'detail': 'They already sent you a request — accept it.'}, status=409)

        existing = Companion.objects.filter(
            initiator=request.user, recipient=target
        ).first() or Companion.objects.filter(
            initiator=target, recipient=request.user
        ).first()

        if existing:
            return Response({'detail': 'Companion exists or pending.', 'status': existing.status}, status=409)

        comp = Companion.objects.create(
            initiator=request.user, recipient=target, status='pending',
        )
        return Response(
            CompanionControlSerializer(comp, context={'request': request}).data,
            status=201,
        )


class CompanionRespondView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, action):
        comp = Companion.objects.filter(pk=pk, recipient=request.user).first()
        if not comp:
            return Response({'detail': 'Not found.'}, status=404)
        if comp.status != 'pending':
            return Response({'detail': 'Request already resolved.'}, status=400)
        if action not in ('accept', 'decline'):
            return Response({'detail': 'Invalid action.'}, status=400)

        comp.status = 'accepted' if action == 'accept' else 'declined'
        comp.responded_at = timezone.now()
        comp.save(update_fields=['status', 'responded_at'])
        return Response(CompanionControlSerializer(comp, context={'request': request}).data)


class CompanionCancelView(APIView):
    """Initiator can cancel their own pending request."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        comp = Companion.objects.filter(pk=pk, initiator=request.user, status='pending').first()
        if not comp:
            return Response({'detail': 'Not found.'}, status=404)
        comp.delete()
        return Response(status=204)


class MyCompanionsView(generics.ListAPIView):
    """Accepted companions only — private to the user."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CompanionControlSerializer

    def get_queryset(self):
        from django.db.models import Q
        return Companion.objects.filter(
            Q(initiator=self.request.user) | Q(recipient=self.request.user),
            status='accepted',
        ).select_related('initiator', 'recipient')


class MyPendingCompanionRequestsView(generics.ListAPIView):
    """Incoming requests (recipient = me, status pending)."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CompanionControlSerializer

    def get_queryset(self):
        return Companion.objects.filter(
            recipient=self.request.user, status='pending',
        ).select_related('initiator')


# ---------- Block ----------

class BlockToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, username):
        target = User.objects.filter(username__iexact=username, is_active=True).first()
        if not target:
            return Response({'detail': 'User not found.'}, status=404)
        if target.id == request.user.id:
            return Response({'detail': "You can't block yourself."}, status=400)

        obj, created = Block.objects.get_or_create(blocker=request.user, blocked=target)
        if not created:
            obj.delete()
            return Response({'blocked': False})
        return Response({'blocked': True}, status=201)


class BlockedListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BlockSerializer

    def get_queryset(self):
        return Block.objects.filter(blocker=self.request.user).select_related('blocked')


# ---------- Sessions ----------

class SessionsListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SessionSerializer

    def get_queryset(self):
        return UserSession.objects.filter(user=self.request.user)


# ---------- Deactivation ----------

class DeactivateAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        reason = request.data.get('reason', '')[:255]
        scheduled = timezone.now() + timezone.timedelta(days=30)
        with transaction.atomic():
            UserDeactivationLog.objects.create(
                user=request.user,
                reason=reason,
                requested_ip=get_client_ip(request),
                scheduled_deletion_at=scheduled,
            )
            request.user.is_active = False
            request.user.save(update_fields=['is_active'])
        return Response({
            'detail': 'Account deactivated. Scheduled for deletion.',
            'scheduled_deletion_at': scheduled.isoformat(),
        })