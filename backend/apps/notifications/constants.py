"""
Central constants for the notifications app.

Anything that the frontend, admin, or a Celery task needs to know
about notification types and preferences is defined here — one
source of truth.
"""

# ---------- Notification types ----------
# Each type maps to a category of event. The frontend uses the
# type to pick an icon and copy for the notification card.
#
# Rule: if you add a type, also add a preference field in
# NotificationPreference (email_<type> and push_<type>) so users
# can control it. The exception is 'system' — system
# announcements cannot be opted out of.
NOTIFICATION_TYPES = (
    ('comment', 'New Comment'),
    ('reaction', 'New Reaction'),
    ('letter', 'Anonymous Letter'),
    ('discussion', 'Discussion Update'),
    ('moderation', 'Moderation Action'),
    ('system', 'System'),
)

# Types the user cannot opt out of (email or in-app).
# System announcements are rare and always relevant (e.g. "your
# account was exported", "a moderator removed your post").
NON_OPTIONAL_TYPES = ('system', 'moderation')

# ---------- Retention ----------
# Notifications older than this are deleted by a nightly Celery task.
# 90 days is a balance: long enough for users to catch up after a
# break, short enough that the table stays healthy.
NOTIFICATION_RETENTION_DAYS = 90

# ---------- Digest ----------
# The nightly digest sends one email per opted-in user, listing
# their unread notifications from the previous 24 hours.
DIGEST_BATCH_SIZE = 500          # users per Celery task run
DIGEST_MAX_ITEMS_PER_EMAIL = 20  # cap items per email so it doesn't become a wall of text

# ---------- Pagination ----------
NOTIFICATIONS_PAGE_SIZE = 30

# ---------- Email templates ----------
# Template names — actual template files live in
# templates/notifications/emails/. Keeping the names here lets
# tests reference them without string literals.
EMAIL_TEMPLATE_DIGEST = 'notifications/emails/digest'
EMAIL_TEMPLATE_LOGIN_ALERT = 'notifications/emails/login_alert'