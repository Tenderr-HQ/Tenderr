from django.apps import AppConfig


class PostsConfig(AppConfig):
    """
    Configuration for the posts app.

    `ready()` is where we import signal receivers so they are
    registered when Django boots. Without this hook, the signals
    we define in signals.py never fire.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.posts'
    verbose_name = 'Posts'

    def ready(self):
        from . import signals  # noqa: F401