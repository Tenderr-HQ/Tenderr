"""
Helpers for resolving flags and reports.

Keeping resolution logic here means the admin actions and the API
endpoints all follow the same rules:

  - resolving sets `is_reviewed`/`is_resolved` to True
  - sets `reviewed_by`/`resolved_by`
  - sets `reviewed_at`/`resolved_at` to now (if not already set)
  - records a note if provided

Resolution is idempotent — resolving twice does not change the
timestamps of the first resolution.
"""
from django.utils import timezone

from apps.moderation.models import ModerationFlag, Report


def resolve_flag(flag: ModerationFlag, reviewer, note: str = '') -> ModerationFlag:
    if not flag.is_reviewed:
        flag.is_reviewed = True
        flag.reviewed_by = reviewer
        flag.reviewed_at = timezone.now()
        if note:
            # Append note to the reason so we don't need a separate field.
            flag.reason = f'{flag.reason} — {note}' if flag.reason else note
        flag.save(update_fields=['is_reviewed', 'reviewed_by', 'reviewed_at', 'reason'])
    return flag


def resolve_report(report: Report, reviewer, note: str = '') -> Report:
    if not report.is_resolved:
        report.is_resolved = True
        report.resolved_by = reviewer
        report.resolved_at = timezone.now()
        if note:
            report.resolution_note = note
        report.save(update_fields=[
            'is_resolved', 'resolved_by', 'resolved_at', 'resolution_note',
        ])
    return report


def resolve_all_for_content(content_type: str, object_id, reviewer, note: str = '') -> dict:
    """
    Convenience function: resolve every open flag AND report on a
    piece of content. Useful when a moderator decides the right
    action once and wants to clear the whole queue for that item.
    """
    flags = 0
    for flag in ModerationFlag.objects.unreviewed().for_content(content_type, object_id):
        resolve_flag(flag, reviewer, note=note)
        flags += 1
    reports = 0
    for report in Report.objects.unresolved().for_content(content_type, object_id):
        resolve_report(report, reviewer, note=note)
        reports += 1
    return {'flags_resolved': flags, 'reports_resolved': reports}