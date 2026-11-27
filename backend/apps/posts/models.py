"""
Database models for the posts app.

Every model here is documented with a plain-English comment
explaining what it represents and why it exists.
"""

import uuid
from django.conf import settings
from django.db import models

from .constants import (
    COMMENT_CONTENT_MAX_LENGTH,
    LETTER_CONTENT_MAX_LENGTH,
    POST_CATEGORIES,
    POST_CONTENT_MAX_LENGTH,
    POST_INTENTS,
    CONTENT_STATUS_CHOICES,
    REACTION_TYPES,
)
from .managers import (
    AnonymousLetterManager,
    CommentManager,
    PostManager,
)


class Post(models.Model):
    """
    A single feed item.

    Important fields to understand:
      - author    : the real user (FK). The backend always knows this.
      - is_anonymous : controls whether *other users* see a mask icon or
                       the author's public profile. This flag is the whole
                       point of the platform.
      - content   : the body of the post (max 2000 chars).
      - intent    : what the author wants right now. Used by the frontend
                    to adapt the comment box. (e.g. hide the reply box for
                    'vent' posts if you want to be extra careful.)
      - category  : life / love / mental_health / family — used for filtering.
      - allow_comments : if False, the frontend hides the comment section
                         and shows "Anonymous Letters" as a one-way alternative.
      - status    : moderation state. New posts start 'pending' and a background
                    job promotes them to 'approved' or 'flagged'.
      - is_removed: soft delete. We never hard-delete a post so that abuse
                    investigations remain possible.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # The real author is always linked, even when the post is anonymous.
    # This is a hard requirement for moderation and account safety.
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posts',
        help_text='The real user who wrote this post. Never shown to other users when is_anonymous=True.',
    )

    is_anonymous = models.BooleanField(
        default=True,
        help_text='When True, other users see "Anonymous". When False, they see the author\'s public profile.',
    )

    content = models.TextField(
        max_length=POST_CONTENT_MAX_LENGTH,
        help_text='The body of the post. Capped at 2000 characters.',
    )

    intent = models.CharField(
        max_length=20,
        choices=POST_INTENTS,
        default='talk',
        help_text='What the author needs right now. Drives UI adjustments on the comment box.',
    )

    category = models.CharField(
        max_length=20,
        choices=POST_CATEGORIES,
        default='life',
        help_text='Used by the feed filter chips.',
    )

    allow_comments = models.BooleanField(
        default=True,
        help_text='If False, the frontend hides the comment box and shows supportive alternatives.',
    )

    status = models.CharField(
        max_length=10,
        choices=CONTENT_STATUS_CHOICES,
        default='pending',
        db_index=True,
        help_text='Moderation state. Only "approved" posts appear in the public feed.',
    )

    is_removed = models.BooleanField(
        default=False,
        help_text='Soft delete. Removed posts are hidden from everyone, but their data remains in the DB.',
    )

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = PostManager()

    class Meta:
        db_table = 'posts_post'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['category', 'status', '-created_at']),
            models.Index(fields=['author', '-created_at']),
        ]

    def __str__(self):
        snippet = (self.content or '')[:40]
        return f'Post<{self.id}> by {self.author_id} — "{snippet}..."'

    def can_be_viewed_by(self, viewer) -> bool:
        """
        A post is viewable if:
          - it is approved (moderation passed)
          - it is not soft-deleted
          - the viewer has no block relationship with the author
        """
        if self.is_removed or self.status != 'approved':
            # Authors can always see their own posts even if pending/removed.
            return viewer and getattr(viewer, 'is_authenticated', False) and self.author_id == viewer.id
        if not viewer or not getattr(viewer, 'is_authenticated', False):
            return True  # anonymous viewers — no block graph to consult
        from apps.accounts.models import Block
        return not (
            Block.objects.filter(blocker=self.author, blocked=viewer).exists()
            or Block.objects.filter(blocker=viewer, blocked=self.author).exists()
        )


class Comment(models.Model):
    """
    A one-level-deep reply on a post.

    "One level deep" means:
      - a top-level comment has `parent=None`
      - a reply has `parent=<top-level comment>`
      - a reply-to-a-reply is not allowed in the UI (though the model
        would technically accept it — we enforce the rule in the view).

    Replies can also be anonymous. When the anonymous author of a
    post replies to a comment on their own post, the serializer
    tags them with "(OP)" so other readers know it's the original
    author without revealing who they are.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='comments',
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments',
    )

    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='replies',
        help_text='Null for top-level comments; FK for one-level replies.',
    )

    is_anonymous = models.BooleanField(
        default=True,
        help_text='Same rule as posts: if True, others see "Anonymous".',
    )

    content = models.TextField(
        max_length=COMMENT_CONTENT_MAX_LENGTH,
    )

    status = models.CharField(
        max_length=10,
        choices=CONTENT_STATUS_CHOICES,
        default='pending',
        db_index=True,
    )

    is_removed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    objects = CommentManager()

    class Meta:
        db_table = 'posts_comment'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['post', 'status', 'created_at']),
            models.Index(fields=['author', '-created_at']),
        ]

    def __str__(self):
        snippet = (self.content or '')[:40]
        return f'Comment<{self.id}> on {self.post_id} — "{snippet}..."'

    @property
    def is_reply(self) -> bool:
        return self.parent_id is not None


class Reaction(models.Model):
    """
    A single user's reaction to a post.

    Two types only:
      - 'love'  : a heart ("I care about this")
      - 'me_too': "I thought I was the only one" (solidarity)

    Reactions are toggled (one tap = add, second tap = remove).
    Users can have at most one of each type per post.
    """

    id = models.BigAutoField(primary_key=True)
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='reactions',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reactions',
    )
    reaction_type = models.CharField(
        max_length=10,
        choices=REACTION_TYPES,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'posts_reaction'
        unique_together = ('post', 'user', 'reaction_type')
        indexes = [
            models.Index(fields=['post', 'reaction_type']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f'{self.user_id} -> {self.reaction_type} on {self.post_id}'


class AnonymousLetter(models.Model):
    """
    A one-way, private note to a post's author.

    Why not DMs?
      DMs create:
        - two-way harassment pressure
        - the ability to spam many people quickly
        - pressure on the recipient to reply
      Letters prevent all three:
        - sender cannot see whether the author is online
        - author has no reply button (they can mark as read only)
        - letters are tied to a single post — no way to keep messaging

    A letter can be anonymous or signed (same `is_sender_anonymous`
    flag as posts/comments).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='letters',
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_letters',
    )

    is_sender_anonymous = models.BooleanField(default=True)

    content = models.TextField(
        max_length=LETTER_CONTENT_MAX_LENGTH,
        help_text='Max 500 chars. Letters are intentionally short — not DMs.',
    )

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    objects = AnonymousLetterManager()

    class Meta:
        db_table = 'posts_anonymous_letter'
        ordering = ['-created_at']
        indexes = [
            # Query: "all letters for a given post, newest first"
            # (used by the letter detail / list-per-post view)
            models.Index(fields=['post', '-created_at'], name='posts_letter_post_idx'),
            # Query: "unread letters" for a specific user's posts.
            # The join `post__author=me` is served by the `post` FK index
            # plus the `is_read` index below — Postgres will plan the
            # join + filter on both efficiently without a compound index.
            models.Index(fields=['is_read'], name='posts_letter_read_idx'),

            # Query: "letters I've sent", ordered by recency
            models.Index(fields=['sender', '-created_at'], name='posts_letter_sender_idx'),
        ]

    def __str__(self):
        return f'Letter<{self.id}> from {self.sender_id} to post {self.post_id}'



class SavedPost(models.Model):
    """
    A user's private bookmark of a post.

    Why private:
      - Users may save posts about abuse, self-harm, or grief that
        they do not want on a public "saved" list. The saved list is
        visible only to its owner, always.
      - There is no follower-visible "saved by" count.

    Behavior:
      - Toggled via POST /api/posts/<id>/save/ (add or remove).
      - Deleting a post cascades — saves disappear with it.
      - Private profile deletion cascades — the saves are wiped
        (via User CASCADE) so the saved row is orphaned and removed.
    """

    id = models.BigAutoField(primary_key=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_posts',
    )
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='saved_by',
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'posts_saved_post'
        unique_together = ('user', 'post')
        ordering = ['-created_at']
        indexes = [
            # Query: "list my saved posts, newest first"
            models.Index(fields=['user', '-created_at'], name='saved_user_cr_idx'),
            # Query: "is this post saved by me?" (used by PostSerializer)
            models.Index(fields=['post'], name='saved_post_idx'),
        ]

    def __str__(self):
        return f'{self.user_id} saved {self.post_id}'