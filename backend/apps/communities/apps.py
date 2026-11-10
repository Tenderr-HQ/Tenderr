from django.apps import AppConfig


class CommunitiesConfig(AppConfig):
    """
    Configuration for the communities app.

    `ready()` imports signals so they register at boot. Without it,
    the signals in signals.py never fire.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.communities'
    verbose_name = 'Communities'

    def ready(self):
        from . import signals  