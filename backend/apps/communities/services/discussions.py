"""
Business logic for discussions.

Anything that changes a discussion's status lives here so it can be
called from views (API) AND from tasks (Celery) with identical
semantics.
"""
from django.utils import timezone

from apps.communities.models import Discussion


def close_discussion(discussion: Discussion) -> Discussion:
    """Close a discussion now. Idempotent."""
    discussion.close()
    return discussion


def close_expired_discussions() -> int:
    """
    Find every open discussion whose `close_at` is in the past and
    close it. Called by the Celery Beat task.

    Returns the number of discussions that were closed — useful for
    task logs.
    """
    now = timezone.now()
    qs = Discussion.objects.filter(status='open', close_at__lte=now)
    count = 0
    for d in qs.iterator(chunk_size=200):
        d.status = 'closed'
        d.save(update_fields=['status'])
        count += 1
    return count