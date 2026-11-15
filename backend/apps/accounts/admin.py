from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import (
    AvatarUpload,
    Block,
    Companion,
    StandWith,
    User,
    UserDeactivationLog,
    UserSession,
)


class StandWithInline(admin.TabularInline):
    model = StandWith
    fk_name = 'stander'
    extra = 0
    autocomplete_fields = ('target',)
    verbose_name_plural = 'Standing with (private)'


class BlockInline(admin.TabularInline):
    model = Block
    fk_name = 'blocker'
    extra = 0
    autocomplete_fields = ('blocked',)
    verbose_name_plural = 'Blocked users'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ('-date_joined',)
    list_display = (
        'username', 'email', 'display_name', 'is_profile_private',
        'accepts_companion_requests', 'is_verified_admin',
        'is_active', 'is_staff', 'date_joined',
    )
    list_filter = (
        'is_active', 'is_staff', 'is_superuser',
        'is_profile_private', 'is_verified_admin',
        'accepts_companion_requests',
    )
    search_fields = ('email', 'username', 'display_name', 'first_name', 'last_name')
    readonly_fields = (
        'id', 'date_joined', 'last_login', 'last_active',
        'last_login_ip', 'last_user_agent',
    )
    inlines = [StandWithInline, BlockInline]

    fieldsets = (
        (None, {'fields': ('id', 'email', 'password')}),
        ('Profile', {'fields': (
            'username', 'display_name', 'first_name', 'last_name', 'avatar', 'bio',
        )}),
        ('Privacy & Roles', {'fields': (
            'is_active', 'is_staff', 'is_superuser',
            'is_profile_private', 'is_verified_admin',
            'accepts_companion_requests',
            'groups', 'user_permissions',
        )}),
        ('Audit', {'fields': (
            'date_joined', 'last_login', 'last_active',
            'last_login_ip', 'last_user_agent',
        )}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2',
                       'is_staff', 'is_superuser'),
        }),
    )


@admin.register(StandWith)
class StandWithAdmin(admin.ModelAdmin):
    list_display = ('stander', 'target', 'created_at')
    search_fields = ('stander__username', 'target__username')
    autocomplete_fields = ('stander', 'target')
    date_hierarchy = 'created_at'


@admin.register(Companion)
class CompanionAdmin(admin.ModelAdmin):
    list_display = ('initiator', 'recipient', 'status', 'created_at', 'responded_at')
    list_filter = ('status',)
    search_fields = ('initiator__username', 'recipient__username')
    autocomplete_fields = ('initiator', 'recipient')
    date_hierarchy = 'created_at'


@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display = ('blocker', 'blocked', 'created_at')
    search_fields = ('blocker__username', 'blocked__username')
    autocomplete_fields = ('blocker', 'blocked')
    date_hierarchy = 'created_at'


@admin.register(AvatarUpload)
class AvatarUploadAdmin(admin.ModelAdmin):
    list_display = ('user', 'size_bytes', 'width', 'height', 'is_current', 'created_at')
    list_filter = ('is_current',)
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('id', 'size_bytes', 'width', 'height', 'created_at')
    autocomplete_fields = ('user',)


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'ip', 'user_agent', 'created_at', 'ended_at')
    search_fields = ('user__username', 'user__email', 'ip')
    readonly_fields = ('id', 'created_at')
    autocomplete_fields = ('user',)
    date_hierarchy = 'created_at'


@admin.register(UserDeactivationLog)
class UserDeactivationLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'reason', 'requested_ip', 'scheduled_deletion_at',
                    'hard_deleted_at', 'created_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('id', 'created_at')
    autocomplete_fields = ('user',)
    date_hierarchy = 'created_at'