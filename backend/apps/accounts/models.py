import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone

from .constants import BIO_MAX_LENGTH, DISPLAY_NAME_MAX_LENGTH, USERNAME_REGEX
from .managers import UserManager


username_validator = RegexValidator(
    regex=USERNAME_REGEX,
    message='Username must be 3–30 characters: letters, numbers, underscores.',
)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Identity
    email = models.EmailField(unique=True, db_index=True)
    username = models.CharField(
        max_length=30, unique=True, validators=[username_validator], db_index=True,
    )
    display_name = models.CharField(max_length=DISPLAY_NAME_MAX_LENGTH, blank=True)
    first_name = models.CharField(max_length=60, blank=True)
    last_name = models.CharField(max_length=60, blank=True)

    # Profile
    avatar = models.ImageField(upload_to='avatars/%Y/%m/', null=True, blank=True)
    bio = models.CharField(max_length=BIO_MAX_LENGTH, blank=True)

    # Privacy & roles
    is_profile_private = models.BooleanField(default=False)
    is_verified_admin = models.BooleanField(default=False)

    # Companion controls
    accepts_companion_requests = models.BooleanField(default=True)

    # Account status
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # Audit
    date_joined = models.DateTimeField(default=timezone.now)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_active = models.DateTimeField(null=True, blank=True)
    last_user_agent = models.CharField(max_length=255, blank=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'accounts_user'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['username']),
            models.Index(fields=['-date_joined']),
            models.Index(fields=['is_profile_private']),
        ]

    def __str__(self):
        return f'{self.username} <{self.email}>'

    @property
    def full_name(self) -> str:
        name = f'{self.first_name} {self.last_name}'.strip()
        return name or self.display_name or self.username

    @property
    def is_private(self) -> bool:
        return self.is_profile_private

    def can_be_viewed_by(self, viewer) -> bool:
        if not self.is_profile_private:
            return True
        if not viewer or not getattr(viewer, 'is_authenticated', False):
            return False
        return viewer.id == self.id or viewer.is_staff

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.lower().strip()
        if self.username:
            self.username = self.username.strip()
        if not self.display_name:
            self.display_name = self.full_name[:DISPLAY_NAME_MAX_LENGTH]
        super().save(*args, **kwargs)


# ----------------------------------------------------------------
# Stand With — one-way, private bookmark of care.
# The stander sees it on their own list. The target NEVER sees it.
# ----------------------------------------------------------------
class StandWith(models.Model):
    id = models.BigAutoField(primary_key=True)
    stander = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='stand_with_set',
    )
    target = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='stood_with_by_set',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'accounts_stand_with'
        unique_together = ('stander', 'target')
        indexes = [
            models.Index(fields=['stander', '-created_at'], name='acc_sw_stander_idx'),
            models.Index(fields=['target', '-created_at'], name='acc_sw_target_idx'),
        ]

    def __str__(self):
        return f'{self.stander_id} ◆ {self.target_id}'


# ----------------------------------------------------------------
# Companion — mutual 1:1 connection. Requires accept.
# Two records per pair (A->B accepted AND B->A accepted) OR one
# symmetric row. Simpler + easier to reason: one row per pair with
# status. Direction tracked by `initiator`.
# ----------------------------------------------------------------
class Companion(models.Model):
    STATUS = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]
    id = models.BigAutoField(primary_key=True)
    initiator = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='companion_initiated',
    )
    recipient = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='companion_received',
    )
    status = models.CharField(max_length=10, choices=STATUS, default='pending', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'accounts_companion'
        # Can't have more than one row per ordered pair
        unique_together = ('initiator', 'recipient')
        indexes = [
            models.Index(fields=['recipient', 'status'], name='acc_cmp_rec_status_idx'),
            models.Index(fields=['initiator', 'status'], name='acc_cmp_ini_status_idx'),
        ]

    def __str__(self):
        return f'{self.initiator_id} ↔ {self.recipient_id} [{self.status}]'

    @staticmethod
    def pair_key(a_id, b_id):
        return tuple(sorted([str(a_id), str(b_id)]))


# ----------------------------------------------------------------
# Block
# ----------------------------------------------------------------
class Block(models.Model):
    id = models.BigAutoField(primary_key=True)
    blocker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocking_set')
    blocked = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_by_set')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'accounts_block'
        unique_together = ('blocker', 'blocked')
        indexes = [models.Index(fields=['blocker', 'blocked'], name='acc_block_pair_idx')]

    def __str__(self):
        return f'{self.blocker_id} ⊘ {self.blocked_id}'


# ----------------------------------------------------------------
# Avatar history / audit
# ----------------------------------------------------------------
class AvatarUpload(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='avatar_uploads')
    file = models.ImageField(upload_to='avatars/history/%Y/%m/')
    size_bytes = models.PositiveIntegerField(default=0)
    width = models.PositiveIntegerField(default=0)
    height = models.PositiveIntegerField(default=0)
    is_current = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'accounts_avatar_upload'
        ordering = ['-created_at']
        indexes = [models.Index(fields=['user', '-created_at'])]


class UserSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions_audit')
    ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'accounts_user_session'
        ordering = ['-created_at']


class UserDeactivationLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='deactivation_logs')
    reason = models.CharField(max_length=255, blank=True)
    requested_ip = models.GenericIPAddressField(null=True, blank=True)
    scheduled_deletion_at = models.DateTimeField()
    hard_deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'accounts_deactivation_log'
        ordering = ['-created_at']