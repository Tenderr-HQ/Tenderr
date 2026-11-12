"""
Signals for the posts app.

WHAT ARE SIGNALS?
  Mr. Wisdom(my Django tutor) once asked me what SIGNALS are for,
  so, here's the answer to that question:
  Signals are Django's way of saying:
  "whenever X happens anywhere in the project, run this function."

  We use two signals here:

    1. post_save(Post)   → when a new post is created, kick off AI
                           moderation asynchronously.
    2. post_save(Comment)→ same for comments.

  We also add a post_delete guard on Reaction so a deleted post
  doesn't leave dangling reaction counts (Django handles this
  automatically, but this hook documents the intent for future
  developers who might add a denormalized counter field).
"""
import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Comment, Post
from .services.moderation_hooks import enqueue_moderation

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Post)
def post_created_enqueue_moderation(sender, instance, created, **kwargs):
    """
    Fire only on creation, not on updates. Otherwise every edit
    would re-run moderation and the post would flash in and out
    of the feed with each save.
    """
    if not created:
        return
    enqueue_moderation('post', instance.id, instance.content)


@receiver(post_save, sender=Comment)
def comment_created_enqueue_moderation(sender, instance, created, **kwargs):
    """
    Same rule as posts: moderate on creation only.
    """
    if not created:
        return
    enqueue_moderation('comment', instance.id, instance.content)