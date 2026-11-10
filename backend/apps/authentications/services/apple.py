import time
import requests as http
import jwt
from django.conf import settings
from rest_framework.exceptions import ValidationError

_APPLE_KEYS_CACHE = {'keys': None, 'fetched_at': 0}
_CACHE_TTL = 3600  # 1 hour


def _get_apple_keys():
    now = time.time()
    if _APPLE_KEYS_CACHE['keys'] and now - _APPLE_KEYS_CACHE['fetched_at'] < _CACHE_TTL:
        return _APPLE_KEYS_CACHE['keys']
    resp = http.get('https://appleid.apple.com/auth/keys', timeout=5)
    resp.raise_for_status()
    keys = resp.json().get('keys', [])
    _APPLE_KEYS_CACHE['keys'] = keys
    _APPLE_KEYS_CACHE['fetched_at'] = now
    return keys


def verify_apple_token(id_token_str: str) -> dict:
    try:
        header = jwt.get_unverified_header(id_token_str)
    except jwt.DecodeError as exc:
        raise ValidationError({'id_token': f'Malformed Apple token: {exc}'})

    keys = _get_apple_keys()
    kid = header.get('kid')
    key_data = next((k for k in keys if k.get('kid') == kid), None)
    if not key_data:
        # Refresh cache once, then retry
        _APPLE_KEYS_CACHE['fetched_at'] = 0
        keys = _get_apple_keys()
        key_data = next((k for k in keys if k.get('kid') == kid), None)
        if not key_data:
            raise ValidationError({'id_token': 'Apple signing key not found.'})

    public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key_data)

    try:
        payload = jwt.decode(
            id_token_str,
            public_key,
            algorithms=['RS256'],
            audience=settings.APPLE_CLIENT_ID,
            issuer='https://appleid.apple.com',
        )
    except jwt.ExpiredSignatureError:
        raise ValidationError({'id_token': 'Apple token expired.'})
    except jwt.InvalidTokenError as exc:
        raise ValidationError({'id_token': f'Invalid Apple token: {exc}'})

    return {
        'email': payload.get('email', '').lower(),
        'uid': payload['sub'],
        'name': '',
        'picture': '',
        'raw': payload,
    }