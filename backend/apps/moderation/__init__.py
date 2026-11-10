"""
`moderation` app for unheard.

This app is the safety backbone:
  - Receives new posts and comments from `apps.posts` and scans them.
  - Receives user reports from the API and queues them for human review.
  - Provides the moderator's admin console.

Two models:
  - ModerationFlag : auto or user-driven flags on a piece of content.
  - Report         : a user-submitted report on a piece of content.

One Celery task:
  - moderate_content : called by the posts app on every new post / comment.
    Runs the crisis keyword scan first, then Perspective API toxicity.
    Writes a ModerationFlag if anything looks wrong, and updates the
    content's `status` field to 'approved' or leaves it 'pending' for
    human review.
"""
default_app_config = 'apps.moderation.apps.ModerationConfig'