import secrets
from datetime import timedelta
from django.utils import timezone


EMAIL_VERIFICATION_TTL = timedelta(hours=24)
PASSWORD_RESET_TTL = timedelta(hours=1)


def generate_token(nbytes: int = 32) -> str:
    return secrets.token_urlsafe(nbytes)


def client_ip(request) -> str | None:
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def user_agent(request) -> str:
    return request.META.get('HTTP_USER_AGENT', '')[:255]


def email_verification_expiry() -> "timezone.datetime":
    return timezone.now() + EMAIL_VERIFICATION_TTL


def password_reset_expiry() -> "timezone.datetime":
    return timezone.now() + PASSWORD_RESET_TTL