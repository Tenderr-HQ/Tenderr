"""
Central place for magic numbers and allowed choices.

Keeping these here (instead of hardcoded inside models/views)
makes it easy to change limits in one place and reference the
same values from serializers, tests, and admin.
"""

AVATAR_MAX_BYTES = 5 * 1024 * 1024
AVATAR_MIN_DIMENSION = 64
AVATAR_MAX_DIMENSION = 4096
AVATAR_ALLOWED_FORMATS = {'JPEG', 'PNG', 'WEBP'}
AVATAR_THUMBNAIL_SIZE = (256, 256)

USERNAME_REGEX = r'^[a-zA-Z0-9_]{3,30}$'
BIO_MAX_LENGTH = 200
DISPLAY_NAME_MAX_LENGTH = 60

# Relationship soft limits (informational — not hard enforcement)
STAND_WITH_DAILY_HINT = 50
COMPANION_PENDING_LIMIT = 100