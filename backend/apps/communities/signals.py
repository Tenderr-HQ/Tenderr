"""
Signals for the communities app.

Currently we use a single signal: when a Discussion is created, we
log it. This is intentionally a no-op in production but a useful
hook point for future work (e.g. firing notifications to community
members who opted in).

Why not enqueue moderation for discussion messages?
  Discussions are moderated live by community admins, not by the
  AI pipeline that governs the anonymous feed. That is a deliberate
  design choice: the discussion room is a curated space.
"""
import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import CommunityPost, Discussion

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Discussion)
def on_discussion_created(sender, instance, created, **kwargs):
    if not created:
        return
    logger.info(
        'Discussion created: %s in community %s by admin %s (close_at=%s)',
        instance.id, instance.community_id, instance.admin_id, instance.close_at,
    )


@receiver(post_save, sender=CommunityPost)
def on_community_post_created(sender, instance, created, **kwargs):
    if not created:
        return
    logger.info(
        'Community post created: %s in community %s by %s (admin_post=%s)',
        instance.id, instance.community_id, instance.author_id, instance.is_admin_post,
    )