"""
Managers for the settings app.

There is only one model in this app (UserSettings), and it has a
strict one-to-one relationship with User. The manager exists mainly
so every caller uses the same "get or create" pattern — nobody has
to worry about whether the settings row exists yet.
"""
from django.db import models


class UserSettingsQuerySet(models.QuerySet):
    def for_user(self, user):
        """Return this user's settings row (or None if it doesn't exist)."""
        return self.filter(user=user).first()

    def get_or_create_for_user(self, user):
        """
        Get the user's settings row, creating a default one if missing.

        This is the only safe way to fetch settings — direct
        `UserSettings.objects.get(user=user)` would 500 if a user
        somehow has no row (e.g. created before this app existed).
        """
        obj, _ = self.get_or_create(user=user)
        return obj


class UserSettingsManager(models.Manager.from_queryset(UserSettingsQuerySet)):
    pass