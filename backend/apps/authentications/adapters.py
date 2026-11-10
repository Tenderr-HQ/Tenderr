from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth import get_user_model

User = get_user_model()


class CustomSocialAdapter(DefaultSocialAccountAdapter):
    """Merges social sign-ins with existing email accounts rather than duplicating."""

    def pre_social_login(self, request, sociallogin):
        if sociallogin.is_existing:
            return
        email = (sociallogin.user.email or '').lower()
        if not email:
            return
        existing = User.objects.filter(email=email).first()
        if existing:
            sociallogin.connect(request, existing)

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        if not user.username:
            base = (data.get('email') or 'user').split('@')[0]
            candidate = base
            i = 1
            while User.objects.filter(username=candidate).exists():
                candidate = f'{base}{i}'
                i += 1
            user.username = candidate
        if not user.display_name:
            user.display_name = data.get('name', '') or user.username
        user.is_active = True
        return user