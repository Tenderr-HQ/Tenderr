"""
Querysets and managers for moderation.

The moderation queue is the main read pattern in this app:

  - unreviewed flags (what needs a moderator's attention)
  - unresolved reports (what users have complained about)
  - everything sorted by severity first, then recency

Putting these in querysets keeps views and admin filters short and
guarantees the same rule is applied everywhere.
"""
from django.db import models


class ModerationFlagQuerySet(models.QuerySet):
    def unreviewed(self):
        """Flags that no moderator has marked as reviewed yet."""
        return self.filter(is_reviewed=False)

    def by_severity(self, severity):
        """Filter to one severity tier — used by the admin list filters."""
        return self.filter(severity=severity)

    def critical(self):
        return self.filter(severity='critical')

    def for_content(self, content_type, object_id):
        """All flags on a specific piece of content (posts, comments, etc.)."""
        return self.filter(content_type=content_type, object_id=str(object_id))


class ModerationFlagManager(models.Manager.from_queryset(ModerationFlagQuerySet)):
    pass


class ReportQuerySet(models.QuerySet):
    def unresolved(self):
        """Reports no moderator has resolved yet."""
        return self.filter(is_resolved=False)

    def for_content(self, content_type, object_id):
        """All reports on a specific piece of content."""
        return self.filter(content_type=content_type, object_id=str(object_id))


class ReportManager(models.Manager.from_queryset(ReportQuerySet)):
    pass