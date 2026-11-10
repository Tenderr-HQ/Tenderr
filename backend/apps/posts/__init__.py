"""
`posts` app for unheard.

This app owns the public feed — the main space where users
(anonymously or publicly) share what is on their mind.

It contains:
  - Post        : the feed item itself
  - Comment     : one-level-deep replies on posts
  - Reaction    : love / "I thought I was the only one" buttons
  - AnonymousLetter : one-way private message to a post's author

Moderation itself lives in a separate app, but this app attaches
a `status` field to every post and comment so the moderation
pipeline can flag content before it's shown to other users.
"""
default_app_config = 'apps.posts.apps.PostsConfig'