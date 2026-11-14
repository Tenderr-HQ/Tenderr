"""
Central constants for the settings app.

Anything that appears in a dropdown, a toggle label, or a limit
lives here. This keeps the serializers, admin, and frontend in
sync — a single source of truth for each enum.
"""

# ---------- Appearance ----------
# The three allowed theme values. The frontend renders
# "System" by reading the OS preference and applying light or
# dark accordingly.
THEME_CHOICES = (
    ('light', 'Light'),
    ('dark', 'Dark'),
    ('system', 'System'),
)

# Reduce-motion is an accessibility setting. When True, the frontend
# should disable animations and parallax effects.
REDUCE_MOTION_DEFAULT = False

# Font size options — deliberately small. We do not support
# arbitrary zoom; users pick one of three.
FONT_SIZE_CHOICES = (
    ('small', 'Small'),
    ('medium', 'Medium'),
    ('large', 'Large'),
)

# ---------- Language ----------
# Supported UI languages. Order is alphabetical by code so the
# dropdown is stable across deploys.
LANGUAGE_CHOICES = (
    ('ar', 'العربية'),
    ('en', 'English'),
    ('es', 'Español'),
    ('fr', 'Français'),
    ('pt', 'Português'),
    ('sw', 'Kiswahili'),
)

DEFAULT_LANGUAGE = 'en'

# ---------- Security ----------
# Two-factor is a future feature — this flag is read by the login
# view when it's implemented. For now it's just stored.
TWO_FACTOR_DEFAULT = False

# Login alerts are delivered via the notifications app.
LOGIN_ALERTS_DEFAULT = True

# ---------- Data & storage ----------
AUTO_SAVE_DRAFTS_DEFAULT = True
KEEP_ANONYMOUS_HISTORY_DEFAULT = True

# When a user requests account deletion, we defer the hard delete
# for this many days so they can change their mind. Matches the
# value in apps.accounts (30 days) — keep them in sync.
ACCOUNT_DELETION_GRACE_DAYS = 30

# ---------- Help & support ----------
# Static content served by /api/settings/help/. Updating any of
# these requires a deploy — intentionally. Crisis numbers must be
# reviewed, not edited live.
SUPPORT_EMAIL = 'support@unheard.app'
FAQ_URL = 'https://unheard.app/faq'
TERMS_URL = 'https://unheard.app/terms'
PRIVACY_URL = 'https://unheard.app/privacy'

# Crisis resources. Region codes follow ISO 3166-1 alpha-2.
# When adding a new hotline, also add a test in tests/test_views_help.py.
CRISIS_RESOURCES = (
    {
        'region': 'US',
        'name': '988 Suicide & Crisis Lifeline',
        'phone': '988',
        'url': 'https://988lifeline.org/',
    },
    {
        'region': 'UK',
        'name': 'Samaritans',
        'phone': '116 123',
        'url': 'https://www.samaritans.org/',
    },
    {
        'region': 'NG',
        'name': 'Mentally Aware Nigeria Initiative',
        'phone': '08091116265',
        'url': 'https://mentallyaware.org/',
    },
    {
        'region': 'ZA',
        'name': 'SADAG Suicide Crisis Line',
        'phone': '0800 567 567',
        'url': 'https://www.sadag.org/',
    },
    {
        'region': 'GLOBAL',
        'name': 'Find a Helpline (international)',
        'phone': '',
        'url': 'https://findahelpline.com/',
    },
)

# ---------- Pagination ----------
SETTINGS_PAGE_SIZE = 20