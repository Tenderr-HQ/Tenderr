from django.apps import AppConfig


class SettingsConfig(AppConfig):
    """
    Configuration for the settings app.

    `ready()` wires up signals. We only need one signal in this app:
    keeping `UserSettings.is_profile_private` and
    `User.is_profile_private` in sync when the settings row changes
    first (the reverse direction is handled by apps.accounts.signals).
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.settings'
    verbose_name = 'Settings'

    def ready(self):
        from . import signals  # noqa: F401