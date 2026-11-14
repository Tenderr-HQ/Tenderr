"""
Admin registration for the notifications app.

The admin is used for three things here:
  1. Debugging — "why didn't user X receive a notification?"
  2. Cleanup — bulk-delete old notifications if a purge task misfires.
  3. Auditing — spot-check that anonymous notifications never reveal
     the actor in the title.

Bulk delete is intentionally available; bulk create is not.
"""
from django.contrib import admin
from django.utils.html import format_html

from .models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        'short_id', 'user_link', 'type_badge', 'masked_title_preview',
        'target_is_anonymous', 'is_read', 'email_sent_at', 'created_at',
    )
    list_filter = ('type', 'is_read', 'target_is_anonymous')
    search_fields = ('user__username', 'user__email', 'title', 'body')
    readonly_fields = ('id', 'created_at', 'email_sent_at', 'masked_title_display')
    autocomplete_fields = ('user', 'actor')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

    def short_id(self, obj):
        return str(obj.id)

    def user_link(self, obj):
        return format_html(
            '<a href="/admin/accounts/user/{}/change/">{}</a>',
            obj.user_id, obj.user.username,
        )
    user_link.short_description = 'Recipient'

    def type_badge(self, obj):
        colors = {
            'comment': '#5b2a86',
            'reaction': '#8b4bb8',
            'letter': '#b062c4',
            'discussion': '#2e6f8c',
            'moderation': '#b00020',
            'system': '#444',
        }
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">{}</span>',
            colors.get(obj.type, '#666'), obj.type,
        )
    type_badge.short_description = 'Type'

    def masked_title_preview(self, obj):
        from .serializers import _mask_title
        title = _mask_title(obj.title) if obj.target_is_anonymous else obj.title
        return title[:60]
    masked_title_preview.short_description = 'Title (masked)'

    def masked_title_display(self, obj):
        from .serializers import _mask_title
        return _mask_title(obj.title) if obj.target_is_anonymous else obj.title
    masked_title_display.short_description = 'Title as it will be seen'


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'email_comments', 'email_letters', 'email_digest',
        'push_comments', 'push_letters', 'updated_at',
    )
    list_filter = ('email_comments', 'email_letters', 'email_digest',
                   'push_comments', 'push_letters')
    search_fields = ('user__username', 'user__email')
    autocomplete_fields = ('user',)
    readonly_fields = ('updated_at',)