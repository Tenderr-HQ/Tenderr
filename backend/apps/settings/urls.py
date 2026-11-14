"""
URL map for the settings app.

Mounted at /api/settings/ in config/urls.py.
"""
from django.urls import path

from .views import (
    AccountSettingsView,
    AppearanceSettingsView,
    DataStorageSettingsView,
    HelpSupportView,
    LanguageSettingsView,
    NotificationSettingsView,
    PrivacySettingsView,
    RequestExportView,
    ScheduleDeletionView,
    SecuritySettingsView,
)

app_name = 'settings'

urlpatterns = [
    # Seven tabs
    path('account/', AccountSettingsView.as_view(), name='account'),
    path('privacy/', PrivacySettingsView.as_view(), name='privacy'),
    path('notifications/', NotificationSettingsView.as_view(), name='notifications'),
    path('security/', SecuritySettingsView.as_view(), name='security'),
    path('appearance/', AppearanceSettingsView.as_view(), name='appearance'),
    path('language/', LanguageSettingsView.as_view(), name='language'),
    path('data-storage/', DataStorageSettingsView.as_view(), name='data-storage'),

    # Data & storage actions
    path('data-storage/export/', RequestExportView.as_view(), name='data-export'),
    path('data-storage/delete/', ScheduleDeletionView.as_view(), name='data-delete'),

    # Help & support
    path('help/', HelpSupportView.as_view(), name='help'),
]