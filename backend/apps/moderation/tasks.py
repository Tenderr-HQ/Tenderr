"""
Celery task that scans every new post and comment.

HOW IT'S TRIGGERED:
  The `posts` app calls `enqueue_moderation(...)` from
  `posts/services/moderation_hooks.py` after creating a post or
  comment. That helper lazily imports `moderate_content` from this
  file and calls `.delay(...)`. So this task runs in a Celery worker,
  not in the request cycle — users never wait for moderation.

WHAT IT DOES:
  1. Load the content's text (from the posts or comments table).
  2. Run crisis keyword scan → if hit, flag critical and leave pending.
  3. Otherwise call Perspective API:
       - toxicity above threshold → flag medium, leave pending.
       - threat above threshold   → flag critical, leave pending.
       - otherwise → no flag; approve the content.
  4. Persist the flag (if any).
  5. Flip the content's status accordingly.
"""
import logging

from celery import shared_task
from django.apps import apps
from django.utils import timezone

from apps.moderation.models import ModerationFlag
from apps.moderation.services.crisis_scan import scan_for_crisis
from apps.moderation.services.perspective import analyze

logger = logging.getLogger(__name__)


def _load_content(content_type: str, object_id: str):
    """
    Look up the actual model instance based on our small content-type
    vocabulary. Returns None if not found (e.g. it was deleted before
    the worker got to it).
    """
    if content_type == 'post':
        Post = apps.get_model('posts', 'Post')
        return Post.objects.filter(pk=object_id).first()
    if content_type == 'comment':
        Comment = apps.get_model('posts', 'Comment')
        return Comment.objects.filter(pk=object_id).first()
    if content_type == 'message':
        # DiscussionMessage is in communities
        Message = apps.get_model('communities', 'DiscussionMessage')
        return Message.objects.filter(pk=object_id).first()
    return None


def _mark_approved(instance) -> None:
    """
    Flip status to 'approved' if the model has that field.
    Uses save(update_fields=...) so we don't stomp on other columns
    someone else might be updating at the same time.
    """
    if hasattr(instance, 'status') and instance.status == 'pending':
        instance.status = 'approved'
        instance.save(update_fields=['status'])


def _mark_flagged(instance) -> None:
    """
    Leave content as 'pending' if flagged — a human decides.
    We do NOT auto-set status='flagged' because that is a stronger
    statement than 'pending'. The flag row carries the severity;
    the content row stays pending until a human resolves it.
    """
    if hasattr(instance, 'status') and instance.status == 'pending':
        # No-op — leave it pending. Explicit for readability.
        pass


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
)
def moderate_content(self, *, content_type: str, object_id: str, content_text: str | None = None):
    """
    Scan a piece of content and either approve it or flag it for
    human review.

    Args:
      content_type: 'post' | 'comment' | 'message'
      object_id:    string UUID of the row
      content_text: optional; if not provided we load it from the DB.
                    Providing it avoids a round-trip when the caller
                    already has it in memory.

    Retries on unexpected exceptions up to 3 times with backoff.
    """
    instance = _load_content(content_type, object_id)
    if instance is None:
        logger.warning('moderate_content: %s:%s not found', content_type, object_id)
        return {'ok': False, 'reason': 'not_found'}

    text = content_text if content_text is not None else getattr(instance, 'content', '')
    text = (text or '').strip()
    if not text:
        _mark_approved(instance)
        return {'ok': True, 'approved': True, 'reason': 'empty'}

    # 1) Crisis keyword scan
    keyword = scan_for_crisis(text)
    if keyword:
        ModerationFlag.objects.create(
            content_type=content_type,
            object_id=str(object_id),
            severity='critical',
            reason=f'Crisis keyword matched: "{keyword}"',
            source='crisis_keyword',
        )
        _mark_flagged(instance)
        logger.info('Crisis keyword flagged %s:%s', content_type, object_id)
        return {'ok': True, 'approved': False, 'severity': 'critical', 'reason': 'crisis'}

    # 2) Perspective API
    result = analyze(text)
    if result.severity:
        ModerationFlag.objects.create(
            content_type=content_type,
            object_id=str(object_id),
            severity=result.severity,
            reason=result.reason,
            score=result.score,
            source='perspective',
        )
        _mark_flagged(instance)
        logger.info(
            'Perspective flagged %s:%s severity=%s score=%s',
            content_type, object_id, result.severity, result.score,
        )
        return {'ok': True, 'approved': False, 'severity': result.severity}

    # 3) Approve
    _mark_approved(instance)
    return {'ok': True, 'approved': True}