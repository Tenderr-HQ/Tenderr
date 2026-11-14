"""
Serializers for the settings app.

WHY ONE SERIALIZER PER CATEGORY?
  Each endpoint exposes only its own fields. This means:
    - PATCH /privacy/ physically cannot touch appearance fields.
    - A bug in one tab's validation cannot block saves on another.
    - The OpenAPI schema is self-documenting: every endpoint lists
      exactly the fields it accepts.

  The underlying model is the same `UserSettings` row for all of
  them, so no data is duplicated.

FIELD SYNC NOTE:
  `privacy` writes `is_profile_private` to BOTH UserSettings and
  User. This is intentional — see the model docstring. The
  `accounts` app signal handles the reverse direction.
"""
from rest_framework import serializers

from apps.settings.constants import (
    FONT_SIZE_CHOICES,
    LANGUAGE_CHOICES,
    THEME_CHOICES,
)
from apps.settings.models import UserSettings


# Privacy

class PrivacySerializer(serializers.ModelSerializer):
    """
    Endpoint: /api/settings/privacy/

    `is_profile_private` is duplicated on User (see accounts app) for
    permission checks. The view's update method writes to both — this
    serializer is what shapes the response.

    When True:
      - the profile returns a "private" payload to strangers
      - the user is omitted from /api/accounts/search/
    """
    class Meta:
        model = UserSettings
        fields = ['is_profile_private', 'show_in_search', 'allow_profile_views']


# Security

class SecuritySerializer(serializers.ModelSerializer):
    """
    Endpoint: /api/settings/security/

    `two_factor_enabled` is a stored flag today. The 2FA UI flow
    (QR code, recovery codes) lives in apps.authentications — this
    endpoint just records the preference.

    `login_alerts` is read by apps.notifications when sending the
    "new login from <ip>" email.
    """
    class Meta:
        model = UserSettings
        fields = ['two_factor_enabled', 'login_alerts']


# Appearance

class AppearanceSerializer(serializers.ModelSerializer):
    """
    Endpoint: /api/settings/appearance/

    Three fields, all optional for PATCH. Validation is on the
    choices — any other value is a 400.
    """
    theme = serializers.ChoiceField(choices=THEME_CHOICES)
    font_size = serializers.ChoiceField(choices=FONT_SIZE_CHOICES)

    class Meta:
        model = UserSettings
        fields = ['theme', 'reduce_motion', 'font_size']


# Language

class LanguageSerializer(serializers.ModelSerializer):
    """
    Endpoint: /api/settings/language/

    Only the language code. The frontend reads this on load and
    applies translations client-side; it does NOT change Django's
    site-wide LANGUAGE_CODE (which is set at deploy time).
    """
    language = serializers.ChoiceField(choices=LANGUAGE_CHOICES)

    class Meta:
        model = UserSettings
        fields = ['language']


# Data & Storage

class DataStorageSerializer(serializers.ModelSerializer):
    """
    Endpoint: /api/settings/data-storage/

    Read-only view of the two timestamps (they are set by the
    dedicated export / delete endpoints, not by PATCH here) plus
    the two booleans the user controls directly.
    """
    class Meta:
        model = UserSettings
        fields = [
            'auto_save_drafts', 'keep_anonymous_history',
            'export_requested_at', 'delete_scheduled_at',
        ]
        read_only_fields = ['export_requested_at', 'delete_scheduled_at']


# Account info (read-only convenience)

class AccountSerializer(serializers.Serializer):
    """
    Endpoint: /api/settings/account/

    Read-only summary of the user's account state — display name,
    email, provider, verification status. All edits happen through
    /api/accounts/me/ and /api/auth/ — this endpoint does not accept
    writes because splitting "change email" across two apps would
    create inconsistent audit logs.
    """
    email = serializers.EmailField()
    username = serializers.CharField()
    display_name = serializers.CharField()
    full_name = serializers.CharField()
    auth_provider = serializers.CharField()
    is_verified = serializers.BooleanField()
    date_joined = serializers.DateTimeField()
    last_active = serializers.DateTimeField(allow_null=True)