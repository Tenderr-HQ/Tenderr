"""
Serializers for the communities app.

Key ideas to understand before reading the code:

  1. `build_author_info` from apps.posts is reused — anonymity rules
     are the same everywhere. If you ever change masking rules, change
     them in ONE place (posts/serializers.py), and they will apply to
     communities, comments, discussions, and letters automatically.

  2. `is_admin_post` on CommunityPost short-circuits anonymity:
     admins are ALWAYS shown publicly. That is the trust contract.

  3. Discussion messages respect `is_anonymous` exactly like posts.

  4. `is_active` on a discussion is computed live (status + close_at)
     rather than stored. The frontend uses it to swap the message box
     for a "this discussion has ended" banner without extra requests.
"""
from django.utils import timezone
from rest_framework import serializers

from apps.communities.constants import (
    COMMUNITY_POST_CONTENT_MAX,
    COMMUNITY_POST_TITLE_MAX,
    DISCUSSION_DESCRIPTION_MAX,
    DISCUSSION_MAX_DURATION_DAYS,
    DISCUSSION_MESSAGE_MAX,
    DISCUSSION_MIN_DURATION_MINUTES,
    DISCUSSION_TITLE_MAX,
)
from apps.communities.models import (
    Community,
    CommunityMembership,
    CommunityPost,
    Discussion,
    DiscussionMessage,
)
from apps.communities.services.media import validate_community_media
from apps.posts.serializers import build_author_info


# Author-info helpers specific to communities

def build_community_author_info(author, is_anonymous, is_admin_post, viewer=None):
    """
    Extends the base `build_author_info` with an `is_admin` flag so the
    frontend can render a shield icon and verified badge next to admin
    posts and discussion authors.

    Admins are always public — that's the trust contract inside a
    community. If `is_admin_post=True` and `is_anonymous=True` (which
    shouldn't happen — the model forces admin posts public via service
    logic), this function still shows the admin publicly. Defense in
    depth.
    """
    effective_anon = bool(is_anonymous) and not is_admin_post
    info = build_author_info(author, effective_anon, viewer)
    info['is_admin'] = bool(is_admin_post)
    return info


# Community

class CommunityListSerializer(serializers.ModelSerializer):
    """
    Shown on the communities list page.
    Includes counts (via queryset annotation `with_counts()`) so the
    frontend can show "142 members · 37 posts" without N+1 queries.
    Also reports whether the current user is a member.
    """
    member_count = serializers.IntegerField(read_only=True)
    post_count = serializers.IntegerField(read_only=True)
    banner_url = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = Community
        fields = [
            'id', 'name', 'slug', 'description',
            'banner_url', 'is_official',
            'member_count', 'post_count', 'is_member',
            'created_at',
        ]

    def get_banner_url(self, obj):
        if not obj.banner:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.banner.url) if request else obj.banner.url

    def get_is_member(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        # `with_counts` does not annotate membership; we check via a single
        # cached query. For list views, override in the view with a
        # precomputed set to avoid N+1 (see CommunityListView).
        precomputed = self.context.get('membership_community_ids')
        if precomputed is not None:
            return obj.id in precomputed
        return CommunityMembership.objects.filter(
            user=request.user, community=obj,
        ).exists()


class CommunityDetailSerializer(CommunityListSerializer):
    """
    Detail view adds the admin roster (only usernames + display names,
    never emails) so users know who runs the space.
    """
    admins = serializers.SerializerMethodField()

    class Meta(CommunityListSerializer.Meta):
        fields = CommunityListSerializer.Meta.fields + ['admins']

    def get_admins(self, obj):
        return [
            {
                'id': str(u.id),
                'username': u.username,
                'display_name': u.display_name,
                'avatar_url': u.avatar.url if u.avatar else None,
            }
            for u in obj.admins.all()
        ]


# Community post

class CommunityPostSerializer(serializers.ModelSerializer):
    """
    Read serializer for community posts.

    Note: media URL is exposed as `media_url` (not the raw FileField)
    so the frontend always gets an absolute URL.
    """
    author_info = serializers.SerializerMethodField()
    media_url = serializers.SerializerMethodField()
    comments_disabled = serializers.SerializerMethodField()

    class Meta:
        model = CommunityPost
        fields = [
            'id', 'community', 'title', 'content',
            'media_url', 'media_type',
            'is_admin_post', 'is_pinned', 'is_archived',
            'is_anonymous', 'author_info',
            'comments_disabled',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_author_info(self, obj):
        viewer = self.context['request'].user if self.context.get('request') else None
        return build_community_author_info(
            obj.author, obj.is_anonymous, obj.is_admin_post, viewer,
        )

    def get_media_url(self, obj):
        if not obj.media:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.media.url) if request else obj.media.url

    def get_comments_disabled(self, obj):
        # Placeholder — community posts do not have comments yet.
        # If you add them later, this is where the toggle lives.
        return True


class CommunityPostCreateSerializer(serializers.ModelSerializer):
    """
    Create serializer.

    Business rules enforced here (in addition to view-level checks):
      - media validated via `services.media.validate_community_media`
      - `media_type` set from the validator's return value
      - `is_admin_post` is set by the view (based on community.admins),
        never trusted from the client.

    Members can post text-only (is_anonymous honored). If they attach
    media, `is_anonymous` is forced False — because a selfie or a
    recognizable video breaks anonymity and we should not pretend
    otherwise. This is documented in the model.
    """
    title = serializers.CharField(max_length=COMMUNITY_POST_TITLE_MAX)
    content = serializers.CharField(max_length=COMMUNITY_POST_CONTENT_MAX)
    media = serializers.FileField(required=False, allow_null=True)
    is_anonymous = serializers.BooleanField(default=True)

    class Meta:
        model = CommunityPost
        fields = ['title', 'content', 'media', 'is_anonymous']

    def validate_title(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('Title cannot be empty.')
        return value

    def validate_content(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('Content cannot be empty.')
        return value

    def validate(self, attrs):
        # Media validation — returns 'image' | 'video' | 'none'
        media = attrs.get('media')
        if media:
            attrs['media_type'] = validate_community_media(media)
            # Rule: media forces public author
            attrs['is_anonymous'] = False
        else:
            attrs['media_type'] = 'none'
        return attrs


# Discussion

class DiscussionSerializer(serializers.ModelSerializer):
    """
    Read serializer for discussions.

    `is_active` is computed from status + close_at (never stored) so
    the frontend does not need to poll. `seconds_remaining` is a
    convenience field for a countdown UI.

    Admin identity is always shown — that's a deliberate public safety
    contract. Members' identities inside messages still obey
    `is_anonymous`.
    """
    admin_info = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(read_only=True)
    seconds_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Discussion
        fields = [
            'id', 'community', 'title', 'description',
            'is_sensitive', 'is_archived',
            'status', 'close_at',
            'is_active', 'seconds_remaining',
            'admin_info', 'message_count', 'created_at',
        ]
        read_only_fields = fields

    def get_admin_info(self, obj):
        # Admin info — reuse the same shape as community post authors
        # but always public.
        return {
            'type': 'public',
            'display': obj.admin.display_name or obj.admin.username,
            'clickable': True,
            'username': obj.admin.username,
            'avatar_url': obj.admin.avatar.url if obj.admin.avatar else None,
            'is_admin': True,
        }

    def get_message_count(self, obj):
        return obj.messages.filter(is_removed=False).count()

    def get_seconds_remaining(self, obj):
        if obj.status != 'open':
            return 0
        delta = (obj.close_at - timezone.now()).total_seconds()
        return max(0, int(delta))


class DiscussionCreateSerializer(serializers.ModelSerializer):
    """
    Admin-only create payload.

    Validates `close_at` against the min/max duration constants so an
    admin cannot accidentally schedule a discussion to close in the
    past or 3 years from now.

    The view sets `admin` and `community` from the URL context.
    """
    title = serializers.CharField(max_length=DISCUSSION_TITLE_MAX)
    description = serializers.CharField(max_length=DISCUSSION_DESCRIPTION_MAX)
    close_at = serializers.DateTimeField()

    class Meta:
        model = Discussion
        fields = ['title', 'description', 'is_sensitive', 'close_at']

    def validate_title(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('Title cannot be empty.')
        return value

    def validate_description(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('Description cannot be empty.')
        return value

    def validate_close_at(self, value):
        now = timezone.now()
        if value <= now + timezone.timedelta(minutes=DISCUSSION_MIN_DURATION_MINUTES):
            raise serializers.ValidationError(
                f'close_at must be at least {DISCUSSION_MIN_DURATION_MINUTES} '
                f'minutes in the future.'
            )
        if value > now + timezone.timedelta(days=DISCUSSION_MAX_DURATION_DAYS):
            raise serializers.ValidationError(
                f'close_at cannot be more than {DISCUSSION_MAX_DURATION_DAYS} days out.'
            )
        return value


# Discussion message

class DiscussionMessageSerializer(serializers.ModelSerializer):
    """
    Read serializer for discussion messages.

    Anonymity works exactly like posts — `build_author_info` handles
    masking and privacy.
    """
    author_info = serializers.SerializerMethodField()

    class Meta:
        model = DiscussionMessage
        fields = ['id', 'discussion', 'content', 'is_anonymous', 'author_info', 'created_at']
        read_only_fields = ['id', 'discussion', 'author_info', 'created_at']

    def get_author_info(self, obj):
        viewer = self.context['request'].user if self.context.get('request') else None
        return build_author_info(obj.author, obj.is_anonymous, viewer)


class DiscussionMessageCreateSerializer(serializers.ModelSerializer):
    """
    Create payload for a message inside a discussion.

    Content length capped by DISCUSSION_MESSAGE_MAX.
    """
    content = serializers.CharField(max_length=DISCUSSION_MESSAGE_MAX)
    is_anonymous = serializers.BooleanField(default=True)

    class Meta:
        model = DiscussionMessage
        fields = ['content', 'is_anonymous']

    def validate_content(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('Message cannot be empty.')
        return value


# Membership

class MembershipSerializer(serializers.ModelSerializer):
    """
    Read serializer for the current user's membership — used by
    /me endpoint to list which communities they belong to.
    """
    community = CommunityListSerializer(read_only=True)

    class Meta:
        model = CommunityMembership
        fields = ['id', 'community', 'source', 'joined_at']
        read_only_fields = fields