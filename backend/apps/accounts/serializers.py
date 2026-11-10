import re

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .constants import BIO_MAX_LENGTH, DISPLAY_NAME_MAX_LENGTH, USERNAME_REGEX
from .models import AvatarUpload, Block, Companion, StandWith, UserSession

User = get_user_model()


class AvatarURLMixin:
    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get('request')
        url = obj.avatar.url
        return request.build_absolute_uri(url) if request else url


class PublicUserSerializer(AvatarURLMixin, serializers.ModelSerializer):
    """What anyone sees of a public profile. No relationship counts."""
    is_private = serializers.BooleanField(source='is_profile_private', read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'display_name', 'avatar_url', 'bio',
            'is_verified_admin', 'is_private',
        ]


class PrivateUserSerializer(serializers.ModelSerializer):
    is_private = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'display_name', 'avatar_url', 'is_private']

    def get_is_private(self, obj):
        return True

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.avatar.url) if request else obj.avatar.url


class ViewerAwareUserSerializer(PublicUserSerializer):
    """
    Adds relationship flags from the viewer's perspective.
    No follower counts. No audience signals.
    """
    standing_with = serializers.SerializerMethodField()
    companion_status = serializers.SerializerMethodField()
    blocked_by_me = serializers.SerializerMethodField()
    has_blocked_me = serializers.SerializerMethodField()

    class Meta(PublicUserSerializer.Meta):
        fields = PublicUserSerializer.Meta.fields + [
            'standing_with', 'companion_status', 'blocked_by_me', 'has_blocked_me',
        ]

    def _viewer(self):
        req = self.context.get('request')
        return req.user if req and req.user.is_authenticated else None

    def get_standing_with(self, obj):
        v = self._viewer()
        if not v:
            return False
        return StandWith.objects.filter(stander=v, target=obj).exists()

    def get_companion_status(self, obj):
        v = self._viewer()
        if not v or v.id == obj.id:
            return None
        row = Companion.objects.filter(
            initiator=v, recipient=obj
        ).first() or Companion.objects.filter(
            initiator=obj, recipient=v
        ).first()
        if not row:
            return None
        return {
            'id': row.id,
            'status': row.status,
            'initiated_by_me': str(row.initiator_id) == str(v.id),
        }

    def get_blocked_by_me(self, obj):
        v = self._viewer()
        if not v:
            return False
        return Block.objects.filter(blocker=v, blocked=obj).exists()

    def get_has_blocked_me(self, obj):
        v = self._viewer()
        if not v:
            return False
        return Block.objects.filter(blocker=obj, blocked=v).exists()


class MeSerializer(AvatarURLMixin, serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    avatar_url = serializers.SerializerMethodField()
    pending_companion_requests_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'display_name', 'full_name',
            'first_name', 'last_name', 'avatar_url', 'bio',
            'is_profile_private', 'is_verified_admin', 'is_staff',
            'accepts_companion_requests',
            'pending_companion_requests_count',
            'date_joined', 'last_active', 'last_login',
        ]
        read_only_fields = [
            'id', 'email', 'full_name', 'is_verified_admin', 'is_staff',
            'date_joined', 'last_active', 'last_login',
            'pending_companion_requests_count',
        ]

    def get_pending_companion_requests_count(self, obj):
        return Companion.objects.filter(recipient=obj, status='pending').count()


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['display_name', 'first_name', 'last_name', 'bio']

    def validate_display_name(self, value):
        if value and len(value) > DISPLAY_NAME_MAX_LENGTH:
            raise serializers.ValidationError(f'Max {DISPLAY_NAME_MAX_LENGTH} characters.')
        return value.strip()

    def validate_bio(self, value):
        if value and len(value) > BIO_MAX_LENGTH:
            raise serializers.ValidationError(f'Max {BIO_MAX_LENGTH} characters.')
        return value.strip()


class UsernameUpdateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=30)

    def validate_username(self, value):
        value = value.strip()
        if not re.match(USERNAME_REGEX, value):
            raise serializers.ValidationError(
                'Username must be 3–30 characters: letters, numbers, underscores.'
            )
        qs = User.objects.filter(username__iexact=value)
        if self.context.get('user'):
            qs = qs.exclude(pk=self.context['user'].pk)
        if qs.exists():
            raise serializers.ValidationError('Username already taken.')
        return value


class AvatarUploadSerializer(serializers.Serializer):
    avatar = serializers.ImageField()

    def validate_avatar(self, value):
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('Max file size is 5 MB.')
        return value


class CompanionControlSerializer(serializers.ModelSerializer):
    """Only exposes accept/decline toggle. Private to the two parties."""
    peer = serializers.SerializerMethodField()

    class Meta:
        model = Companion
        fields = ['id', 'status', 'initiated_by_me', 'peer', 'created_at', 'responded_at']
        read_only_fields = fields

    initiated_by_me = serializers.SerializerMethodField()

    def get_initiated_by_me(self, obj):
        v = self.context.get('request').user
        return str(obj.initiator_id) == str(v.id)

    def get_peer(self, obj):
        v = self.context.get('request').user
        other = obj.recipient if str(obj.initiator_id) == str(v.id) else obj.initiator
        return PublicUserSerializer(other, context=self.context).data


class StandWithItemSerializer(serializers.ModelSerializer):
    """Only the stander ever sees these. Never the target."""
    target = PublicUserSerializer(read_only=True)

    class Meta:
        model = StandWith
        fields = ['id', 'target', 'created_at']


class BlockSerializer(serializers.ModelSerializer):
    blocked = PublicUserSerializer(read_only=True)

    class Meta:
        model = Block
        fields = ['id', 'blocked', 'created_at']


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSession
        fields = ['id', 'ip', 'user_agent', 'created_at', 'ended_at']


class AvatarHistorySerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = AvatarUpload
        fields = ['id', 'url', 'size_bytes', 'width', 'height', 'is_current', 'created_at']

    def get_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.file.url) if request else obj.file.url