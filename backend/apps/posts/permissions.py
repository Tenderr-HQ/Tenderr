"""
Custom permission classes for the posts app.

Permissions answer the question:
"Should this request be allowed to perform this action?"

DRF runs `has_permission` before the view's logic, and
`has_object_permission` before operating on a specific row.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAuthorOrReadOnly(BasePermission):
    """
    Only the author can edit or delete their own post/comment.
    Everyone can read.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_authenticated and obj.author_id == request.user.id


class CanInteractWithPost(BasePermission):
    """
    Used by comment-creation, reaction, and letter endpoints.

    A user may interact with a post only if:
      - they are logged in
      - they don't have a block relationship with the post's author
    """

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        post_author_id = getattr(obj, 'author_id', None)
        if not post_author_id:
            return True
        from apps.accounts.models import Block
        return not Block.objects.filter(
            blocker_id=post_author_id, blocked=request.user
        ).exists() and not Block.objects.filter(
            blocker=request.user, blocked_id=post_author_id
        ).exists()


class CommentsEnabled(BasePermission):
    """
    Used by comment-creation. Rejects when the post has
    `allow_comments=False`.
    """

    def has_object_permission(self, request, view, obj):
        return bool(obj.allow_comments)