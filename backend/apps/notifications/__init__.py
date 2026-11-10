"""
`notifications` app for unheard.

Owns:
  - Notification              : one row per in-app notification
  - NotificationPreference    : per-user email / push opt-ins

Two delivery channels:
  - In-app  → served by /api/notifications/ and consumed by the bell icon
  - Email   → sent by Celery tasks (services/email.py, tasks.py)

Anonymity contract:
  If the content the notification is about is anonymous, the notification
  text and payload NEVER reveal the actor. The masking is applied in
  serializers.build_actor_info(), which delegates to
  posts.serializers.build_author_info so there is exactly one place
  in the codebase that knows how to mask an author.

Two Celery tasks:
  - send_email_digest         : nightly, batches emails for users who
                                opted into a daily digest.
  - purge_expired_notifications : nightly, deletes notifications older
                                than 90 days.
"""
default_app_config = 'apps.notifications.apps.NotificationsConfig'