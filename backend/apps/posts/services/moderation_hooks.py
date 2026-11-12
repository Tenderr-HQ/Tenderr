"""
Hooks that connect `posts` to the (separate) moderation app.

Why this file exists:
  - `posts` must not import the moderation app at load time
    (that would create a circular dependency once moderation
    imports posts).
  - So we define a thin, stable interface here and let the
    moderation Celery task consume it.

Any future developer adding a new moderation source (AI, user
reports, admin action) should call `enqueue_moderation(...)`
after creating or updating a Post/Comment.
"""
import logging

logger = logging.getLogger(__name__)


def enqueue_moderation(content_type: str, object_id, content_text: str) -> None:
    """
    Send a piece of content to the moderation pipeline.

    Args:
        content_type: 'post' or 'comment'.
        object_id:    the UUID (as str) of the Post/Comment.
        content_text: the actual text to scan.

    The Celery task lives in apps.moderation.tasks. We import it
    lazily so that if moderation hasn't been deployed yet, posts
    still work (they just stay in 'pending' until moderation is up).
    """
    try:
        from apps.moderation.tasks import moderate_content
        moderate_content.delay(
            content_type=content_type,
            object_id=str(object_id),
            content_text=content_text,
        )
    except Exception:
        # Never fail the request because moderation isn't wired up yet.
        logger.exception('Failed to enqueue moderation for %s %s', content_type, object_id)