"""
Views for the settings app.

DESIGN RULES (enforced by every view below):

  1. Every view reads `request.user`. There is no <username> or
     <user_id> URL parameter anywhere in this file. This makes it
     impossible to read or edit another user's settings through
     the API.

  2. GET returns the full category. PATCH accepts any subset of
     fields (all fields are optional). The serializer's `.save()`
     is idempotent — a PATCH with no fields is a no-op.

  3. Writes that affect `User` (specifically `is_profile_private`)
     are duplicated so both tables stay consistent without relying
     only on signals.
"""
import logging

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.settings.constants import (
    CRISIS_RESOURCES,
    FAQ_URL,
    PRIVACY_URL,
    SUPPORT_EMAIL,
    TERMS_URL,
)
from apps.settings.models import UserSettings
from apps.settings.permissions import IsSelfOnly
from apps.settings.serializers import (
    AccountSerializer,
    AppearanceSerializer,
    DataStorageSerializer,
    LanguageSerializer,
    PrivacySerializer,
    SecuritySerializer,
)

logger = logging.getLogger(__name__)


def _get_settings(user) -> UserSettings:
    """
    Fetch or create the settings row for the current user.

    Every view uses this — it means we never 404 on a user who
    signed up before the settings app existed, and we never crash
    if a settings row was somehow deleted out from under us.
    """
    return UserSettings.objects.get_or_create_for_user(user)


# Account (read-only summary)

class AccountSettingsView(APIView):
    """
    GET /api/settings/account/

    Read-only summary shown at the top of the Settings page.
    Writes (email, username, display name) go through their own
    endpoints in the accounts and auth apps.
    """
    permission_classes = [IsSelfOnly]

    def get(self, request):
        user = request.user
        # auth_provider lives on apps.authentications.models.OAuthAccount
        # in a normal install. We read it from the user's first OAuth link
        # if any, otherwise default to 'email'.
        auth_provider = 'email'
        try:
            first_link = user.oauth_accounts.order_by('created_at').first()
            if first_link:
                auth_provider = first_link.provider
        except Exception:
            # The authentications app may not be installed in some envs.
            pass

        data = {
            'email': user.email,
            'username': user.username,
            'display_name': user.display_name,
            'full_name': user.full_name,
            'auth_provider': auth_provider,
            'is_verified': bool(user.is_active),
            'date_joined': user.date_joined,
            'last_active': user.last_active,
        }
        serializer = AccountSerializer(data)
        return Response(serializer.data)


# Privacy

class PrivacySettingsView(APIView):
    """
    GET / PATCH /api/settings/privacy/

    PATCH also writes `is_profile_private` to the User row so
    permission checks in `apps.accounts.permissions.CanViewProfile`
    read a fresh value immediately (no signal round-trip needed).
    """
    permission_classes = [IsSelfOnly]

    def get(self, request):
        settings = _get_settings(request.user)
        return Response(PrivacySerializer(settings).data)

    def patch(self, request):
        settings = _get_settings(request.user)
        serializer = PrivacySerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Mirror is_profile_private onto User so the accounts app's
        # permission checks see it instantly (defense in depth; the
        # signal would also handle this a moment later, but doing it
        # here removes a timing window).
        if 'is_profile_private' in serializer.validated_data:
            user = request.user
            new_value = serializer.validated_data['is_profile_private']
            if user.is_profile_private != new_value:
                user.is_profile_private = new_value
                user.save(update_fields=['is_profile_private'])

        return Response(PrivacySerializer(settings).data)


# Notifications (proxy to apps.notifications)

class NotificationSettingsView(APIView):
    """
    GET / PATCH /api/settings/notifications/

    The actual model (NotificationPreference) belongs to
    apps.notifications. This endpoint is a facade so the frontend
    only has to know about /api/settings/* for the whole settings
    page.

    If apps.notifications is not installed yet, the endpoint
    returns an empty-but-well-formed payload so the frontend does
    not break during development.
    """
    permission_classes = [IsSelfOnly]

    def _get_pref(self):
        try:
            from apps.notifications.models import NotificationPreference
            obj, _ = NotificationPreference.objects.get_or_create(user=self.request.user)
            return obj
        except Exception:
            return None

    def _serializer_class(self):
        try:
            from apps.notifications.serializers import PreferenceSerializer
            return PreferenceSerializer
        except Exception:
            return None

    def get(self, request):
        pref = self._get_pref()
        serializer_class = self._serializer_class()
        if not pref or not serializer_class:
            return Response({
                'email_comments': True,
                'email_letters': True,
                'email_digest': False,
                'push_comments': True,
                'push_letters': True,
                'note': 'notifications app not installed — defaults shown',
            })
        return Response(serializer_class(pref).data)

    def patch(self, request):
        pref = self._get_pref()
        serializer_class = self._serializer_class()
        if not pref or not serializer_class:
            return Response(
                {'detail': 'Notifications app not installed.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        serializer = serializer_class(pref, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# Security

class SecuritySettingsView(APIView):
    """
    GET / PATCH /api/settings/security/
    """
    permission_classes = [IsSelfOnly]

    def get(self, request):
        settings = _get_settings(request.user)
        return Response(SecuritySerializer(settings).data)

    def patch(self, request):
        settings = _get_settings(request.user)
        serializer = SecuritySerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(SecuritySerializer(settings).data)


# Appearance

class AppearanceSettingsView(APIView):
    """
    GET / PATCH /api/settings/appearance/
    """
    permission_classes = [IsSelfOnly]

    def get(self, request):
        settings = _get_settings(request.user)
        return Response(AppearanceSerializer(settings).data)

    def patch(self, request):
        settings = _get_settings(request.user)
        serializer = AppearanceSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(AppearanceSerializer(settings).data)


# Language

class LanguageSettingsView(APIView):
    """
    GET / PATCH /api/settings/language/
    """
    permission_classes = [IsSelfOnly]

    def get(self, request):
        settings = _get_settings(request.user)
        return Response(LanguageSerializer(settings).data)

    def patch(self, request):
        settings = _get_settings(request.user)
        serializer = LanguageSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(LanguageSerializer(settings).data)


# Data & Storage

class DataStorageSettingsView(APIView):
    """
    GET / PATCH /api/settings/data-storage/

    The two timestamps are read-only here. They are set by:
      - POST /api/settings/data-storage/export/   → export_requested_at
      - POST /api/settings/data-storage/delete/   → delete_scheduled_at
    """
    permission_classes = [IsSelfOnly]

    def get(self, request):
        settings = _get_settings(request.user)
        return Response(DataStorageSerializer(settings).data)

    def patch(self, request):
        settings = _get_settings(request.user)
        serializer = DataStorageSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(DataStorageSerializer(settings).data)


class RequestExportView(APIView):
    """
    POST /api/settings/data-storage/export/

    Requests a data export. Sets `export_requested_at` and (in a
    future iteration) enqueues a Celery task to build and email
    the export. We do not delete or reset the timestamp — exports
    are always a new artifact.
    """
    permission_classes = [IsSelfOnly]

    def post(self, request):
        settings = _get_settings(request.user)
        settings.export_requested_at = timezone.now()
        settings.save(update_fields=['export_requested_at', 'updated_at'])

        # Future: enqueue apps.settings.tasks.build_export_task(user_id=...)
        logger.info('Data export requested by user %s', request.user.id)
        return Response({
            'detail': 'Data export requested. You will receive an email when it is ready.',
            'export_requested_at': settings.export_requested_at,
        })


class ScheduleDeletionView(APIView):
    """
    POST /api/settings/data-storage/delete/

    Schedules account deletion N days out. This is the "are you sure?"
    path — the user has already confirmed by the time we hit this.
    Does NOT deactivate the account (that happens at the end of the
    grace period). Users can cancel via DELETE.
    """
    permission_classes = [IsSelfOnly]

    def post(self, request):
        settings = _get_settings(request.user)
        settings.schedule_deletion()
        return Response({
            'detail': (
                'Account scheduled for deletion. You can cancel any time '
                'before the deletion date.'
            ),
            'delete_scheduled_at': settings.delete_scheduled_at,
        })

    def delete(self, request):
        """Cancel a pending deletion."""
        settings = _get_settings(request.user)
        settings.cancel_scheduled_deletion()
        return Response({
            'detail': 'Account deletion cancelled.',
            'delete_scheduled_at': None,
        })


# Help & support (static)

class HelpSupportView(APIView):
    """
    GET /api/settings/help/

    Static content only — no model, no writes. The crisis hotline
    list is sourced from `constants.CRISIS_RESOURCES` so adding a
    new hotline requires a deploy (a feature, not a bug: crisis
    numbers must be reviewed, not edited live).
    """
    permission_classes = [IsSelfOnly]

    def get(self, request):
        return Response({
            'support_email': SUPPORT_EMAIL,
            'faq_url': FAQ_URL,
            'terms_url': TERMS_URL,
            'privacy_url': PRIVACY_URL,
            'crisis_resources': list(CRISIS_RESOURCES),
        })