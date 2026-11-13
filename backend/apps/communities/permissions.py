"""
Custom permissions for the communities app.

Each permission class answers one narrow question. Views compose
them together.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsCommunityAdmin(BasePermission):
    """
    True if request.user is in the discussion's community's admins M2M.

    Used by admin-only endpoints:
      - create/edit/delete community posts flagged as admin posts
      - create discussions
      - close discussions early
    """

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        community = getattr(obj, 'community', None)
        if community is None:
            return False
        return community.admins.filter(id=request.user.id).exists()


class IsAdminOrReadOnly(BasePermission):
    """
    Read is open. Write requires being a community admin.
    Used by CommunityPost create/update in admin mode.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if not request.user.is_authenticated:
            return False
        community = getattr(obj, 'community', None) or getattr(obj, 'community_id', None)
        if not community:
            return False
        if isinstance(community, (int, str)):
            from apps.communities.models import Community
            community = Community.objects.filter(pk=community).first()
        return bool(community and community.admins.filter(id=request.user.id).exists())


class IsMemberOfCommunity(BasePermission):
    """
    True if request.user has a CommunityMembership for the object's
    community. Used by discussion message creation.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        community = getattr(obj, 'community', None) or getattr(obj, 'community_id', None)
        if not community:
            return False
        from .models import CommunityMembership
        return CommunityMembership.objects.filter(user=request.user, community=community).exists()


class DiscussionIsOpen(BasePermission):
    """
    True if the discussion is open and the timer hasn't expired.

    Used by message creation. Prevents messages after close.
    """

    def has_object_permission(self, request, view, obj):
        # obj is a Discussion
        return bool(getattr(obj, 'is_active', False))