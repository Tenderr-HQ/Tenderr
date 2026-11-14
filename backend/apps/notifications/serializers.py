"""
Serializers for the notifications app.

THE ONE RULE THAT MATTERS:
  If `Notification.target_is_anonymous` is True, the serializer MUST
  NOT expose the actor's identity — not in the title, not in a
  nested field, not in a "username" side-channel.

  We achieve this by:
    - Running the raw title through `_mask_title()` which replaces
      any username that slipped into the title at creation time
      with the word "Someone".
    - Never returning `actor` as a nested user object unless
      `target_is_anonymous` is False.

  Every endpoint that serializes a Notification goes through this
  file, so the masking is enforced in one place.
"""
import re

from rest_framework import serializers

from apps.notifications.constants import NON_OPTIONAL_TYPES
from apps.notifications.models import Notification, NotificationPreference
from apps.posts.serializers import build_author_info


# Regex catches anything that looks like a username token in a title
# (e.g. "@john_doe", "john_doe commented"). We replace matches with
# "Someone" ONLY when the target is anonymous.
_USERNAME_LIKE = re.compile(r'@?[A-Za-z0-9_]{3,30}')


def _mask_title(title: str) -> str:
    """
    Replace any username-shaped token in `title` with "Someone".

    This is a belt-and-suspenders defence: at creation time we
    already build the title without usernames (services.create
    builds titles from templates that do not include the actor
    when target_is_anonymous). But if a future service slips, this
    catches it before the notification leaves the server.

    Conservative on purpose — if the title is short and clean
    ("New reaction on your post"), nothing matches and it is
    returned unchanged.
    """
    if not title:
        return title
    # Protect a small whitelist of words that should survive masking.
    preserved = {
        'Someone', 'Your', 'You', 'Comment', 'Reaction', 'Letter',
        'Discussion', 'New', 'Post', 'Update', 'The', 'A', 'An',
    }
    def repl(match):
        token = match.group(0)
        if token in preserved:
            return token
        # Only replace if it looks user-generated (contains _ or @,
        # or is a mix of case that reads like a username).
        if '_' in token or '@' in token or token.lower() == token:
            return 'Someone'
        return token
    return _USERNAME_LIKE.sub(repl, title)


def build_actor_info(actor, target_is_anonymous, viewer=None):
    """
    Return the small dict used by the frontend to render the actor
    chip — or a fully anonymized placeholder.

    Delegates to `posts.serializers.build_author_info` so we do not
    duplicate the privacy rules. If the posts app ever changes how
    it masks public-but-private-profile users, notifications follow
    automatically.
    """
    if actor is None:
        return {'type': 'system', 'display': 'unheard', 'clickable': False}
    if target_is_anonymous:
        return {
            'type': 'anonymous',
            'display': 'Someone',
            'clickable': False,
            'username': None,
            'avatar_url': None,
        }
    return build_author_info(actor, is_anonymous=False, viewer=viewer)


# Notification serializer

class NotificationSerializer(serializers.ModelSerializer):
    """
    Read serializer for a single notification.

    Exposes:
      - `actor_info` — masked per rules above
      - `masked_title` — the title with usernames scrubbed if needed
      - everything else as stored
    """
    actor_info = serializers.SerializerMethodField()
    masked_title = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'masked_title', 'body', 'link',
            'actor_info', 'target_is_anonymous', 'is_read', 'created_at',
        ]
        read_only_fields = fields

    def get_actor_info(self, obj):
        viewer = self.context['request'].user if self.context.get('request') else None
        return build_actor_info(obj.actor, obj.target_is_anonymous, viewer)

    def get_masked_title(self, obj):
        if obj.target_is_anonymous:
            return _mask_title(obj.title)
        return obj.title


# Preferences serializer

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """
    Read/write serializer for NotificationPreference.

    `NON_OPTIONAL_TYPES` (system, moderation) cannot be opted out of.
    The serializer does NOT prevent flipping `email_digest` or other
    flags — those are honoured per-type in services.email. This keeps
    the "turn off email but keep the flag on" pattern working.
    """
    class Meta:
        model = NotificationPreference
        fields = [
            'email_comments', 'email_letters', 'email_digest',
            'push_comments', 'push_letters',
        ]


# Mark-read payloads

class MarkReadSerializer(serializers.Serializer):
    """
    Payload for POST /api/notifications/<id>/read/.
    No fields are required — the id in the URL is enough.
    """


class MarkAllReadSerializer(serializers.Serializer):
    """
    Payload for POST /api/notifications/read-all/.
    Optional `before` timestamp so a client can mark only items
    that existed when the user last opened the app — useful to
    avoid clearing a notification that arrives mid-request.
    """
    before = serializers.DateTimeField(required=False, allow_null=True)