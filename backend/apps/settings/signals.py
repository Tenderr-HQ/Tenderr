"""
Signals for the settings app.

There is exactly one signal here, and it exists to keep two
sources of truth in sync:

  UserSettings.is_profile_private  ←→  User.is_profile_private

The `accounts` app owns User and has its own signal that mirrors
the value in the other direction (User → UserSettings). This app's
signal handles UserSettings → User.

Why both directions?
  - The privacy endpoint (this app) updates UserSettings first,
    then User. Without this signal, a stale User row would leak
    a private profile to a stranger for a few milliseconds.
  - The accounts admin (or a future endpoint) updates User first.
    Without the accounts signal, UserSettings would show a stale
    value on the settings page.

Both signals are idempotent, so they can coexist without loops.
"""
import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import UserSettings

logger = logging.getLogger(__name__)


@receiver(post_save, sender=UserSettings)
def sync_privacy_to_user(sender, instance, created, **kwargs):
    """
    When UserSettings.is_profile_private changes, mirror it on the
    related User row so the accounts permission checks see the
    fresh value immediately.

    We do NOT run this on `created` because a fresh settings row
    has the model default (False) and the User row already has its
    own default — nothing to sync. Skipping it avoids a spurious
    User UPDATE on every signup.
    """
    if created:
        return
    try:
        user = instance.user
    except Exception:
        # The user was deleted out from under us — nothing to sync.
        return

    if user.is_profile_private != instance.is_profile_private:
        user.is_profile_private = instance.is_profile_private
        user.save(update_fields=['is_profile_private'])