"""
Queue-assembly helpers for the moderation console.

The queue is more than just "unreviewed flags". Moderators need to
see them ordered intelligently:

  1. Critical flags first.
  2. Then medium.
  3. Then low.
  4. Within each severity: newest first.
  5. Already-reviewed items are excluded by default.

Reports use a simpler rule: newest first, unresolved only.

Views and admin call these functions, not the querysets directly,
so the ordering is identical everywhere.
"""
from django.db.models import Case, IntegerField, Value, When

from apps.moderation.models import ModerationFlag, Report


def build_flag_queue():
    """
    Return unreviewed flags ordered by severity priority then recency.
    """
    severity_order = Case(
        When(severity='critical', then=Value(0)),
        When(severity='medium', then=Value(1)),
        When(severity='low', then=Value(2)),
        default=Value(3),
        output_field=IntegerField(),
    )
    return (
        ModerationFlag.objects.unreviewed()
        .annotate(severity_order=severity_order)
        .order_by('severity_order', '-created_at')
    )


def build_report_queue():
    """Return unresolved reports, newest first."""
    return Report.objects.unresolved().order_by('-created_at')