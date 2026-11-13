"""
Central constants for communities.

Changing any of these affects every part of the system (models,
serializers, Celery, tests), so they live in one file to avoid
drift.
"""

# ---------- Media limits ----------
# An uploaded image or video for a community post.
MEDIA_MAX_BYTES = 50 * 1024 * 1024  # 50 MB
MEDIA_ALLOWED_IMAGE_FORMATS = {'JPEG', 'PNG', 'WEBP', 'GIF'}
MEDIA_ALLOWED_VIDEO_FORMATS = {'MP4', 'WEBM', 'MOV'}
MEDIA_ALLOWED_CONTENT_TYPES = {
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
}

# ---------- Community post limits ----------
COMMUNITY_POST_TITLE_MAX = 200
COMMUNITY_POST_CONTENT_MAX = 5000

# ---------- Discussion limits ----------
DISCUSSION_TITLE_MAX = 300
DISCUSSION_DESCRIPTION_MAX = 3000
DISCUSSION_MESSAGE_MAX = 1000

# Discussion can only close in the future, and no more than 90 days out.
# Both are validated in the serializer.
DISCUSSION_MAX_DURATION_DAYS = 90
DISCUSSION_MIN_DURATION_MINUTES = 15

# Preset close windows offered to admins in the UI.
# The API accepts any datetime between the min/max, but these are the
# standard options the frontend should render as chips.
DISCUSSION_PRESETS = (
    ('24h', '24 hours'),
    ('3d', '3 days'),
    ('1w', '1 week'),
    ('2w', '2 weeks'),
    ('1m', '1 month'),
    ('3m', '3 months'),
    ('custom', 'Custom'),
)

# Discussion status choices
DISCUSSION_STATUS = (
    ('open', 'Open'),
    ('closed', 'Closed'),
)

# ---------- Community membership ----------
# Short reason codes for future analytics; not user-visible.
MEMBERSHIP_SOURCE = (
    ('organic', 'Organic'),
    ('invite', 'Invite'),
    ('admin', 'Admin'),
)

# ---------- Media type choices on CommunityPost ----------
COMMUNITY_POST_MEDIA_TYPES = (
    ('none', 'None'),
    ('image', 'Image'),
    ('video', 'Video'),
)

# ---------- Pagination ----------
COMMUNITIES_PAGE_SIZE = 20
COMMUNITY_POSTS_PAGE_SIZE = 20
DISCUSSIONS_PAGE_SIZE = 20
DISCUSSION_MESSAGES_PAGE_SIZE = 50