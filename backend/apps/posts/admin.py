"""
Admin registration for the posts app.

The admin is the moderator's console. Filters, search, and
read-only fields are chosen to make triage fast:

  - Moderation queue: filter status='pending' or 'flagged'
  - By author:        search by username/email
  - By date:          date_hierarchy for "today's reports"
"""
from django.contrib import admin
from django.utils.html import format_html

from .models import AnonymousLetter, Comment, Post, Reaction


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = (
        'short_id', 'author_link', 'anonymity_badge', 'category',
        'intent', 'status_badge', 'is_removed', 'created_at',
    )
    list_filter = ('status', 'category', 'intent', 'is_anonymous', 'is_removed')
    search_fields = ('content', 'author__username', 'author__email')
    readonly_fields = ('id', 'created_at', 'updated_at', 'content_preview')
    autocomplete_fields = ('author',)
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

    fieldsets = (
        ('Post', {
            'fields': ('id', 'author', 'is_anonymous', 'content_preview', 'content'),
        }),
        ('Classification', {
            'fields': ('category', 'intent', 'allow_comments'),
        }),
        ('Moderation', {
            'fields': ('status', 'is_removed'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
        }),
    )

    def short_id(self, obj):
        return str(obj.id)[:8]

    def author_link(self, obj):
        return format_html('<a href="/admin/accounts/user/{}/change/">{}</a>',
                           obj.author_id, obj.author.username)

    def anonymity_badge(self, obj):
        if obj.is_anonymous:
            return format_html('<span style="background:#5b2a86;color:#fff;padding:2px 6px;border-radius:4px;">anon</span>')
        return '—'

    def status_badge(self, obj):
        colors = {
            'approved': '#2f7d32',
            'pending': '#b08900',
            'flagged': '#b00020',
            'removed': '#666',
        }
        color = colors.get(obj.status, '#666')
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;">{}</span>',
            color, obj.status,
        )

    def content_preview(self, obj):
        return (obj.content or '')[:200]


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = (
        'short_id', 'post_link', 'author_link', 'is_reply_badge',
        'is_anonymous', 'status_badge', 'created_at',
    )
    list_filter = ('status', 'is_anonymous', 'is_removed')
    search_fields = ('content', 'author__username', 'author__email')
    readonly_fields = ('id', 'created_at')
    autocomplete_fields = ('author', 'post', 'parent')
    date_hierarchy = 'created_at'

    def short_id(self, obj):
        return str(obj.id)[:8]

    def post_link(self, obj):
        return format_html('<a href="/admin/posts/post/{}/change/">{}</a>',
                           obj.post_id, str(obj.post_id)[:8])

    def author_link(self, obj):
        return format_html('<a href="/admin/accounts/user/{}/change/">{}</a>',
                           obj.author_id, obj.author.username)

    def is_reply_badge(self, obj):
        return '↳ reply' if obj.is_reply else 'top-level'

    def status_badge(self, obj):
        colors = {
            'approved': '#2f7d32', 'pending': '#b08900',
            'flagged': '#b00020', 'removed': '#666',
        }
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;">{}</span>',
            colors.get(obj.status, '#666'), obj.status,
        )


@admin.register(Reaction)
class ReactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'reaction_type', 'created_at')
    list_filter = ('reaction_type',)
    search_fields = ('user__username', 'post__id')
    autocomplete_fields = ('user', 'post')
    date_hierarchy = 'created_at'


@admin.register(AnonymousLetter)
class AnonymousLetterAdmin(admin.ModelAdmin):
    list_display = (
        'short_id', 'post_link', 'sender_link', 'is_sender_anonymous',
        'is_read', 'created_at',
    )
    list_filter = ('is_sender_anonymous', 'is_read')
    search_fields = ('content', 'sender__username', 'post__id')
    readonly_fields = ('id', 'created_at', 'content_preview')
    autocomplete_fields = ('sender', 'post')
    date_hierarchy = 'created_at'

    def short_id(self, obj):
        return str(obj.id)[:8]

    def post_link(self, obj):
        return format_html('<a href="/admin/posts/post/{}/change/">{}</a>',
                           obj.post_id, str(obj.post_id)[:8])

    def sender_link(self, obj):
        return format_html('<a href="/admin/accounts/user/{}/change/">{}</a>',
                           obj.sender_id, obj.sender.username)

    def content_preview(self, obj):
        return (obj.content or '')[:200]