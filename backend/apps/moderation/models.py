"""
Database models for the moderation app.

Two models only:

  ModerationFlag  — written by the AI/crisis pipeline OR by a
                    human moderator who has reviewed a report.
                    Every flag references a piece of content by
                    (content_type, object_id).

  Report          — user-submitted. One user can report a given
                    item only once (unique_together).

Both models are append-only: we do not edit or delete them,
except to set `is_reviewed`/`is_resolved` and `reviewed_by`.
This is the audit trail.
"""
import uuid

from django.conf import settings
from django.db import models

from .constants import (
    CONTENT_TYPE_CHOICES,
    REPORT_REASONS,
    SEVERITY_CHOICES,
)
from .managers import ModerationFlagManager, ReportManager


class ModerationFlag(models.Model):
    """
    A single flag on a piece of content.

    Sources:
      - 'crisis_keyword'  — flagged by `services.crisis_scan` from the task
      - 'perspective'     — flagged by `services.perspective` from the task
      - 'manual'          — a moderator flagged it manually (usually while
                            resolving a report)

    `object_id` is a string even though Post and Comment IDs are UUIDs,
    because future content types (like a `User` ID in the accounts app,
    which is also UUID) can all be coerced to str. Using a consistent
    string type avoids cross-DB UUID comparisons in the query layer.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    content_type = models.CharField(
        max_length=20, choices=CONTENT_TYPE_CHOICES, db_index=True,
    )
    object_id = models.CharField(max_length=64, db_index=True)

    severity = models.CharField(
        max_length=10, choices=SEVERITY_CHOICES, default='medium', db_index=True,
    )

    # Human-readable reason. Free text is fine because the moderator
    # will see the actual content next to it. We do NOT try to
    # normalize this into an enum — it would create more friction
    # than value for a human reviewing a few dozen flags a day.
    reason = models.CharField(max_length=255, blank=True)

    # The raw score from Perspective API (0–1). Null for crisis keyword
    # flags (those don't go through the API).
    score = models.FloatField(null=True, blank=True)

    # Source is useful for statistics (how many auto-approved vs how
    # many went to a human?).
    source = models.CharField(
        max_length=20, default='perspective',
        help_text='Which pipeline produced this flag: crisis_keyword, perspective, or manual.',
    )

    # Resolution — set by a moderator.
    is_reviewed = models.BooleanField(default=False, db_index=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='moderation_flags_reviewed',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    objects = ModerationFlagManager()

    class Meta:
        db_table = 'moderation_flag'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_reviewed', '-created_at']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['severity', 'is_reviewed', '-created_at']),
        ]

    def __str__(self):
        return f'Flag[{self.severity}] {self.content_type}:{self.object_id[:8]}'


class Report(models.Model):
    """
    A user-submitted report on a piece of content.

    Uniqueness: a user cannot report the same piece of content twice.
    This prevents spammy reporting and keeps the queue clean.

    Resolution is a manual step. When a moderator resolves a report
    they usually:
      1. Review the content.
      2. Take action if needed (hide post, ban user — via accounts app).
      3. Mark the report resolved with `resolved_by`.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='reports_made',
    )

    content_type = models.CharField(
        max_length=20, choices=CONTENT_TYPE_CHOICES, db_index=True,
    )
    object_id = models.CharField(max_length=64, db_index=True)

    reason = models.CharField(
        max_length=20, choices=REPORT_REASONS,
        help_text='Standard reason from the dropdown.',
    )
    details = models.TextField(
        blank=True, max_length=1000,
        help_text='Optional free-text explanation from the reporter.',
    )

    is_resolved = models.BooleanField(default=False, db_index=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='reports_resolved',
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_note = models.CharField(
        max_length=255, blank=True,
        help_text='Optional moderator note when resolving the report.',
    )

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    objects = ReportManager()

    class Meta:
        db_table = 'moderation_report'
        ordering = ['-created_at']
        unique_together = ('reporter', 'content_type', 'object_id')
        indexes = [
            models.Index(fields=['is_resolved', '-created_at']),
            models.Index(fields=['content_type', 'object_id']),
        ]

    def __str__(self):
        return f'Report[{self.reason}] {self.content_type}:{self.object_id[:8]}'