"""
Custom querysets and managers for posts and comments.

A queryset is a chainable description of "which rows do I want?".
Putting common filters here keeps views and serializers clean
and ensures the same safety rules are applied everywhere.
"""
from django.db import models


class PostQuerySet(models.QuerySet):
    """
    QuerySet for Post.

    Common patterns:
      Post.objects.approved()          → only approved posts (what the feed shows)
      Post.objects.visible_to(user)    → excludes posts from users who blocked them
      Post.objects.by_category('life') → filter by category
    """

    def approved(self):
        """Only posts that passed moderation — these are the ones the feed shows."""
        return self.filter(status='approved')

    def not_removed(self):
        """Everything except soft-deleted posts (useful for the author's own list)."""
        return self.exclude(status='removed')

    def visible_to(self, viewer):
        """
        Exclude posts whose author blocked the viewer, or that the
        viewer blocked. We do a subquery on the Block model.

        If `viewer` is anonymous (not logged in), we skip the block
        check — anonymous users don't have a block graph.

        Note: we import Block lazily because `apps.accounts` and
        `apps.posts` are separate apps and Django forbids importing
        models at app-load time.
        """
        if not viewer or not getattr(viewer, 'is_authenticated', False):
            return self
        from apps.accounts.models import Block
        blocked_ids = Block.objects.filter(
            models.Q(blocker=viewer) | models.Q(blocked=viewer)
        ).values_list('blocker_id', 'blocked_id')
        # Flatten both directions into a single set of user IDs to exclude.
        excluded = set()
        for blocker_id, blocked_id in blocked_ids:
            excluded.add(blocker_id)
            excluded.add(blocked_id)
        return self.exclude(author_id__in=excluded)

    def by_category(self, category):
        """Optional filter — used by the category chips in the feed."""
        if category:
            return self.filter(category=category)
        return self

    def by_intent(self, intent):
        """Optional filter — used when you want 'advice' posts only, for example."""
        if intent:
            return self.filter(intent=intent)
        return self

    
    def order_by_latest(self):
        """Newest approved posts first — the default Explore view."""
        return self.order_by('-created_at')

    def order_by_most_discussed(self):
        """
        Sort by approved comment count (descending), then by recency
        as a tiebreaker. Uses `.annotate()` so no N+1 queries.

        Why count approved comments only:
          Pending/flagged comments shouldn't inflate "most discussed"
          rankings — that would let one pending spam thread top the
          chart.
        """
        from django.db.models import Count, Q
        return (
            self.annotate(
                approved_comments=Count(
                    'comments',
                    filter=Q(comments__status='approved', comments__is_removed=False),
                    distinct=True,
                )
            )
            .order_by('-approved_comments', '-created_at')
        )

    def order_by_recommended(self):
        """
        "Recommended" = highest engagement in the last 7 days.

        Why a time window:
          A post from 6 months ago with 500 reactions shouldn't
          permanently dominate the recommended tab. This surfaces
          recent posts that are getting real traction.

        Score = (love + me_too) + (approved_comments * 2).
        Comments are weighted higher than reactions because they
        represent more effort from the community.
        """
        from django.db.models import Count, F, Q
        from django.utils import timezone
        import datetime

        seven_days_ago = timezone.now() - datetime.timedelta(days=7)
        return (
            self.filter(created_at__gte=seven_days_ago)
            .annotate(
                reaction_count=Count('reactions', distinct=True),
                approved_comments=Count(
                    'comments',
                    filter=Q(comments__status='approved', comments__is_removed=False),
                    distinct=True,
                ),
            )
            .annotate(
                recommendation_score=F('reaction_count') + F('approved_comments') * 2,
            )
            .order_by('-recommendation_score', '-created_at')
        )



class PostManager(models.Manager.from_queryset(PostQuerySet)):
    """
    Default manager for Post. `from_queryset` copies all the
    queryset methods onto the manager so you can write
    `Post.objects.approved()` directly.
    """


class CommentQuerySet(models.QuerySet):
    """
    QuerySet for Comment.

    Comments have the same moderation status as posts, plus a
    'parent' field that lets us render one level of replies.
    """

    def approved(self):
        return self.filter(status='approved')

    def top_level(self):
        """Only comments that aren't replies (parent is null)."""
        return self.filter(parent__isnull=True)

    def visible_to(self, viewer):
        """
        Hide comments written by users the viewer has a block
        relationship with (either direction).
        """
        if not viewer or not getattr(viewer, 'is_authenticated', False):
            return self
        from apps.accounts.models import Block
        blocked_ids = Block.objects.filter(
            models.Q(blocker=viewer) | models.Q(blocked=viewer)
        ).values_list('blocker_id', 'blocked_id')
        excluded = set()
        for blocker_id, blocked_id in blocked_ids:
            excluded.add(blocker_id)
            excluded.add(blocked_id)
        return self.exclude(author_id__in=excluded)


class CommentManager(models.Manager.from_queryset(CommentQuerySet)):
    pass


class AnonymousLetterQuerySet(models.QuerySet):
    """
    QuerySet for AnonymousLetter.

    Letters are one-way. The only filters we need:
      - letters received by a specific post author
      - letters the author has not read yet
    """

    def unread(self):
        return self.filter(is_read=False)

    def for_author(self, user):
        """All letters sent to posts owned by `user`."""
        return self.filter(post__author=user)


class AnonymousLetterManager(models.Manager.from_queryset(AnonymousLetterQuerySet)):
    pass