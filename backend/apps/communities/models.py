"""
Database models for communities.

Every model documents *why* it exists, so a reader can understand
the product intent without hunting through other files.
"""
import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from .constants import (
    COMMUNITY_POST_CONTENT_MAX,
    COMMUNITY_POST_MEDIA_TYPES,
    COMMUNITY_POST_TITLE_MAX,
    DISCUSSION_DESCRIPTION_MAX,
    DISCUSSION_MESSAGE_MAX,
    DISCUSSION_STATUS,
    DISCUSSION_TITLE_MAX,
    MEMBERSHIP_SOURCE,
)
from .managers import (
    CommunityManager,
    CommunityMembershipManager,
    CommunityPostManager,
    DiscussionManager,
    DiscussionMessageManager,
)


class Community(models.Model):
    """
    A curated hub — e.g. "Survivor Support", "Mental Health Awareness".

    Created and managed by your team. Admins (many-to-many) can post
    and create discussions inside. Members (via CommunityMembership)
    can participate in discussions.

    `slug` is used in URLs and must be unique.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, db_index=True)
    description = models.TextField()
    banner = models.ImageField(
        upload_to='communities/banners/%Y/%m/', null=True, blank=True,
        help_text='Optional banner image. Recommended aspect ratio 3:1.',
    )
    is_official = models.BooleanField(
        default=True,
        help_text='True for team-created communities. Reserved for future partner-created communities.',
    )
    admins = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='admin_communities',
        blank=True,
        help_text='Users allowed to post admin content and create discussions.',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CommunityManager()

    class Meta:
        db_table = 'communities_community'
        ordering = ['name']
        indexes = [models.Index(fields=['is_official', 'name'])]

    def __str__(self):
        return self.name


class CommunityMembership(models.Model):
    """
    Joining a community. Users do not need to be members to read,
    but must be members to post in discussions.

    Membership is one row per (user, community). There is no
    follower/audience graph here — you can't see who else is a
    member, only that you are one. This matches the privacy
    posture of the whole platform.
    """

    id = models.BigAutoField(primary_key=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='community_memberships',
    )
    community = models.ForeignKey(
        Community,
        on_delete=models.CASCADE,
        related_name='memberships',
    )
    source = models.CharField(
        max_length=20, choices=MEMBERSHIP_SOURCE, default='organic',
        help_text='For analytics — how did the user join?',
    )
    joined_at = models.DateTimeField(auto_now_add=True, db_index=True)

    objects = CommunityMembershipManager()

    class Meta:
        db_table = 'communities_membership'
        unique_together = ('user', 'community')
        indexes = [models.Index(fields=['community', '-joined_at'])]

    def __str__(self):
        return f'{self.user_id} member of {self.community_id}'


class CommunityPost(models.Model):
    """
    A post inside a community. Unlike the anonymous feed, community
    posts can carry an image or video — awareness content lives here.

    Two kinds of authors:
      - `is_admin_post=True`  : authored by a community admin.
                                 Shows the admin's public identity.
      - `is_admin_post=False` : authored by a regular member.
                                 Respects `is_anonymous` like the
                                 rest of the app.

    `is_pinned=True` pins a post to the top of the community's post list.
    `is_archived=True` hides it without deleting data (for moderation).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    community = models.ForeignKey(
        Community, on_delete=models.CASCADE, related_name='posts',
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='community_posts',
    )

    is_admin_post = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)

    title = models.CharField(max_length=COMMUNITY_POST_TITLE_MAX)
    content = models.TextField(max_length=COMMUNITY_POST_CONTENT_MAX)

    media = models.FileField(
        upload_to='communities/posts/%Y/%m/', null=True, blank=True,
        help_text='Optional image or video. Max 50 MB.',
    )
    media_type = models.CharField(
        max_length=10, choices=COMMUNITY_POST_MEDIA_TYPES, default='none',
    )

    is_anonymous = models.BooleanField(
        default=True,
        help_text='Ignored when is_admin_post=True — admins are always public.',
    )

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CommunityPostManager()

    class Meta:
        db_table = 'communities_post'
        ordering = ['-is_pinned', '-created_at']
        indexes = [
            models.Index(fields=['community', '-is_pinned', '-created_at']),
            models.Index(fields=['author', '-created_at']),
        ]

    def __str__(self):
        return f'[{self.community.slug}] {self.title}'


class Discussion(models.Model):
    """
    An admin-created, time-boxed conversation topic inside a community.

    The `close_at` field is the timer. Celery (tasks.py) checks
    every 5 minutes and flips `status` to 'closed' when the timer
    expires. Admins can also close early with a single API call.

    `is_sensitive=True` marks a discussion that needs a trigger
    warning — the frontend blurs the body and requires the user to
    click "I understand" before showing content.

    Closed discussions are readable by everyone but no new messages
    are allowed. This is the key UX difference from a group chat:
    the discussion has a defined lifespan.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    community = models.ForeignKey(
        Community, on_delete=models.CASCADE, related_name='discussions',
    )
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='created_discussions',
        help_text='The admin who created the discussion. Always shown publicly.',
    )

    title = models.CharField(max_length=DISCUSSION_TITLE_MAX)
    description = models.TextField(
        max_length=DISCUSSION_DESCRIPTION_MAX,
        help_text='The prompt shown to participants. Can include a quote, a question, etc.',
    )

    is_sensitive = models.BooleanField(
        default=False,
        help_text='Trigger-warning flag. Frontend must gate the body behind a click.',
    )
    is_archived = models.BooleanField(default=False)

    close_at = models.DateTimeField(
        db_index=True,
        help_text='When the discussion auto-closes. Validated in the serializer.',
    )
    status = models.CharField(
        max_length=10, choices=DISCUSSION_STATUS, default='open', db_index=True,
    )

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    objects = DiscussionManager()

    class Meta:
        db_table = 'communities_discussion'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['community', 'status', '-created_at']),
            models.Index(fields=['status', 'close_at']),  # for the Celery task
        ]

    def __str__(self):
        return f'[{self.community.slug}] {self.title} ({self.status})'

    @property
    def is_active(self) -> bool:
        """
        A discussion is "active" when it's open AND the timer hasn't
        expired yet. The frontend uses this to decide whether to show
        the message box or a "this discussion has ended" banner.
        """
        return self.status == 'open' and self.close_at > timezone.now()

    def close(self) -> None:
        """Idempotent close — safe to call multiple times."""
        if self.status != 'closed':
            self.status = 'closed'
            self.save(update_fields=['status'])


class DiscussionMessage(models.Model):
    """
    A single message inside a discussion.

    Flat and chronological — no threading. Why?
      - Threads invite arguments and deeper rabbit holes.
      - Flat messages feel like a live conversation without the
        pressure of a live chat (no typing indicators, no read
        receipts).
      - Users can still respond to each other by referencing names,
        but structurally the conversation stays one column.

    Anonymity works exactly like the rest of the app.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    discussion = models.ForeignKey(
        Discussion, on_delete=models.CASCADE, related_name='messages',
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='discussion_messages',
    )

    is_anonymous = models.BooleanField(default=True)
    content = models.TextField(max_length=DISCUSSION_MESSAGE_MAX)
    is_removed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    objects = DiscussionMessageManager()

    class Meta:
        db_table = 'communities_discussion_message'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['discussion', 'created_at']),
            models.Index(fields=['author', '-created_at']),
        ]

    def __str__(self):
        return f'Msg<{self.id}> in {self.discussion_id}'