from django.conf import settings
from django.core.mail import send_mail


def send_verification_email(user, token: str) -> None:
    subject = 'Verify your unheard account'
    link = f'{settings.FRONTEND_URL}/verify-email?token={token}'
    body = (
        f'Hi {user.display_name},\n\n'
        f'Please confirm your email by clicking the link below:\n{link}\n\n'
        f'This link expires in 24 hours.\n\n'
        f'If you did not sign up for unheard, ignore this email.'
    )
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)


def send_password_reset_email(user, token: str) -> None:
    subject = 'Reset your unheard password'
    link = f'{settings.FRONTEND_URL}/reset-password?token={token}'
    body = (
        f'Hi {user.display_name},\n\n'
        f'Someone requested a password reset for your account.\n'
        f'Click the link below to reset it:\n{link}\n\n'
        f'This link expires in 1 hour. If this was not you, ignore this email.'
    )
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)


def send_welcome_email(user) -> None:
    subject = 'Welcome to unheard'
    body = (
        f'Hi {user.display_name},\n\n'
        f'You are in a safe space.\n\n'
        f'Post anonymously by default. Choose when to be seen.\n\n'
        f'— The unheard team'
    )
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)