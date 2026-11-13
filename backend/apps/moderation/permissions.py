"""
Permissions for the moderation API.

Only staff (Django `is_staff=True`) can touch the moderation
endpoints. Regular users can submit reports but cannot read the
queue — the queue is a moderator tool, not a public feed.
"""
from rest_framework.permissions import BasePermission


class IsModerator(BasePermission):
    """
    Staff users are moderators. This is the only permission that
    gates the whole moderation API. If you later want a separate
    moderator role, change the check here.
    """

    message = 'Moderator access only.'

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.is_staff
        )


class IsReporter(BasePermission):
    """
    True when the report in question was submitted by the current user.
    Used if you ever expose 'my reports' to non-staff.
    (Currently unused — reserved for future endpoint.)
    """

    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and obj.reporter_id == request.user.id