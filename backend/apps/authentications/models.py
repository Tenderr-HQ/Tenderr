import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class OAuthAccount(models.Model):
    """Links a User to a Google or Apple identity."""
    PROVIDERS = [('google', 'Google'), ('apple', 'Apple')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='oauth_accounts',
    )
    provider = models.CharField(max_length=20, choices=PROVIDERS, db_index=True)
    provider_uid = models.CharField(max_length=255, db_index=True)
    provider_email = models.EmailField(blank=True)
    raw_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_login_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'auth_oauth_account'
        unique_together = ('provider', 'provider_uid')
        indexes = [models.Index(fields=['provider', 'provider_uid'])]

    def __str__(self):
        return f'{self.provider}:{self.provider_uid} -> {self.user_id}'

    def touch_login(self):
        self.last_login_at = timezone.now()
        self.save(update_fields=['last_login_at'])


class EmailVerificationToken(models.Model):
    """One-time token for email verification."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='email_verifications',
    )
    token = models.CharField(max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'auth_email_verification_token'
        ordering = ['-created_at']

    @property
    def is_valid(self):
        return self.used_at is None and self.expires_at > timezone.now()


class PasswordResetToken(models.Model):
    """One-time token for password reset."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='password_resets',
    )
    token = models.CharField(max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    requested_ip = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'auth_password_reset_token'
        ordering = ['-created_at']

    @property
    def is_valid(self):
        return self.used_at is None and self.expires_at > timezone.now()


class LoginAttempt(models.Model):
    """For brute-force detection and account lockout."""
    email = models.EmailField(db_index=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    success = models.BooleanField(default=False)
    user_agent = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'auth_login_attempt'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email', '-created_at']),
            models.Index(fields=['ip', '-created_at']),
        ]