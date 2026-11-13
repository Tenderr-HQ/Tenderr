"""
Admin registration for the communities app.

The admin is where your team creates communities, adds admins,
and triages discussions. Filters, search, and read-only fields
are chosen to make that fast.
"""
from django.contrib import admin
from django.utils.html import format_html

from .models import (
    Community,
    CommunityMembership,
    CommunityPost,
    Discussion,
    DiscussionMessage,
)


@admin.register(Community)
class CommunityAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_official', 'member_count', 'post_count', 'created_at')
    list_filter = ('is_official',)
    search_fields = ('name', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}
    filter_horizontal = ('admins',)
    readonly_fields = ('id', 'created_at', 'updated_at')

    def member_count(self, obj):
        return obj.memberships.count()

    def post_count(self, obj):
        return obj.posts.count()


@admin.register(CommunityMembership)
class CommunityMembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'community', 'source', 'joined_at')
    list_filter = ('source', 'community')
    search_fields = ('user__username', 'user__email', 'community__name')
    autocomplete_fields = ('user', 'community')
    date_hierarchy = 'joined_at'


@admin.register(CommunityPost)
class CommunityPostAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'community', 'author_link', 'is_admin_post',
        'is_pinned', 'is_archived', 'created_at',
    )
    list_filter = ('is_admin_post', 'is_pinned', 'is_archived', 'community')
    search_fields = ('title', 'content', 'author__username', 'community__name')
    autocomplete_fields = ('author', 'community')
    readonly_fields = ('id', 'created_at', 'updated_at')

    def author_link(self, obj):
        return format_html(
            '<a href="/admin/accounts/user/{}/change/">{}</a>',
            obj.author_id, obj.author.username,
        )


@admin.register(Discussion)
class DiscussionAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'community', 'admin', 'status', 'close_at',
        'message_count', 'is_sensitive', 'created_at',
    )
    list_filter = ('status', 'is_sensitive', 'is_archived', 'community')
    search_fields = ('title', 'description', 'community__name', 'admin__username')
    autocomplete_fields = ('admin', 'community')
    readonly_fields = ('id', 'created_at')
    date_hierarchy = 'created_at'

    def message_count(self, obj):
        return obj.messages.count()


@admin.register(DiscussionMessage)
class DiscussionMessageAdmin(admin.ModelAdmin):
    list_display = (
        'short_id', 'discussion', 'author_link', 'is_anonymous',
        'is_removed', 'created_at',
    )
    list_filter = ('is_anonymous', 'is_removed')
    search_fields = ('content', 'author__username', 'discussion__title')
    autocomplete_fields = ('author', 'discussion')
    readonly_fields = ('id', 'created_at')

    def short_id(self, obj):
        return str(obj.id)[:8]

    def author_link(self, obj):
        return format_html(
            '<a href="/admin/accounts/user/{}/change/">{}</a>',
            obj.author_id, obj.author.username,
        )