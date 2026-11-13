"""
Serializers for the moderation app.

Two audiences use this file:

  1. Regular users  → submit reports (`ReportCreateSerializer`).
  2. Moderators     → read the queues (`ModerationFlagSerializer`,
                      `ReportSerializer`) and resolve items
                      (`ResolveSerializer`).

Design rules:
  - A regular user never sees another user's report or the flag
    queue. The permissions layer enforces that; the serializers just
    shape the data.
  - The `content_preview` field on the read serializers fetches the
    first ~200 characters of the flagged content. It's a soft foreign
    key lookup (string content_type + object_id) — if the content has
    been deleted since the flag was raised, `content_preview` is None
    and the moderator sees a small "content deleted" note.
  - We never expose the reporter's identity in the report queue.
    Moderators see the reason and details; if they need to escalate,
    they can query the DB. This is a trauma-informed default: the
    reporter must not fear retaliation.
"""
from django.apps import apps
from rest_framework import serializers

from apps.moderation.constants import (
    CONTENT_TYPE_CHOICES,
    REPORT_REASONS,
    SEVERITY_CHOICES,
)
from apps.moderation.models import ModerationFlag, Report


# Small helpers

def _content_preview(content_type: str, object_id: str, limit: int = 200):
    """
    Return up to `limit` characters of the actual content being
    referenced, or None if the row no longer exists.

    Uses `apps.get_model` (lazy lookup) to avoid importing `posts`
    or `communities` models at module load time. This keeps the
    moderation app deployable before those apps exist in a fresh
    environment.
    """
    if content_type == 'post':
        Model = apps.get_model('posts', 'Post')
    elif content_type == 'comment':
        Model = apps.get_model('posts', 'Comment')
    elif content_type == 'message':
        Model = apps.get_model('communities', 'DiscussionMessage')
    elif content_type == 'user':
        return None  # user objects have no "content" to preview
    else:
        return None

    try:
        obj = Model.objects.filter(pk=object_id).first()
    except Exception:
        return None

    if not obj:
        return None
    text = getattr(obj, 'content', '') or ''
    return text[:limit]


# Report — write (regular users)

class ReportCreateSerializer(serializers.Serializer):
    """
    Payload for POST /api/moderation/reports/.

    Rules enforced here:
      - `reason` must be one of REPORT_REASONS.
      - `details` is optional and capped at 1000 chars.
      - `content_type` must be one of CONTENT_TYPE_CHOICES.
      - `object_id` is a string (UUIDs accepted as string).
      - `object_id` must actually exist in the target table — we do a
        quick `exists()` check to reject typos and ghost reports.

    The `reporter` is set by the view from request.user, never trusted
    from the client.
    """
    content_type = serializers.ChoiceField(choices=CONTENT_TYPE_CHOICES)
    object_id = serializers.CharField(max_length=64)
    reason = serializers.ChoiceField(choices=REPORT_REASONS)
    details = serializers.CharField(max_length=1000, required=False, allow_blank=True)

    def validate(self, attrs):
        # Confirm the target exists before creating the report.
        content_type = attrs['content_type']
        object_id = attrs['object_id']

        if content_type == 'post':
            Model = apps.get_model('posts', 'Post')
        elif content_type == 'comment':
            Model = apps.get_model('posts', 'Comment')
        elif content_type == 'message':
            Model = apps.get_model('communities', 'DiscussionMessage')
        elif content_type == 'user':
            Model = apps.get_model('accounts', 'User')
        else:
            raise serializers.ValidationError({'content_type': 'Unsupported type.'})

        try:
            exists = Model.objects.filter(pk=object_id).exists()
        except Exception:
            exists = False
        if not exists:
            raise serializers.ValidationError({'object_id': 'Content not found.'})
        return attrs


# Report — read (moderators)

class ReportSerializer(serializers.ModelSerializer):
    """
    Read serializer for moderators.

    Note we do NOT include the reporter's user details here.
    Moderators can see who reported if they need to escalate via
    the Django admin; the API stays reporter-blind by default.
    """
    content_preview = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            'id', 'content_type', 'object_id',
            'content_preview',
            'reason', 'details',
            'is_resolved', 'resolved_by', 'resolved_at', 'resolution_note',
            'created_at',
        ]
        read_only_fields = fields

    def get_content_preview(self, obj):
        return _content_preview(obj.content_type, obj.object_id)


# ModerationFlag — read (moderators)

class ModerationFlagSerializer(serializers.ModelSerializer):
    """
    Read serializer for the flag queue.

    Includes `content_preview` so a moderator can triage without
    opening a second tab. The severity badge is derived from
    `severity` — the frontend colors based on this string.
    """
    content_preview = serializers.SerializerMethodField()
    severity_label = serializers.SerializerMethodField()

    class Meta:
        model = ModerationFlag
        fields = [
            'id', 'content_type', 'object_id',
            'content_preview',
            'severity', 'severity_label',
            'reason', 'score', 'source',
            'is_reviewed', 'reviewed_by', 'reviewed_at',
            'created_at',
        ]
        read_only_fields = fields

    def get_content_preview(self, obj):
        return _content_preview(obj.content_type, obj.object_id)

    def get_severity_label(self, obj):
        return dict(SEVERITY_CHOICES).get(obj.severity, obj.severity)


# Resolve payload (moderators)

class ResolveSerializer(serializers.Serializer):
    """
    Payload for POST /api/moderation/flags/<id>/resolve/ and
    POST /api/moderation/reports/<id>/resolve/.

    `note` is optional. It's appended to the flag's `reason` (or
    stored as `resolution_note` on a report) so it appears in the
    audit log.
    """
    note = serializers.CharField(max_length=255, required=False, allow_blank=True)