"""
Views for the moderation app.

There are two audiences here and the URLs reflect that:

    /api/moderation/reports/        ← any authenticated user (submit)
    /api/moderation/queue/...       ← moderators only (staff)

All queue endpoints are gated by `IsModerator`, which requires
`is_staff=True`. Reports and flags returned by the queue endpoints
are paginated at 50 per page.
"""
import logging

from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.moderation.models import ModerationFlag, Report
from apps.moderation.permissions import IsModerator
from apps.moderation.serializers import (
    ModerationFlagSerializer,
    ReportCreateSerializer,
    ReportSerializer,
    ResolveSerializer,
)
from apps.moderation.services.queue import build_flag_queue, build_report_queue
from apps.moderation.services.resolve import resolve_flag, resolve_report

logger = logging.getLogger(__name__)


# Reports — submission (any authenticated user)

class ReportCreateView(APIView):
    """
    POST /api/moderation/reports/

    Submit a report. The same user cannot report the same content
    twice — the DB has a unique constraint, and we translate the
    resulting 409 into a friendly message here.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ReportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Duplicate check first — a 409 is more useful than a raw
        # IntegrityError from the DB constraint.
        existing = Report.objects.filter(
            reporter=request.user,
            content_type=data['content_type'],
            object_id=data['object_id'],
        ).first()
        if existing:
            return Response(
                {'detail': 'You already reported this item.', 'report_id': str(existing.id)},
                status=status.HTTP_409_CONFLICT,
            )

        report = Report.objects.create(
            reporter=request.user,
            content_type=data['content_type'],
            object_id=data['object_id'],
            reason=data['reason'],
            details=data.get('details', ''),
        )
        logger.info(
            'Report submitted by %s on %s:%s reason=%s',
            request.user.id, report.content_type, report.object_id, report.reason,
        )
        return Response(
            ReportSerializer(report, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


# Queues (moderators only)

class FlagQueueView(generics.ListAPIView):
    """
    GET /api/moderation/queue/flags/
    Unreviewed flags, ordered by severity priority then recency.
    """
    serializer_class = ModerationFlagSerializer
    permission_classes = [IsModerator]

    def get_queryset(self):
        return build_flag_queue()


class ReportQueueView(generics.ListAPIView):
    """
    GET /api/moderation/queue/reports/
    Unresolved reports, newest first.
    """
    serializer_class = ReportSerializer
    permission_classes = [IsModerator]

    def get_queryset(self):
        return build_report_queue()


# Resolve actions (moderators only)

class ResolveFlagView(APIView):
    """
    POST /api/moderation/flags/<id>/resolve/
    Mark a flag as reviewed.
    """
    permission_classes = [IsModerator]

    def post(self, request, pk):
        flag = get_object_or_404(ModerationFlag, pk=pk)
        serializer = ResolveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resolve_flag(flag, reviewer=request.user, note=serializer.validated_data.get('note', ''))
        return Response(
            ModerationFlagSerializer(flag, context={'request': request}).data
        )


class ResolveReportView(APIView):
    """
    POST /api/moderation/reports/<id>/resolve/
    Mark a report as resolved.
    """
    permission_classes = [IsModerator]

    def post(self, request, pk):
        report = get_object_or_404(Report, pk=pk)
        serializer = ResolveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resolve_report(report, reviewer=request.user, note=serializer.validated_data.get('note', ''))
        return Response(
            ReportSerializer(report, context={'request': request}).data
        )


# Content action — approve / remove (moderators only)

class SetContentStatusView(APIView):
    """
    POST /api/moderation/content/<content_type>/<object_id>/status/

    Body: {"status": "approved" | "flagged" | "removed", "note": "..."}

    This is how a moderator takes action after reviewing a flag or
    report. It updates the underlying content's `status` field and
    optionally resolves ALL open flags and reports on that content
    so the queue doesn't keep showing resolved work.

    Why not auto-resolve?
      Sometimes the moderator wants to leave flags open while
      investigating (e.g. waiting for the user to reply). Setting
      `auto_resolve=False` keeps them in the queue.
    """
    permission_classes = [IsModerator]

    VALID = ('approved', 'flagged', 'removed')

    def post(self, request, content_type, object_id):
        target_status = request.data.get('status')
        if target_status not in self.VALID:
            return Response(
                {'detail': f'status must be one of {self.VALID}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Lazy model lookup so moderation can deploy before posts/communities.
        from django.apps import apps
        if content_type == 'post':
            Model = apps.get_model('posts', 'Post')
        elif content_type == 'comment':
            Model = apps.get_model('posts', 'Comment')
        elif content_type == 'message':
            Model = apps.get_model('communities', 'DiscussionMessage')
        else:
            return Response({'detail': 'Unsupported content_type.'}, status=400)

        obj = Model.objects.filter(pk=object_id).first()
        if not obj:
            return Response({'detail': 'Content not found.'}, status=404)
        if not hasattr(obj, 'status'):
            return Response(
                {'detail': 'This content type does not carry a status field.'},
                status=400,
            )

        obj.status = target_status
        obj.save(update_fields=['status'])

        auto_resolve = bool(request.data.get('auto_resolve', True))
        note = request.data.get('note', '')
        resolved = {}
        if auto_resolve:
            from apps.moderation.services.resolve import resolve_all_for_content
            resolved = resolve_all_for_content(
                content_type=content_type,
                object_id=object_id,
                reviewer=request.user,
                note=note,
            )

        return Response({
            'content_type': content_type,
            'object_id': str(object_id),
            'status': target_status,
            **resolved,
        })