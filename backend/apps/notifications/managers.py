"""
Managers for the notifications app.

Two models, two querysets:

  NotificationQuerySet:
    - unread()
    - for_user(user)
    - older_than(days)

  NotificationPreferenceQuerySet:
    - for_user(user)
    - email_enabled_for(type)

These are the only read patterns the app uses, so putting them
here means views, tasks, and admin never duplicate the same filter.
"""
from django.db import models
from django.utils import timezone

from .constants import NOTIFICATION_RETENTION_DAYS


class NotificationQuerySet(models.QuerySet):
    def for_user(self, user):
        """All notifications for a user. Used by the list endpoint."""
        return self.filter(user=user)

    def unread(self):
        """Unread only — used by the bell icon badge counter."""
        return self.filter(is_read=False)

    def older_than_days(self, days: int):
        """Rows created more than `days` days ago. Used by purge task."""
        cutoff = timezone.now() - timezone.timedelta(days=days)
        return self.filter(created_at__lt=cutoff)

    def expired(self):
        """Convenience: older than NOTIFICATION_RETENTION_DAYS."""
        return self.older_than_days(NOTIFICATION_RETENTION_DAYS)


class NotificationManager(models.Manager.from_queryset(NotificationQuerySet)):
    pass


class NotificationPreferenceQuerySet(models.QuerySet):
    def for_user(self, user):
        return self.filter(user=user).first()

    def get_or_create_for_user(self, user):
        obj, _ = self.get_or_create(user=user)
        return obj


class NotificationPreferenceManager(models.Manager.from_queryset(NotificationPreferenceQuerySet)):
    pass