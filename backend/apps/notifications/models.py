"""
Database models for the notifications app.

Two models:
  - Notification           : one row per in-app notification
  - NotificationPreference : one row per user (email / push opt-ins)

Every field is documented so a future developer can understand
the product intent without reading the views.
"""
from django.conf import settings as django_settings
from django.db import models

from .constants import NON_OPTIONAL_TYPES, NOTIFICATION_TYPES
from .managers import NotificationManager, NotificationPreferenceManager


class Notification(models.Model):
    """
    A single in-app notification.

    IMPORTANT: `actor` is the real user who triggered the event
    (they commented, reacted, sent a letter, etc.). The serializer
    masks this based on the *content's* anonymity, NOT the
    actor's choice — see `serializers.build_actor_info()`.

    The notification itself always exists, regardless of whether
    the user has emails on. Preference gating only affects the
    email channel (see `services.email`).
    """

    id = models.BigAutoField(primary_key=True)

    user = models.ForeignKey(
        django_settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text='The recipient of the notification.',
    )
    actor = models.ForeignKey(
        django_settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications_triggered',
        null=True, blank=True,
        help_text=(
            'The real user who triggered the event. Never exposed to '
            'the recipient if the underlying content is anonymous — '
            'the serializer masks this based on the target content.'
        ),
    )

    type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPES,
        db_index=True,
        help_text='One of the NOTIFICATION_TYPES values.',
    )

    title = models.CharField(
        max_length=120,
        help_text='Short headline shown in the bell list. Actor-masked.',
    )
    body = models.CharField(
        max_length=300, blank=True,
        help_text='Optional longer text (e.g. a 100-char snippet of a comment).',
    )

    link = models.CharField(
        max_length=255, blank=True,
        help_text=(
            'Relative URL the frontend navigates to on click. '
            'Example: "/posts/<id>/" or "/letters/<id>/".'
        ),
    )

    # Whether the content that triggered the notification was anonymous.
    # The serializer reads this to decide whether to mask the actor.
    target_is_anonymous = models.BooleanField(
        default=True,
        help_text=(
            'Set when the notification is created. If True, the actor '
            'is never shown to the recipient (the notification title '
            'will say "Someone" instead of a username).'
        ),
    )

    is_read = models.BooleanField(default=False, db_index=True)
    email_sent_at = models.DateTimeField(
        null=True, blank=True,
        help_text=(
            'Set by the email delivery task when the notification was '
            'included in an email. Used by the digest task to avoid '
            'sending duplicates.'
        ),
    )

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    objects = NotificationManager()

    class Meta:
        db_table = 'notifications_notification'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at'], name='notif_user_cr_idx'),
            models.Index(fields=['user', 'is_read'], name='notif_user_read_idx'),
            models.Index(fields=['-created_at'], name='notif_cr_idx'),
        ]

    def __str__(self):
        return f'[{self.type}] → user={self.user_id}'

    @property
    def is_optional(self) -> bool:
        """True if the user is allowed to opt out of emails for this type."""
        return self.type not in NON_OPTIONAL_TYPES


class NotificationPreference(models.Model):
    """
    Per-user notification preferences.

    Email and push are separate channels. Turning email off does not
    turn push off (or in-app). The in-app channel is always on.

    Some types are non-optional (`NON_OPTIONAL_TYPES`) — the
    preference fields exist for symmetry but the delivery service
    ignores them for those types.
    """

    user = models.OneToOneField(
        django_settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_prefs',
        primary_key=True,
    )

    # ---- Email channel ----
    email_comments = models.BooleanField(
        default=True,
        help_text='Email when someone comments on my content.',
    )
    email_letters = models.BooleanField(
        default=True,
        help_text='Email when I receive an anonymous letter.',
    )
    email_digest = models.BooleanField(
        default=False,
        help_text=(
            'If True, notifications are batched into a daily digest '
            'email instead of being sent in real time. (Real-time '
            'emails for comments/letters are suppressed when this '
            'is on.)'
        ),
    )

    # ---- Push channel (future mobile app) ----
    push_comments = models.BooleanField(
        default=True,
        help_text='Send a push notification when someone comments (mobile app only).',
    )
    push_letters = models.BooleanField(
        default=True,
        help_text='Send a push notification when I receive a letter (mobile app only).',
    )

    # ---- Audit ----
    updated_at = models.DateTimeField(auto_now=True)

    objects = NotificationPreferenceManager()

    class Meta:
        db_table = 'notifications_preference'
        verbose_name_plural = 'Notification preferences'

    def __str__(self):
        return f'Prefs for {self.user_id}'