"""
Admin registration for the moderation app.

The Django admin IS the moderator console for this project. Three
design choices make it fast:

  1. **Severity badges** — critical flags are visually distinct
     (red pill) so the eye finds them immediately.
  2. **Content preview column** — the first 120 characters of the
     flagged text are shown inline, so the moderator does not need
     to click through to understand what the flag is about.
  3. **Action buttons** — approve / remove actions are exposed as
     custom admin actions (checkbox + action menu) so a moderator
     can bulk-clear 20 spam reports in one click.

The queue is also available via the API (see views.py) for future
moderator tooling.
"""
from django.contrib import admin, messages
from django.utils import timezone
from django.utils.html import format_html

from .models import ModerationFlag, Report


@admin.register(ModerationFlag)
class ModerationFlagAdmin(admin.ModelAdmin):
    list_display = (
        'short_id', 'severity_badge', 'content_type', 'object_link',
        'content_preview', 'source', 'score_display',
        'is_reviewed', 'created_at',
    )
    list_filter = ('is_reviewed', 'severity', 'content_type', 'source')
    search_fields = ('object_id', 'reason')
    readonly_fields = (
        'id', 'content_type', 'object_id', 'severity', 'reason',
        'score', 'source', 'created_at', 'content_preview_long',
    )
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    actions = ['mark_reviewed', 'mark_critical']

    fieldsets = (
        ('Flag', {
            'fields': ('id', 'content_type', 'object_id', 'severity', 'source', 'score'),
        }),
        ('Context', {
            'fields': ('reason', 'content_preview_long'),
        }),
        ('Resolution', {
            'fields': ('is_reviewed', 'reviewed_by', 'reviewed_at'),
        }),
        ('Audit', {
            'fields': ('created_at',),
        }),
    )

    def short_id(self, obj):
        return str(obj.id)[:8]

    def severity_badge(self, obj):
        colors = {
            'critical': '#b00020',  # red
            'medium': '#b08900',    # amber
            'low': '#666',          # grey
        }
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-weight:600;">{}</span>',
            colors.get(obj.severity, '#666'), obj.severity.upper(),
        )
    severity_badge.short_description = 'Severity'

    def object_link(self, obj):
        # Link to the referenced content in its own admin page.
        url = None
        if obj.content_type == 'post':
            url = f'/admin/posts/post/{obj.object_id}/change/'
        elif obj.content_type == 'comment':
            url = f'/admin/posts/comment/{obj.object_id}/change/'
        elif obj.content_type == 'message':
            url = f'/admin/communities/discussionmessage/{obj.object_id}/change/'
        if not url:
            return obj.object_id[:8]
        return format_html('<a href="{}">{}</a>', url, obj.object_id[:8])
    object_link.short_description = 'Content'

    def content_preview(self, obj):
        from .serializers import _content_preview
        text = _content_preview(obj.content_type, obj.object_id, limit=120)
        if not text:
            return format_html('<em style="color:#999;">(deleted or unavailable)</em>')
        return text
    content_preview.short_description = 'Preview'

    def content_preview_long(self, obj):
        from .serializers import _content_preview
        text = _content_preview(obj.content_type, obj.object_id, limit=2000)
        return text or '(deleted or unavailable)'
    content_preview_long.short_description = 'Full preview'

    def score_display(self, obj):
        if obj.score is None:
            return '—'
        return f'{obj.score:.2f}'
    score_display.short_description = 'Score'

    # ---- Bulk actions ----
    @admin.action(description='Mark selected flags as reviewed')
    def mark_reviewed(self, request, queryset):
        updated = queryset.filter(is_reviewed=False).update(
            is_reviewed=True,
            reviewed_by=request.user,
            reviewed_at=timezone.now(),
        )
        self.message_user(request, f'{updated} flag(s) marked reviewed.', messages.SUCCESS)

    @admin.action(description='Force severity to CRITICAL')
    def mark_critical(self, request, queryset):
        updated = queryset.update(severity='critical')
        self.message_user(request, f'{updated} flag(s) marked critical.', messages.WARNING)


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = (
        'short_id', 'reason_badge', 'content_type', 'object_link',
        'content_preview', 'is_resolved', 'created_at',
    )
    list_filter = ('is_resolved', 'reason', 'content_type')
    search_fields = ('object_id', 'details', 'reason')
    readonly_fields = (
        'id', 'reporter', 'content_type', 'object_id',
        'reason', 'details', 'created_at', 'content_preview_long',
    )
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    actions = ['resolve_reports']

    fieldsets = (
        ('Report', {
            'fields': ('id', 'content_type', 'object_id', 'reason', 'details'),
        }),
        ('Reporter (visible to admins only)', {
            'fields': ('reporter',),
        }),
        ('Context', {
            'fields': ('content_preview_long',),
        }),
        ('Resolution', {
            'fields': ('is_resolved', 'resolved_by', 'resolved_at', 'resolution_note'),
        }),
        ('Audit', {
            'fields': ('created_at',),
        }),
    )

    def short_id(self, obj):
        return str(obj.id)[:8]

    def reason_badge(self, obj):
        return format_html(
            '<span style="background:#5b2a86;color:#fff;padding:2px 8px;border-radius:4px;">{}</span>',
            obj.reason,
        )
    reason_badge.short_description = 'Reason'

    def object_link(self, obj):
        if obj.content_type == 'post':
            url = f'/admin/posts/post/{obj.object_id}/change/'
        elif obj.content_type == 'comment':
            url = f'/admin/posts/comment/{obj.object_id}/change/'
        elif obj.content_type == 'message':
            url = f'/admin/communities/discussionmessage/{obj.object_id}/change/'
        elif obj.content_type == 'user':
            url = f'/admin/accounts/user/{obj.object_id}/change/'
        else:
            return obj.object_id[:8]
        return format_html('<a href="{}">{}</a>', url, obj.object_id[:8])
    object_link.short_description = 'Content'

    def content_preview(self, obj):
        from .serializers import _content_preview
        text = _content_preview(obj.content_type, obj.object_id, limit=120)
        if not text:
            return format_html('<em style="color:#999;">(deleted or unavailable)</em>')
        return text
    content_preview.short_description = 'Preview'

    def content_preview_long(self, obj):
        from .serializers import _content_preview
        return _content_preview(obj.content_type, obj.object_id, limit=2000) or '(deleted)'
    content_preview_long.short_description = 'Full preview'

    @admin.action(description='Mark selected reports as resolved')
    def resolve_reports(self, request, queryset):
        updated = queryset.filter(is_resolved=False).update(
            is_resolved=True,
            resolved_by=request.user,
            resolved_at=timezone.now(),
        )
        self.message_user(request, f'{updated} report(s) resolved.', messages.SUCCESS)