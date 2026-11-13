"""
URL map for the moderation app.

Mounted at /api/moderation/ in config/urls.py.

Two visibility tiers:
  - /reports/                → any authenticated user (submit only)
  - /queue/* and /flags/*    → moderators only (list + resolve)
  - /content/<type>/<id>/    → moderators only (approve / remove)
"""
from django.urls import path

from .views import (
    FlagQueueView,
    ReportCreateView,
    ReportQueueView,
    ResolveFlagView,
    ResolveReportView,
    SetContentStatusView,
)

app_name = 'moderation'

urlpatterns = [
    # Report submission (any authenticated user)
    path('reports/', ReportCreateView.as_view(), name='report-create'),

    # Queues (moderators only)
    path('queue/flags/', FlagQueueView.as_view(), name='flag-queue'),
    path('queue/reports/', ReportQueueView.as_view(), name='report-queue'),

    # Resolve actions (moderators only)
    path('flags/<uuid:pk>/resolve/', ResolveFlagView.as_view(), name='flag-resolve'),
    path('reports/<uuid:pk>/resolve/', ResolveReportView.as_view(), name='report-resolve'),

    # Content action (moderators only)
    path('content/<str:content_type>/<str:object_id>/status/',
         SetContentStatusView.as_view(), name='content-status'),
]