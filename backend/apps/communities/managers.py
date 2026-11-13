"""
Querysets and managers for the communities app.

Keeping "which rows should this endpoint see?" logic here means
views and serializers stay short, and the rules are the same
everywhere — no accidental leaks if you add a new endpoint
later.
"""
from django.db import models
from django.utils import timezone


class CommunityQuerySet(models.QuerySet):
    """
    Community is a small table (10–20 rows), so filters are simple.
    """

    def official(self):
        """Currently every community is official, but this lets you filter
        later if you ever allow partner-created communities."""
        return self.filter(is_official=True)

    def with_counts(self):
        """Annotate member and post counts for list pages.
        We use aggregate-style counts to avoid one query per community."""
        return self.annotate(
            member_count=models.Count('memberships', distinct=True),
            post_count=models.Count('posts', distinct=True),
        )


class CommunityManager(models.Manager.from_queryset(CommunityQuerySet)):
    pass


class CommunityMembershipQuerySet(models.QuerySet):
    def for_user(self, user):
        """All memberships of a given user."""
        return self.filter(user=user)

    def for_community(self, community):
        return self.filter(community=community)


class CommunityMembershipManager(models.Manager.from_queryset(CommunityMembershipQuerySet)):
    pass


class CommunityPostQuerySet(models.QuerySet):
    """
    Community posts support media and are not moderated by the same
    pipeline as the anonymous feed — admins in a community ARE the
    moderators.
    """

    def visible(self):
        """Not archived."""
        return self.filter(is_archived=False)

    def pinned_first(self):
        """Pinned posts float to the top of the community's post list."""
        return self.order_by('-is_pinned', '-created_at')


class CommunityPostManager(models.Manager.from_queryset(CommunityPostQuerySet)):
    pass


class DiscussionQuerySet(models.QuerySet):
    """
    Discussion endpoints vary mostly by open/closed state.
    """

    def open(self):
        return self.filter(status='open', close_at__gt=timezone.now())

    def closed(self):
        return self.filter(status='closed')

    def needs_auto_close(self):
        """Used by the Celery task: open discussions whose close_at has passed."""
        return self.filter(status='open', close_at__lte=timezone.now())

    def visible(self):
        """Not archived."""
        return self.filter(is_archived=False)

    def for_community(self, community):
        return self.filter(community=community)


class DiscussionManager(models.Manager.from_queryset(DiscussionQuerySet)):
    pass


class DiscussionMessageQuerySet(models.QuerySet):
    def visible(self):
        return self.filter(is_removed=False)

    def chronological(self):
        return self.order_by('created_at')


class DiscussionMessageManager(models.Manager.from_queryset(DiscussionMessageQuerySet)):
    pass