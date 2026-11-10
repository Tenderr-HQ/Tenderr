import re
from django.contrib.auth import authenticate, get_user_model
from django.db import transaction
from rest_framework import serializers

from .services.tokens import issue_tokens
from .validators import validate_strong_password

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120)
    username = serializers.CharField(max_length=30)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('This email is already registered.')
        return value

    def validate_username(self, value):
        value = value.strip()
        if not re.match(r'^[a-zA-Z0-9_]{3,30}$', value):
            raise serializers.ValidationError(
                'Username must be 3–30 characters: letters, numbers, underscores.'
            )
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('This username is already taken.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        validate_strong_password(attrs['password'])
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        full_name = validated_data.pop('full_name').strip()
        first, *rest = full_name.split(' ', 1)
        last = rest[0] if rest else ''
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=password,
            first_name=first,
            last_name=last,
            display_name=full_name,
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        request = self.context.get('request')
        user = authenticate(
            request=request,
            email=attrs['email'].lower().strip(),
            password=attrs['password'],
        )
        if not user:
            raise serializers.ValidationError({'detail': 'Invalid email or password.'})
        if not user.is_active:
            raise serializers.ValidationError({'detail': 'This account is disabled.'})
        attrs['user'] = user
        return attrs


class OAuthSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(choices=['google', 'apple'])
    id_token = serializers.CharField()


class TokenPairSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = serializers.DictField()


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Passwords do not match.'})
        validate_strong_password(attrs['new_password'])
        return attrs


class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.CharField()