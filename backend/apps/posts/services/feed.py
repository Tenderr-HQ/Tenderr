"""
Feed-assembly helpers.

The main feed is more than just `Post.objects.approved()`. It
composes several rules:

  1. Only approved (moderation-passed) posts.
  2. Exclude posts from users who blocked me or whom I blocked.
  3. Optional category filter.
  4. Optional intent filter.
  5. Newest first.

Putting this in a service function means the same feed rules
can be reused by:
  - the main feed view
  - the user's "their posts" view (with an author filter)
  - a future "for you" algorithm
"""
from apps.posts.models import Post


def build_feed(*, viewer, category=None, intent=None, author=None):
    """
    Return the queryset for the main feed, filtered and ordered.

    Keyword-only args keep call sites readable:
        build_feed(viewer=request.user)
        build_feed(viewer=request.user, category='life')
        build_feed(viewer=request.user, author=some_user)
    """
    qs = Post.objects.approved().visible_to(viewer)

    if author is not None:
        qs = qs.filter(author=author)

    qs = qs.by_category(category).by_intent(intent)

    return qs.select_related('author').prefetch_related('reactions')