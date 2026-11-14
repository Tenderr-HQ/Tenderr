"""
Signals for the notifications app.

Two things happen here:

  1. **Bootstrap preferences on user creation.** When a new User is
     created, ensure a NotificationPreference row exists. (The
     accounts app also creates this via its own signal — both are
     idempotent so there is no double insert.)

  2. **Login alert email.** When a user logs in from a new IP, and
     they have `login_alerts=True` (stored on UserSettings, not
     here), fire an email to the user. The IP comparison is done
     against the previous `last_login_ip` before the login signal
     updates it — hence we hook `user_logged_in`, which fires
     BEFORE `last_login_ip` is updated by the accounts signal.

Why not put the login alert inside the accounts signal?
  Separation of concerns: accounts knows about users, notifications
  knows about delivering messages. If we later move login alerts
  from email to push, only this file changes.
"""
import logging

from django.contrib.auth import get_user_model
from django.contrib.auth.signals import user_logged_in
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import NotificationPreference

logger = logging.getLogger(__name__)
User = get_user_model()


@receiver(post_save, sender=User)
def ensure_preference_row(sender, instance, created, **kwargs):
    """
    Create a preference row for every new user.
    Idempotent — will not duplicate if accounts.signals already
    created one (get_or_create).
    """
    if not created:
        return
    try:
        NotificationPreference.objects.get_or_create(user=instance)
    except Exception:
        logger.exception('Failed to bootstrap prefs for user %s', instance.id)


@receiver(user_logged_in)
def send_login_alert_if_new_ip(sender, request, user, **kwargs):
    """
    If the user's current IP differs from their previous last_login_ip,
    fire an email alert (subject to UserSettings.login_alerts).

    Wrapped in a try/except so a broken preference lookup can never
    break login.
    """
    try:
        from apps.settings.models import UserSettings
        from apps.notifications.services.create import notify_system
        settings_row = UserSettings.objects.filter(user=user).first()
        if not settings_row or not settings_row.login_alerts:
            return

        from apps.accounts.utils import get_client_ip
        current_ip = get_client_ip(request) if request else None
        previous_ip = user.last_login_ip
        if not current_ip or current_ip == previous_ip:
            return

        # Create in-app notification; email side effect handled by task.
        notify_system(
            user=user,
            title='New login to your account',
            body=f'We noticed a login from a new location (IP: {current_ip}). If this was not you, change your password immediately.',
            link='/settings/security/',
        )
    except Exception:
        logger.exception('Login alert failed for user %s', getattr(user, 'id', None))