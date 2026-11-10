import logging
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import EmailVerificationToken, OAuthAccount, PasswordResetToken
from .serializers import (
    EmailVerificationSerializer,
    LoginSerializer,
    OAuthSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
)
from .services.apple import verify_apple_token
from .services.emails import (
    send_password_reset_email,
    send_verification_email,
    send_welcome_email,
)
from .services.google import verify_google_token
from .services.tokens import issue_tokens
from .throttles import LoginThrottle, OAuthThrottle, PasswordResetThrottle, RegisterThrottle
from .utils import (
    client_ip,
    email_verification_expiry,
    generate_token,
    password_reset_expiry,
    user_agent,
)

logger = logging.getLogger(__name__)
User = get_user_model()


# ---------- Registration ----------
class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [RegisterThrottle]

    @transaction.atomic
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Create verification token and dispatch email
        token_value = generate_token()
        EmailVerificationToken.objects.create(
            user=user,
            token=token_value,
            expires_at=email_verification_expiry(),
        )
        try:
            send_verification_email(user, token_value)
            send_welcome_email(user)
        except Exception:
            logger.exception('Failed to send signup emails for user=%s', user.id)

        payload = issue_tokens(user, request=request)
        payload['email_verification_required'] = True
        return Response(payload, status=status.HTTP_201_CREATED)


# ---------- Login ----------
class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        from .models import LoginAttempt
        LoginAttempt.objects.create(
            email=user.email,
            ip=client_ip(request),
            user_agent=user_agent(request),
            success=True,
        )
        return Response(issue_tokens(user, request=request))


# ---------- OAuth ----------
class OAuthLoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [OAuthThrottle]

    @transaction.atomic
    def post(self, request):
        serializer = OAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        provider = serializer.validated_data['provider']
        raw_token = serializer.validated_data['id_token']

        if provider == 'google':
            data = verify_google_token(raw_token)
        elif provider == 'apple':
            data = verify_apple_token(raw_token)
        else:
            return Response({'detail': 'Unsupported provider.'}, status=400)

        link = OAuthAccount.objects.select_related('user').filter(
            provider=provider, provider_uid=data['uid']
        ).first()

        if link:
            user = link.user
            link.touch_login()
        else:
            user = User.objects.filter(email=data['email']).first()
            if not user:
                base = (data['email'] or 'user').split('@')[0]
                candidate = base
                i = 1
                while User.objects.filter(username=candidate).exists():
                    candidate = f'{base}{i}'
                    i += 1
                full_name = data.get('name') or candidate
                first, *rest = full_name.split(' ', 1)
                user = User.objects.create_user(
                    email=data['email'],
                    username=candidate,
                    password=None,
                    first_name=first,
                    last_name=rest[0] if rest else '',
                    display_name=full_name,
                )
                user.set_unusable_password()
                user.save(update_fields=['password'])
            OAuthAccount.objects.create(
                user=user,
                provider=provider,
                provider_uid=data['uid'],
                provider_email=data['email'],
                raw_data=data.get('raw', {}),
                last_login_at=timezone.now(),
            )

        return Response(issue_tokens(user, request=request))


# ---------- Logout ----------
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh = request.data.get('refresh')
        if not refresh:
            return Response({'detail': 'refresh token required.'}, status=400)
        try:
            RefreshToken(refresh).blacklist()
        except TokenError:
            return Response({'detail': 'Invalid or expired token.'}, status=400)
        return Response({'detail': 'Logged out.'})


# ---------- Email verification ----------
class EmailVerificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token_value = serializer.validated_data['token']

        token = EmailVerificationToken.objects.filter(token=token_value).first()
        if not token or not token.is_valid:
            return Response({'detail': 'Invalid or expired token.'}, status=400)

        token.used_at = timezone.now()
        token.save(update_fields=['used_at'])
        return Response({'detail': 'Email verified.'})


# ---------- Password reset ----------
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetThrottle]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].lower().strip()

        user = User.objects.filter(email=email, is_active=True).first()
        # Return 200 regardless, to prevent email enumeration
        if user:
            token_value = generate_token()
            PasswordResetToken.objects.create(
                user=user,
                token=token_value,
                expires_at=password_reset_expiry(),
                requested_ip=client_ip(request),
            )
            try:
                send_password_reset_email(user, token_value)
            except Exception:
                logger.exception('Failed to send password reset email for user=%s', user.id)

        return Response({'detail': 'If that email exists, a reset link has been sent.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token_value = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        token = PasswordResetToken.objects.select_related('user').filter(token=token_value).first()
        if not token or not token.is_valid:
            return Response({'detail': 'Invalid or expired token.'}, status=400)

        user = token.user
        user.set_password(new_password)
        user.save(update_fields=['password'])

        token.used_at = timezone.now()
        token.save(update_fields=['used_at'])

        # Invalidate all outstanding tokens for security
        RefreshToken.for_user(user)  # ensures blacklist app sees new state
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
        OutstandingToken.objects.filter(user=user).delete()

        return Response({'detail': 'Password updated. Please log in again.'})