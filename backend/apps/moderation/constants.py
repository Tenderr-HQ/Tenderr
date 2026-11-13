"""
Central constants for moderation.

Everything tunable lives here so a non-developer (or a future
developer) can understand and adjust the system without reading
much code.
"""

# ---------- Severity tiers ----------
# How urgent a flag is. Critical flags are reviewed first.
SEVERITY_CHOICES = (
    ('low', 'Low'),
    ('medium', 'Medium'),
    ('critical', 'Critical'),
)

# ---------- Content types ----------
# Which model the flag or report applies to.
# `object_id` in the model is stored as a string so it can hold UUIDs
# (posts, comments) or ints (future content types) without schema churn.
CONTENT_TYPE_CHOICES = (
    ('post', 'Post'),
    ('comment', 'Comment'),
    ('message', 'Discussion Message'),
    ('user', 'User'),
)

# ---------- Report reasons ----------
# The set of reasons a user can pick when submitting a report.
# Frontend renders these as a dropdown / radio list.
REPORT_REASONS = (
    ('harassment', 'Harassment or bullying'),
    ('hate', 'Hate speech'),
    ('self_harm', 'Self-harm or suicide risk'),
    ('violence', 'Violence or threats'),
    ('spam', 'Spam or scam'),
    ('misinformation', 'Misinformation'),
    ('other', 'Other (explain below)'),
)

# ---------- Crisis keyword scan ----------
# Fast, deterministic pre-filter. If any of these appear in the
# content (case-insensitive substring match), we flag critical and
# leave the content pending for immediate human review.
#
# These are intentionally broad. False positives are fine here —
# a human can resolve them in seconds. False negatives are not.
CRISIS_KEYWORDS = (
    'kill myself',
    'killing myself',
    'kill me',
    'end my life',
    'ending my life',
    'want to die',
    'wanna die',
    'suicide',
    'suicidal',
    'self-harm',
    'self harm',
    'cutting myself',
    'cut myself',
    'overdose',
    'no reason to live',
    'nothing to live for',
    'better off dead',
    'don\'t want to live',
    'do not want to live',
    'hurt myself',
    'hurting myself',
    'take my own life',
)

# ---------- Perspective API thresholds ----------
# Perspective returns scores in 0.0–1.0.
# We auto-approve anything below these; flag above them.
TOXICITY_THRESHOLD_MEDIUM = 0.70   # greater than this → medium flag
THREAT_THRESHOLD_CRITICAL = 0.50   # greater than this → critical flag
PERSPECTIVE_TIMEOUT_SECONDS = 5    # fail-open if the API is slow

# ---------- Perspective requested attributes ----------
# Perspective's `comments:analyze` endpoint lets you request a subset
# of attributes. Each costs latency, so request only what we need.
PERSPECTIVE_ATTRIBUTES = ('TOXICITY', 'THREAT', 'SEVERE_TOXICITY')

# ---------- Queue pagination ----------
MODERATION_PAGE_SIZE = 50