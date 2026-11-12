"""
Central place for magic numbers and allowed choices.

Keeping these here (instead of hardcoded inside models/views)
makes it easy to change limits in one place and reference the
same values from serializers, tests, and admin.
"""

# ---------- Post limits ----------
# A post is capped at 2000 characters on the server side.
# The frontend shows the same limit so users know when they hit it.
POST_CONTENT_MAX_LENGTH = 2000

# A comment is shorter — comments should be supportive, not essays.
COMMENT_CONTENT_MAX_LENGTH = 1000

# An anonymous letter is intentionally short. It is not a DM;
# it is a brief, one-way note of support.
LETTER_CONTENT_MAX_LENGTH = 500


# ---------- Post choices ----------
# "What do you need right now?" — shown on the create-post screen.
# The frontend uses these values to render the options and stores
# the selected one so the comment section can adapt (e.g. vent-only
# posts may hide the reply box).
POST_INTENTS = (
    ('vent', 'I just want to vent'),
    ('advice', 'I need advice'),
    ('similar', 'I want to hear similar experiences'),
    ('talk', 'I don\'t know, I just want to talk'),
)

# Categories allow filtering the feed. Keep this list small —
# too many categories fragment the community.
POST_CATEGORIES = (
    ('love', 'Love'),
    ('life', 'Life'),
    ('mental_health', 'Mental Health'),
    ('family', 'Family'),
)


# ---------- Comment choices ----------
# Every comment has a moderation status. New comments start
# as 'pending' and the moderation app flips them to 'approved'
# or 'flagged'.
CONTENT_STATUS_CHOICES = (
    ('pending', 'Pending'),
    ('approved', 'Approved'),
    ('flagged', 'Flagged'),
    ('removed', 'Removed'),
)


# ---------- Reaction choices ----------
# Two reactions only. No downvote, ever.
# 'love'   = a heart (I care about this)
# 'me_too' = "I thought I was the only one" (solidarity)
REACTION_TYPES = (
    ('love', 'Love'),
    ('me_too', 'Me Too'),
)


# ---------- Feed pagination ----------
# Page size for the main feed and comment lists.
# Kept modest on purpose — trauma-informed UX avoids infinite scroll.
FEED_PAGE_SIZE = 20
COMMENTS_PAGE_SIZE = 20
LETTERS_PAGE_SIZE = 20