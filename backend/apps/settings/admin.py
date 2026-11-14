"""
Admin registration for the settings app.

Settings are user-facing and typically edited through the API,
so the admin here is a read-mostly inspection tool. Staff use it
to debug user reports, not to make changes.

Two deliberate choices:
  - `has_add_permission` is False: settings rows are created
    automatically with users, never manually.
  - `has_delete_permission` is False: deleting a settings row
    would leave the user in a broken state; use the user admin
    to delete the whole account instead.
"""
from django.contrib import admin

from .models import UserSettings


@admin.register(UserSettings)
class UserSettingsAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'theme', 'language', 'is_profile_private',
        'two_factor_enabled', 'delete_scheduled_at', 'updated_at',
    )
    list_filter = (
        'theme', 'language', 'is_profile_private',
        'two_factor_enabled', 'reduce_motion',
    )
    search_fields = ('user__username', 'user__email')
    autocomplete_fields = ('user',)
    readonly_fields = ('updated_at', 'export_requested_at', 'delete_scheduled_at')
    ordering = ('-updated_at',)

    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Privacy', {
            'fields': ('is_profile_private', 'show_in_search', 'allow_profile_views'),
        }),
        ('Security', {
            'fields': ('two_factor_enabled', 'login_alerts'),
        }),
        ('Appearance', {
            'fields': ('theme', 'reduce_motion', 'font_size'),
        }),
        ('Language', {'fields': ('language',)}),
        ('Data & Storage', {
            'fields': (
                'auto_save_drafts', 'keep_anonymous_history',
                'export_requested_at', 'delete_scheduled_at',
            ),
        }),
        ('Audit', {'fields': ('updated_at',)}),
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False