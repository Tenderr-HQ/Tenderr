"""
Permissions for the settings API.

The rule is simple and absolute: every endpoint operates on
request.user only. There is no permission that grants access to
another user's settings — not even for staff, because staff use
the Django admin for that.

This is intentional. A "settings" endpoint that could return
another user's settings would be an attack surface. Staff tools
belong in the admin, where every view is separately authorized.
"""
from rest_framework.permissions import BasePermission


class IsSelfOnly(BasePermission):
    """
    Require authentication. The view's serializer is always built
    from `request.user` — there is no URL parameter that could
    reference another user.
    """

    message = 'Authentication required to access your settings.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)