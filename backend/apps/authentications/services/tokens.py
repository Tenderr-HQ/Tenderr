from rest_framework_simplejwt.tokens import RefreshToken


def issue_tokens(user, request=None) -> dict:
    refresh = RefreshToken.for_user(user)
    access = refresh.access_token

    if request is not None:
        # Best-effort IP/UA claims for security auditing.
        try:
            from apps.authentications.utils import client_ip
            ip = client_ip(request)
            if ip:
                access['ip'] = ip
        except Exception:
            pass

    return {
        'access': str(access),
        'refresh': str(refresh),
        'user': _user_payload(user),
    }


def _user_payload(user) -> dict:
    return {
        'id': str(user.id),
        'email': user.email,
        'username': user.username,
        'display_name': user.display_name,
        'full_name': user.full_name,
        'is_verified_admin': user.is_verified_admin,
        'is_profile_private': user.is_profile_private,
    }