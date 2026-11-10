"""
`communities` app for unheard.

What lives here:
  - Community             : a curated hub (e.g. "Survivor Support")
  - CommunityMembership   : who joined which community
  - CommunityPost         : media-rich posts inside a community
  - Discussion            : admin-created, time-boxed topics
  - DiscussionMessage     : flat, chronological messages inside a discussion

Celery Beat auto-closes discussions whose `close_at` has passed.
That task lives in tasks.py.
"""
default_app_config = 'apps.communities.apps.CommunitiesConfig'