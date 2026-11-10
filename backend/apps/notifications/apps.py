from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    """
    Configuration for the notifications app.

    We import signals in `ready()` so the `post_save` on User hooks
    are registered at boot. Signals here do two things:
      - Create a NotificationPreference row for new users (mirror
        of the existing creation in accounts.signals — kept here so
        this app is self-sufficient if accounts ever drops that).
      - Send a "new login" alert email when last_login_ip changes
        (only if the user has login_alerts=True).
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.notifications'
    verbose_name = 'Notifications'

    def ready(self):
        from . import signals  