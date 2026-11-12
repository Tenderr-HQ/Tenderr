"""
Serializers for the posts app.

WHAT IS A SERIALIZER?
  A serializer has two jobs:
    1. Turn database rows into JSON the frontend can use.
    2. Turn incoming JSON into validated data the database can store.

THE MOST IMPORTANT RULE IN THIS FILE:
  A serializer must NEVER leak the real author of an anonymous post.
  Other users must only ever see the string "Anonymous" or a masked
  placeholder. The backend keeps the real author FK for safety, but
  the serializer strips it before it leaves the server.

  If you change how `author_info` is built, re-read the comment on
  `build_author_info()` before you ship.
"""
from rest_framework import serializers

from apps.posts.constants import (
    COMMENT_CONTENT_MAX_LENGTH,
    LETTER_CONTENT_MAX_LENGTH,
    POST_CONTENT_MAX_LENGTH,
)
from apps.posts.models import AnonymousLetter, Comment, Post, Reaction


# Anonymity helper

def build_author_info(author, is_anonymous, viewer=None):
    """
    Return the small dict the frontend needs to render the author chip.

    There are three possible shapes:

      Anonymous post:
        {
          "type": "anonymous",
          "display": "Anonymous",
          "clickable": False,
          "username": None,
          "avatar_url": None,
        }

      Public post from a private profile (viewer is not the owner):
        {
          "type": "private",
          "display": "Private User",   # display name still shown, but no link
          "clickable": False,
          "username": None,
          "avatar_url": <avatar or None>,
        }

      Public post from a public profile:
        {
          "type": "public",
          "display": "Ada Lovelace",
          "clickable": True,
          "username": "ada_lovelace",
          "avatar_url": "https://.../avatar.jpg",
        }

    `viewer` is optional. When None (anonymous request), private profiles
    are still masked because there is no way to prove ownership.
    """
    if is_anonymous:
        return {
            'type': 'anonymous',
            'display': 'Anonymous',
            'clickable': False,
            'username': None,
            'avatar_url': None,
        }

    # Here we know the author is being shown publicly. But the author
    # might still have a private profile, so we mask the link but keep
    # the display name. This matches how Instagram handles private
    # accounts in feed views — you can still see they exist, just not
    # click through.
    viewer_id = getattr(viewer, 'id', None)
    is_owner = viewer_id and str(viewer_id) == str(author.id)
    if author.is_profile_private and not is_owner:
        return {
            'type': 'private',
            'display': author.display_name or author.username,
            'clickable': False,
            'username': None,
            'avatar_url': author.avatar.url if author.avatar else None,
        }

    return {
        'type': 'public',
        'display': author.display_name or author.username,
        'clickable': True,
        'username': author.username,
        'avatar_url': author.avatar.url if author.avatar else None,
    }


# Reaction serializer

class ReactionSummarySerializer(serializers.Serializer):
    """
    Not a ModelSerializer — this is a plain dict shape used inside
    PostSerializer to show the reaction counts and the viewer's own
    reactions (so the frontend can highlight the buttons the user
    already pressed).
    """
    love = serializers.IntegerField()
    me_too = serializers.IntegerField()
    mine = serializers.ListField(child=serializers.CharField())


# Comment serializer

class CommentSerializer(serializers.ModelSerializer):
    """
    Serializes a single comment.
    """
    author_info = serializers.SerializerMethodField()
    is_op = serializers.SerializerMethodField(
        help_text='True when this comment is by the post author AND anonymous.',
    )
    replies_count = serializers.SerializerMethodField()
    can_reply = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'post', 'parent', 'content', 'is_anonymous',
            'author_info', 'is_op', 'replies_count', 'can_reply', 'created_at',
        ]
        read_only_fields = ['id', 'post', 'parent', 'author_info', 'is_op', 'created_at']

    # --- author_info ---
    def get_author_info(self, obj):
        viewer = self.context['request'].user if self.context.get('request') else None
        return build_author_info(obj.author, obj.is_anonymous, viewer)

    # --- is_op ---
    def get_is_op(self, obj):
        """
        The OP tag helps readers know which replies come from the
        original poster, WITHOUT revealing who they are. Only applied
        when the comment is anonymous — public replies already show
        the author.
        """
        return bool(obj.is_anonymous and obj.author_id == obj.post.author_id)

    # --- replies_count ---
    def get_replies_count(self, obj):
        return obj.replies.filter(status='approved', is_removed=False).count()

    # --- can_reply ---
    def get_can_reply(self, obj):
        """
        One-level depth rule:
          - top-level comments (parent=None) → reply allowed
          - replies (parent is not None)     → reply button hidden
        Also respects `allow_comments` on the post and the viewer's
        block status.
        """
        if obj.parent_id is not None:
            return False
        if not obj.post.allow_comments:
            return False
        viewer = self.context['request'].user if self.context.get('request') else None
        if not viewer or not viewer.is_authenticated:
            return False
        return obj.post.can_be_viewed_by(viewer)


# Post serializer

class PostSerializer(serializers.ModelSerializer):
    """
    Serializes a feed post with reaction counts and author masking.
    """
    author_info = serializers.SerializerMethodField()
    reactions = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    letters_count = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'content', 'category', 'intent', 'allow_comments',
            'is_anonymous', 'author_info', 'reactions',
            'comments_count', 'letters_count', 'is_mine', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'author_info', 'reactions', 'comments_count',
            'letters_count', 'is_mine', 'created_at', 'updated_at',
        ]

    # --- author_info ---
    def get_author_info(self, obj):
        viewer = self.context['request'].user if self.context.get('request') else None
        return build_author_info(obj.author, obj.is_anonymous, viewer)

    # --- reactions ---
    def get_reactions(self, obj):
        """
        Returns:
          {
            "love": 42,
            "me_too": 17,
            "mine": ["love"]     ← reactions the current viewer pressed
          }
        `mine` is empty for anonymous viewers.
        """
        # `obj.reactions.all()` uses the prefetch from the feed queryset,
        # so this does not fire one query per post on the feed.
        counts = {'love': 0, 'me_too': 0}
        mine = []
        viewer = self.context['request'].user if self.context.get('request') else None
        viewer_id = getattr(viewer, 'id', None)

        for r in obj.reactions.all():
            counts[r.reaction_type] = counts.get(r.reaction_type, 0) + 1
            if viewer_id and str(r.user_id) == str(viewer_id):
                mine.append(r.reaction_type)

        return {'love': counts['love'], 'me_too': counts['me_too'], 'mine': mine}

    # --- comments_count ---
    def get_comments_count(self, obj):
        """
        Only approved comments. Returns None when the post has
        comments disabled — the frontend uses that to hide the counter.
        """
        if not obj.allow_comments:
            return None
        return obj.comments.filter(status='approved', is_removed=False).count()

    # --- letters_count ---
    def get_letters_count(self, obj):
        """
        How many letters this post has received. Only the author sees
        this number; everyone else sees 0.
        """
        viewer = self.context['request'].user if self.context.get('request') else None
        if not viewer or not viewer.is_authenticated or str(viewer.id) != str(obj.author_id):
            return 0
        return obj.letters.count()

    # --- is_mine ---
    def get_is_mine(self, obj):
        viewer = self.context['request'].user if self.context.get('request') else None
        return bool(viewer and viewer.is_authenticated and str(viewer.id) == str(obj.author_id))


# Write serializers (create/update payloads)

class PostCreateSerializer(serializers.ModelSerializer):
    """
    Payload for creating a new post.

    The `author` field is set by the view from request.user — the
    client cannot choose another author.
    """
    content = serializers.CharField(max_length=POST_CONTENT_MAX_LENGTH)
    is_anonymous = serializers.BooleanField(default=True)

    class Meta:
        model = Post
        fields = ['content', 'category', 'intent', 'allow_comments', 'is_anonymous']

    def validate_content(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('Post cannot be empty.')
        return value


class CommentCreateSerializer(serializers.ModelSerializer):
    """
    Payload for creating a comment or reply.

    The view validates:
      - the post allows comments
      - the parent (if provided) is a top-level comment
      - the viewer is not blocked
    """
    content = serializers.CharField(max_length=COMMENT_CONTENT_MAX_LENGTH)
    parent = serializers.UUIDField(required=False, allow_null=True)
    is_anonymous = serializers.BooleanField(default=True)

    class Meta:
        model = Comment
        fields = ['content', 'parent', 'is_anonymous']

    def validate_content(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('Comment cannot be empty.')
        return value


# Anonymous Letter serializer

class AnonymousLetterCreateSerializer(serializers.ModelSerializer):
    """
    Payload for sending a letter.

    Only `content` and `is_sender_anonymous` come from the client.
    `post` and `sender` are set by the view.
    """
    content = serializers.CharField(max_length=LEITER if False else LETTER_CONTENT_MAX_LENGTH)

    class Meta:
        model = AnonymousLetter
        fields = ['content', 'is_sender_anonymous']

    def validate_content(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('Letter cannot be empty.')
        return value


class AnonymousLetterInboxSerializer(serializers.ModelSerializer):
    """
    How letters look in the author's inbox.

    The sender's identity is masked with the same rules as posts —
    anonymous senders show as "Anonymous", public senders show a
    clickable author chip (unless they have a private profile).
    """
    sender_info = serializers.SerializerMethodField()
    post_preview = serializers.SerializerMethodField()

    class Meta:
        model = AnonymousLetter
        fields = [
            'id', 'content', 'is_sender_anonymous',
            'sender_info', 'post_preview', 'is_read', 'created_at',
        ]
        read_only_fields = fields

    def get_sender_info(self, obj):
        viewer = self.context['request'].user if self.context.get('request') else None
        return build_author_info(obj.sender, obj.is_sender_anonymous, viewer)

    def get_post_preview(self, obj):
        snippet = (obj.post.content or '')[:80]
        return {'id': obj.post.id, 'snippet': snippet}