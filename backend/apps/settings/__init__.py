"""
`settings` app for unheard.

This app is the single source of truth for user preferences.
Every user has exactly one UserSettings row (created automatically
when they sign up — see apps.accounts.signals).

The API splits preferences into seven categories so the frontend
can build a tabbed settings page and save each tab independently:

    /api/settings/account/
    /api/settings/privacy/
    /api/settings/notifications/     ← proxies to apps.notifications
    /api/settings/security/
    /api/settings/appearance/
    /api/settings/language/
    /api/settings/data-storage/
    /api/settings/help/              ← static content, no model

Every endpoint operates on request.user only. It is impossible to
read or edit someone else's settings through this app.
"""
default_app_config = 'apps.settings.apps.SettingsConfig'