from django.conf import settings
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework.exceptions import ValidationError


def verify_google_token(id_token_str: str) -> dict:
    try:
        info = google_id_token.verify_oauth2_token(
            id_token_str,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError as exc:
        raise ValidationError({'id_token': f'Invalid Google token: {exc}'})

    if not info.get('email_verified'):
        raise ValidationError({'id_token': 'Google email is not verified.'})

    return {
        'email': info['email'].lower(),
        'uid': info['sub'],
        'name': info.get('name', ''),
        'picture': info.get('picture', ''),
        'raw': info,
    }