"""
Permissions for the notifications API.

Rules:
  - You can only see and mutate your own notifications.
  - Staff do not get cross-user access via the API; they use the
    Django admin instead.
"""
from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """
    Object-level permission: the requester must own the notification.

    The list views filter by `request.user` in the queryset — this
    permission protects object-level endpoints (detail, mark-read,
    delete).
    """

    message = 'You do not have permission to access this notification.'

    def has_object_permission(self, request, view, obj):
        return (
            request.user.is_authenticated
            and obj.user_id == request.user.id
        )