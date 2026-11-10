from rest_framework.permissions import BasePermission


class IsProviderAvailable(BasePermission):
    """Abstraction for future feature flags (e.g. Apple sign-in toggle)."""

    def has_permission(self, request, view):
        return True