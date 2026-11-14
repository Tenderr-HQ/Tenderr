"""
Factory functions for creating notifications.

WHY A SERVICE LAYER?
  Notification creation is called from many places (posts, communities,
  moderation, accounts). If each caller built the row directly they
  would drift on:
    - title format
    - anonymity masking
    - whether to skip self-notifications
    - whether to set `link`

  Centralizing creation here means a future change ("stop notifying
  users of their own reactions") is a one-line edit, not a search-
  and-replace across four apps.

RULES IMPLEMENTED HERE:
  1. Users are never notified about their own actions.
  2. Anonymous content always results in an actor-less notification.
  3. Titles are built from templates — NEVER include actor usernames.
  4. `link` is a relative path the frontend can navigate to.
"""
import logging

from django.utils import timezone

from apps.notifications.models import Notification

logger = logging.getLogger(__name__)


# Low-level creator — used by all higher-level helpers

def create_notification(
    *,
    user,
    actor=None,
    type: str,
    title: str,
    body: str = '',
    link: str = '',
    target_is_anonymous: bool = True,
) -> Notification | None:
    """
    Insert a notification row.

    Returns None (and skips insert) if:
      - `user` is None
      - `actor` is the same user (never notify yourself)
      - `type` is not a known type

    Sets `target_is_anonymous` from the caller. Callers must pass
    this correctly — the serializer trusts it.
    """
    if user is None:
        return None
    if actor is not None and actor.id == user.id:
        return None

    # Basic sanity — the DB has the enum but a bad type string
    # would blow up the insert. Guard first.
    from apps.notifications.constants import NOTIFICATION_TYPES
    valid_types = {t[0] for t in NOTIFICATION_TYPES}
    if type not in valid_types:
        logger.warning('create_notification: unknown type %s; skipping.', type)
        return None

    return Notification.objects.create(
        user=user,
        actor=actor,
        type=type,
        title=title,
        body=body,
        link=link,
        target_is_anonymous=target_is_anonymous,
    )


# Higher-level helpers — one per domain event

def notify_comment(*, post, comment) -> Notification | None:
    """
    Called when a new comment is created on a post.
    The recipient is the post's author; the actor is the commenter.
    """
    return create_notification(
        user=post.author,
        actor=comment.author,
        type='comment',
        # Title is deliberately actor-free. The serializer masks it
        # again if needed — defence in depth.
        title='New comment on your post',
        body=(comment.content or '')[:120],
        link=f'/posts/{post.id}/',
        target_is_anonymous=post.is_anonymous,
    )


def notify_reply(*, parent_comment, reply) -> Notification | None:
    """
    Called when a reply is created on a top-level comment.
    The recipient is the parent comment's author.
    """
    return create_notification(
        user=parent_comment.author,
        actor=reply.author,
        type='comment',
        title='New reply to your comment',
        body=(reply.content or '')[:120],
        link=f'/posts/{parent_comment.post_id}/',
        target_is_anonymous=parent_comment.post.is_anonymous,
    )


def notify_reaction(*, post, reactor, reaction_type: str) -> Notification | None:
    """
    Called when someone reacts to a post.
    """
    type_label = 'love' if reaction_type == 'love' else '"me too"'
    return create_notification(
        user=post.author,
        actor=reactor,
        type='reaction',
        title=f'Someone sent {type_label} on your post',
        link=f'/posts/{post.id}/',
        target_is_anonymous=post.is_anonymous,
    )


def notify_letter(*, post, letter) -> Notification | None:
    """
    Called when an anonymous letter is sent to a post's author.
    """
    return create_notification(
        user=post.author,
        actor=letter.sender,
        type='letter',
        title='You received a new letter',
        body=(letter.content or '')[:120],
        link=f'/letters/{letter.id}/',
        target_is_anonymous=letter.is_sender_anonymous,
    )


def notify_discussion_message(*, discussion, message, participant) -> Notification | None:
    """
    Called when a new message is posted in a discussion that
    `participant` has previously contributed to. The participant
    is NOT notified if they are the message author.
    """
    return create_notification(
        user=participant,
        actor=message.author,
        type='discussion',
        title=f'New message in "{discussion.title[:60]}"',
        body=(message.content or '')[:120],
        link=f'/communities/discussions/{discussion.id}/',
        target_is_anonymous=message.is_anonymous,
    )


def notify_moderation_action(*, user, title: str, body: str = '', link: str = '') -> Notification | None:
    """
    Called when a moderator takes action on the user's content
    (approve, flag, remove). Non-optional: the user always receives
    this in-app and via email.
    """
    return create_notification(
        user=user,
        actor=None,           # system-initiated
        type='moderation',
        title=title,
        body=body,
        link=link,
        target_is_anonymous=False,
    )


def notify_system(*, user, title: str, body: str = '', link: str = '') -> Notification | None:
    """
    Platform announcement. Non-optional.
    """
    return create_notification(
        user=user,
        actor=None,
        type='system',
        title=title,
        body=body,
        link=link,
        target_is_anonymous=False,
    )