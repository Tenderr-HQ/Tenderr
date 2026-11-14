"""
URL map for the notifications app.

Mounted at /api/notifications/ in config/urls.py.
"""
from django.urls import path

from .views import (
    DeleteNotificationView,
    MarkAllReadView,
    MarkReadView,
    NotificationListView,
    PreferenceView,
    UnreadCountView,
)

app_name = 'notifications'

urlpatterns = [
    path('', NotificationListView.as_view(), name='list'),
    path('unread-count/', UnreadCountView.as_view(), name='unread-count'),
    path('read-all/', MarkAllReadView.as_view(), name='read-all'),
    path('preferences/', PreferenceView.as_view(), name='preferences'),
    path('<int:pk>/read/', MarkReadView.as_view(), name='mark-read'),
    path('<int:pk>/', DeleteNotificationView.as_view(), name='delete'),
]