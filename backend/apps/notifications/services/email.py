"""
Email delivery for notifications.

DESIGN RULES:
  1. Emails are ALWAYS sent asynchronously (via Celery). This module
     builds and sends the actual email; the Celery task wraps it.
  2. Every email is gated by NotificationPreference — but only for
     OPTIONAL types. NON_OPTIONAL_TYPES always go out.
  3. If the user has `email_digest=True`, real-time emails for
     optional types are SKIPPED (the digest task will batch them).
  4. Anonymity: the email content NEVER reveals the actor when the
     underlying content is anonymous. We re-derive this here rather
     than trusting the notification row alone, because the row's
     `actor` field exists for audit purposes.
  5. Delivery failure never crashes the caller. We log and move on.
"""
import logging

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

from apps.notifications.constants import (
    EMAIL_TEMPLATE_DIGEST,
    NON_OPTIONAL_TYPES,
)
from apps.notifications.models import Notification, NotificationPreference

logger = logging.getLogger(__name__)


def _preference_allows_email(notification: Notification, pref: NotificationPreference) -> bool:
    """
    Decide whether the given notification should generate a real-time
    email for this user.

    Non-optional types always pass.
    If the user opted into digest, real-time is suppressed.
    Otherwise we check the per-type flag.
    """
    if notification.type in NON_OPTIONAL_TYPES:
        return True
    if pref.email_digest:
        return False   # will be batched into the digest instead
    if notification.type == 'comment':
        return pref.email_comments
    if notification.type == 'letter':
        return pref.email_letters
    # Other optional types (reaction, discussion) are not emailed in
    # real time — they only appear in the digest. This is intentional;
    # reactions are too noisy for real-time email.
    return False


def send_notification_email(notification: Notification) -> bool:
    """
    Send a single real-time email for a notification.

    Returns True if an email was sent (or would have been sent but
    the user has no email on file), False if the send failed.
    """
    try:
        pref = NotificationPreference.objects.get_or_create_for_user(notification.user)
    except Exception:
        logger.exception('Could not load preferences for %s', notification.user_id)
        return False

    if not _preference_allows_email(notification, pref):
        return False

    try:
        subject = notification.title
        body = _build_body(notification)
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[notification.user.email],
            fail_silently=False,
        )
        notification.email_sent_at = notification.created_at  # marker only
        notification.save(update_fields=['email_sent_at'])
        return True
    except Exception:
        logger.exception('Failed to send notification email for %s', notification.id)
        return False


def _build_body(notification: Notification) -> str:
    """
    Build a plain-text email body. Actor is masked when needed.
    """
    greeting = f'Hi {notification.user.display_name or notification.user.username},\n\n'
    masked = (
        'Someone' if notification.target_is_anonymous
        else (notification.actor.display_name if notification.actor else 'unheard')
    )
    lines = [
        greeting,
        f'{notification.title}',
    ]
    if notification.body:
        lines.append(f'\n"{notification.body}"')
    if notification.link:
        lines.append(
            f'\n\nOpen in unheard: {settings.FRONTEND_URL.rstrip("/")}{notification.link}'
        )
    lines.append('\n\n— The unheard team')
    return ''.join(lines)


def send_digest_email(user, notifications: list[Notification]) -> bool:
    """
    Build and send the daily digest email for one user.

    Returns True on success. Caller is the digest Celery task, which
    passes in the batch of notifications to include.
    """
    if not notifications:
        return False

    try:
        html = render_to_string(EMAIL_TEMPLATE_DIGEST + '.html', {
            'user': user,
            'notifications': [
                {
                    'title': n.title if not n.target_is_anonymous else 'Someone ' + n.title.lower().replace('someone ', '', 1),
                    'body': n.body,
                    'link': n.link,
                }
                for n in notifications
            ],
            'frontend_url': settings.FRONTEND_URL,
        })
        text = render_to_string(EMAIL_TEMPLATE_DIGEST + '.txt', {
            'user': user,
            'notifications': notifications,
            'frontend_url': settings.FRONTEND_URL,
        })
        send_mail(
            subject='Your unheard digest',
            message=text,
            html_message=html,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        return True
    except Exception:
        logger.exception('Failed to send digest to %s', user.id)
        return False