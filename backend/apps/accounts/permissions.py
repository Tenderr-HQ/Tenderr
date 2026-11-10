from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsSelf(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = getattr(obj, 'user', None) or obj
        return request.user.is_authenticated and user.id == request.user.id


class IsSelfOrStaff(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = getattr(obj, 'user', None) or obj
        if not request.user.is_authenticated:
            return False
        return user.id == request.user.id or request.user.is_staff


class CanViewProfile(BasePermission):
    def has_object_permission(self, request, view, obj):
        if not obj.is_profile_private:
            return True
        if not request.user.is_authenticated:
            return False
        return obj.id == request.user.id or request.user.is_staff


class CanEditProfile(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_authenticated and obj.id == request.user.id


class CanInteract(BasePermission):
    """Blocks any interaction if either party has blocked the other."""

    def has_object_permission(self, request, view, obj):
        from .models import Block
        if not request.user.is_authenticated:
            return False
        target_id = getattr(obj, 'id', None)
        if not target_id:
            return True
        return not Block.objects.filter(
            blocker=obj, blocked=request.user
        ).exists() and not Block.objects.filter(
            blocker=request.user, blocked=obj
        ).exists()