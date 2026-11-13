"""
Small helpers for community membership.

Keeping join/leave logic here means every caller (API view,
admin action, future invite flow) uses the same rules.
"""
from apps.communities.models import Community, CommunityMembership


def join_community(user, community: Community, source: str = 'organic') -> CommunityMembership:
    """Idempotent — returns the existing membership if it exists."""
    obj, _ = CommunityMembership.objects.get_or_create(
        user=user, community=community,
        defaults={'source': source},
    )
    return obj


def leave_community(user, community: Community) -> bool:
    """Return True if the membership existed and was deleted."""
    deleted, _ = CommunityMembership.objects.filter(user=user, community=community).delete()
    return bool(deleted)


def is_member(user, community: Community) -> bool:
    if not getattr(user, 'is_authenticated', False):
        return False
    return CommunityMembership.objects.filter(user=user, community=community).exists()