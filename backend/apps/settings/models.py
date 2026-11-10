"""
The single database model for the settings app.

Every field belongs to exactly one settings category. The category
is documented on the field itself so a reader can trace the mapping
between model fields, serializers, and API endpoints without
clicking through files.

CATEGORY MAP:
    privacy      : is_profile_private, show_in_search, allow_profile_views
    security     : two_factor_enabled, login_alerts
    appearance   : theme, reduce_motion, font_size
    language     : language
    data-storage : auto_save_drafts, keep_anonymous_history,
                   export_requested_at, delete_scheduled_at

Notification preferences are NOT stored here — they live in
apps.notifications (see that app's README for rationale).
Account fields (display_name, email, etc.) live in apps.accounts.
"""
from django.conf import settings as django_settings
from django.db import models
from django.utils import timezone

from .constants import (
    AUTO_SAVE_DRAFTS_DEFAULT,
    DEFAULT_LANGUAGE,
    FONT_SIZE_CHOICES,
    KEEP_ANONYMOUS_HISTORY_DEFAULT,
    LANGUAGE_CHOICES,
    LOGIN_ALERTS_DEFAULT,
    REDUCE_MOTION_DEFAULT,
    THEME_CHOICES,
    TWO_FACTOR_DEFAULT,
)
from .managers import UserSettingsManager


class UserSettings(models.Model):
    """
    One row per user. Created automatically by the accounts signal
    when a user signs up.

    Every field has a default so a row is always usable even if the
    user has never touched the settings page.
    """

    user = models.OneToOneField(
        django_settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='app_settings',
        primary_key=True,
    )

    # ---------------- Privacy ----------------

    is_profile_private = models.BooleanField(
        default=False,
        help_text=(
            'Mirror of User.is_profile_private. The privacy endpoint '
            'writes both fields; the accounts signal syncs in the other '
            'direction. Do not edit this field directly — go through '
            'either app\'s serializer.'
        ),
    )

    show_in_search = models.BooleanField(
        default=True,
        help_text=(
            'If False, the user is omitted from /api/accounts/search/. '
            'This is a soft second-level control on top of is_profile_private.'
        ),
    )

    allow_profile_views = models.BooleanField(
        default=True,
        help_text=(
            'If False, the user\'s public profile returns a "profile not '
            'available" page even when is_profile_private=False. Intended '
            'for users who want to be discoverable in the feed but do not '
            'want strangers browsing their post history.'
        ),
    )

    # ---------------- Security ----------------

    two_factor_enabled = models.BooleanField(
        default=TWO_FACTOR_DEFAULT,
        help_text=(
            'Read by the login view (future). The 2FA flow itself lives '
            'in apps.authentications — this flag is the on/off switch.'
        ),
    )

    login_alerts = models.BooleanField(
        default=LOGIN_ALERTS_DEFAULT,
        help_text=(
            'If True, the notifications app sends an email whenever the '
            'account logs in from a new IP or device.'
        ),
    )

    # ---------------- Appearance ----------------

    theme = models.CharField(
        max_length=10,
        choices=THEME_CHOICES,
        default='dark',
        help_text='Only "light", "dark", or "system" — the app has a fixed visual identity.',
    )

    reduce_motion = models.BooleanField(
        default=REDUCE_MOTION_DEFAULT,
        help_text='Accessibility: disable animations and parallax in the frontend.',
    )

    font_size = models.CharField(
        max_length=10,
        choices=FONT_SIZE_CHOICES,
        default='medium',
    )

    # ---------------- Language ----------------

    language = models.CharField(
        max_length=5,
        choices=LANGUAGE_CHOICES,
        default=DEFAULT_LANGUAGE,
        help_text=(
            'Preferred UI language code. This does NOT change Django\'s '
            'site-wide LANGUAGE_CODE — it is a per-user preference that '
            'the frontend reads on load.'
        ),
    )

    # ---------------- Data & storage ----------------

    auto_save_drafts = models.BooleanField(
        default=AUTO_SAVE_DRAFTS_DEFAULT,
        help_text=(
            'If True, the frontend may persist half-typed posts in local '
            'storage. We do not store drafts server-side — this is a '
            'client-side hint only.'
        ),
    )

    keep_anonymous_history = models.BooleanField(
        default=KEEP_ANONYMOUS_HISTORY_DEFAULT,
        help_text=(
            'If False, when the user deactivates their account the backend '
            'will additionally scrub the author FK on all their anonymous '
            'posts and comments (they become "[deleted user]" content). '
            'Default True preserves the audit trail for abuse investigations.'
        ),
    )

    export_requested_at = models.DateTimeField(
        null=True, blank=True,
        help_text=(
            'Set when the user requests a data export. The actual export '
            'is produced by a Celery task and emailed; this timestamp '
            'records the request for audit purposes.'
        ),
    )

    delete_scheduled_at = models.DateTimeField(
        null=True, blank=True,
        help_text=(
            'Set when the user deactivates their account. Mirrors '
            'UserDeactivationLog.scheduled_deletion_at from apps.accounts. '
            'Duplicated here so this endpoint can display "you have X days '
            'left" without joining to another table.'
        ),
    )

    # ---------------- Audit ----------------

    updated_at = models.DateTimeField(auto_now=True)

    objects = UserSettingsManager()

    class Meta:
        db_table = 'settings_user_settings'
        verbose_name_plural = 'User settings'

    def __str__(self):
        return f'Settings for {self.user_id}'

    # ---- Convenience ----
    def schedule_deletion(self) -> None:
        """
        Mark the account for deletion in N days. Idempotent — calling
        twice keeps the original scheduled date.
        """
        from .constants import ACCOUNT_DELETION_GRACE_DAYS
        if self.delete_scheduled_at is None:
            self.delete_scheduled_at = timezone.now() + timezone.timedelta(
                days=ACCOUNT_DELETION_GRACE_DAYS,
            )
            self.save(update_fields=['delete_scheduled_at', 'updated_at'])

    def cancel_scheduled_deletion(self) -> None:
        """Undo a pending deletion (user changed their mind)."""
        if self.delete_scheduled_at is not None:
            self.delete_scheduled_at = None
            self.save(update_fields=['delete_scheduled_at', 'updated_at'])