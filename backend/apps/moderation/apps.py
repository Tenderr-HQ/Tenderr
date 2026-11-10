from django.apps import AppConfig


class ModerationConfig(AppConfig):
    """
    No signals in this app. Moderation is triggered explicitly from
    the posts app (`posts/services/moderation_hooks.enqueue_moderation`).
    Keeping the coupling explicit — not via a hidden signal — makes
    the flow obvious when a future developer reads the posts app.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.moderation'
    verbose_name = 'Moderation'

    def ready(self):
        # No signal wiring needed. Placeholder for future hookups if
        # moderation ever needs to react to its own events.
        pass