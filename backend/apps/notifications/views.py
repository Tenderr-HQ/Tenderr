"""
Views for the notifications API.

All endpoints operate on `request.user` — no <user_id> or <username>
parameter exists anywhere in this file. A user cannot read, mark,
or delete someone else's notifications.

Endpoints:
    GET  /api/notifications/               → list (paginated)
    GET  /api/notifications/unread-count/  → {count: N} for the bell badge
    POST /api/notifications/<id>/read/     → mark one read
    POST /api/notifications/read-all/      → mark all read (optional `before`)
    DELETE /api/notifications/<id>/        → delete one
    GET/PATCH /api/notifications/preferences/ → email / push preferences
"""
import logging

from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.models import Notification, NotificationPreference
from apps.notifications.permissions import IsOwner
from apps.notifications.serializers import (
    MarkAllReadSerializer,
    NotificationPreferenceSerializer,
    NotificationSerializer,
)

logger = logging.getLogger(__name__)


# List + unread count

class NotificationListView(generics.ListAPIView):
    """
    GET /api/notifications/
    Paginated list of the current user's notifications, newest first.
    Optional ?unread=true filter.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Notification.objects.for_user(self.request.user).select_related('actor', 'user')
        if self.request.query_params.get('unread') in ('true', '1'):
            qs = qs.unread()
        return qs.order_by('-created_at')


class UnreadCountView(APIView):
    """
    GET /api/notifications/unread-count/
    Returns {"count": N}. The frontend polls this for the bell badge.
    Cheap query — uses the (user, is_read) index.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.for_user(request.user).unread().count()
        return Response({'count': count})


# Mark read

class MarkReadView(APIView):
    """
    POST /api/notifications/<id>/read/
    Idempotent — calling twice is fine.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def post(self, request, pk):
        notification = Notification.objects.filter(pk=pk, user=request.user).first()
        if not notification:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=['is_read'])
        return Response({'is_read': True})


class MarkAllReadView(APIView):
    """
    POST /api/notifications/read-all/
    Optional body: {"before": "<ISO datetime>"} — only marks items
    created before that timestamp. Useful to avoid clearing a
    notification that arrived mid-request.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = MarkAllReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        qs = Notification.objects.for_user(request.user).unread()
        before = serializer.validated_data.get('before')
        if before:
            qs = qs.filter(created_at__lt=before)

        updated = qs.update(is_read=True, )
        # NOTE: .update() does not call save(), so it is fast and safe.
        return Response({'marked_read': updated})


# Delete

class DeleteNotificationView(APIView):
    """
    DELETE /api/notifications/<id>/
    Hard delete. Notifications are not soft-deleted — they contain no
    audit-relevant information that isn't already on the content row.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def delete(self, request, pk):
        notification = Notification.objects.filter(pk=pk, user=request.user).first()
        if not notification:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        notification.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Preferences

class PreferenceView(APIView):
    """
    GET / PATCH /api/notifications/preferences/
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get(self):
        return NotificationPreference.objects.get_or_create_for_user(self.request.user)

    def get(self, request):
        pref = self._get()
        return Response(NotificationPreferenceSerializer(pref).data)

    def patch(self, request):
        pref = self._get()
        serializer = NotificationPreferenceSerializer(pref, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(NotificationPreferenceSerializer(pref).data)