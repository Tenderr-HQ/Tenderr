"""
Production settings.

Loaded by wsgi.py / asgi.py on deploy. Fails fast if required
secrets are missing — the app will NOT boot with placeholders.

Deploy command reference:
    DJANGO_SETTINGS_MODULE=config.settings.production gunicorn config.wsgi:application
"""
from .base import *  # noqa: F401,F403
from .base import _get_env, _get_bool, _get_int, _get_list


# HARD SAFETY ASSERTIONS

# Refuse to boot with DEBUG=True. This one line has prevented
# more breaches than every firewall combined.
DEBUG = False
assert DEBUG is False, 'Production must never run with DEBUG=True.'

# Fail fast if the secret key is missing. base.py already requires
# it, but this makes the intent explicit for anyone reading this file.
assert SECRET_KEY and SECRET_KEY != 'dev-only-insecure-secret-key-do-not-use-in-production', \
    'DJANGO_SECRET_KEY must be a real production secret.'

assert ALLOWED_HOSTS, 'DJANGO_ALLOWED_HOSTS must be set in production.'

assert CORS_ALLOWED_ORIGINS, \
    'CORS_ALLOWED_ORIGINS must be set in production (otherwise the frontend cannot reach the API).'


# SSL / HSTS / COOKIES

SECURE_SSL_REDIRECT = _get_bool('SECURE_SSL_REDIRECT', default=True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

SECURE_HSTS_SECONDS = _get_int('SECURE_HSTS_SECONDS', default=31536000)  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'same-origin'
X_FRAME_OPTIONS = 'DENY'


# PROXY AWARENESS (Render / Railway / Heroku / Fly / Cloudflare)

USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')


# EMAIL — real SMTP

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = _get_env('EMAIL_HOST', required=True)
EMAIL_PORT = _get_int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = _get_bool('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = _get_env('EMAIL_HOST_USER', required=True)
EMAIL_HOST_PASSWORD = _get_env('EMAIL_HOST_PASSWORD', required=True)


# STATIC & MEDIA — S3 (or Cloudinary)

# Static files: served from the same box via staticfiles storage.
# If you later add whitenoise or a CDN, swap the backend here.
STORAGES['staticfiles'] = {  # noqa: F405
    'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
}

# Media files (avatars, community posts, videos): S3 by default.
STORAGE_BACKEND = _get_env(
    'STORAGE_BACKEND',
    default='django.core.files.storage.FileSystemStorage',
)
STORAGES['default'] = {'BACKEND': STORAGE_BACKEND}  # noqa: F405

if STORAGE_BACKEND.endswith('S3Boto3Storage'):
    AWS_ACCESS_KEY_ID = _get_env('AWS_ACCESS_KEY_ID', required=True)
    AWS_SECRET_ACCESS_KEY = _get_env('AWS_SECRET_ACCESS_KEY', required=True)
    AWS_STORAGE_BUCKET_NAME = _get_env('AWS_STORAGE_BUCKET_NAME', required=True)
    AWS_S3_REGION_NAME = _get_env('AWS_S3_REGION_NAME', default='eu-west-1')
    AWS_S3_CUSTOM_DOMAIN = _get_env('AWS_S3_CUSTOM_DOMAIN', default='')
    AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}
    AWS_QUERYSTRING_AUTH = False
    AWS_DEFAULT_ACL = None

elif STORAGE_BACKEND.startswith('cloudinary'):
    # Cloudinary option — requires `cloudinary` + `django-cloudinary-storage`
    import cloudinary  # noqa: F401
    cloudinary.config(
        cloud_name=_get_env('CLOUDINARY_CLOUD_NAME', required=True),
        api_key=_get_env('CLOUDINARY_API_KEY', required=True),
        api_secret=_get_env('CLOUDINARY_API_SECRET', required=True),
    )


# PASSWORD HASHERS — Argon2 (stronger than default PBKDF2)
# Requires `argon2-cffi` in requirements.txt.
# Falls back to PBKDF2 if Argon2 isn't installed.
try:
    import argon2  # noqa: F401
    PASSWORD_HASHERS = [
        'django.contrib.auth.hashers.Argon2PasswordHasher',
        'django.contrib.auth.hashers.PBKDF2PasswordHasher',
        'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
        'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    ]
except ImportError:
    pass  # keep base.py defaults


# SENTRY (optional — set SENTRY_DSN to enable)

SENTRY_DSN = _get_env('SENTRY_DSN', default='')
if SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        from sentry_sdk.integrations.celery import CeleryIntegration

        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[DjangoIntegration(), CeleryIntegration()],
            traces_sample_rate=0.1,
            send_default_pii=False,
            environment='production',
        )
    except ImportError:
        pass  # sentry_sdk not installed — skip silently


# LOGGING — production
# Keep console logging so container aggregators (Loki, Datadog,
# CloudWatch) can scrape stdout. Add file handlers only if you're
# deploying to a bare-metal server.
LOG_LEVEL = _get_env('LOG_LEVEL', default='INFO')

LOGGING['root']['level'] = LOG_LEVEL  # noqa: F405
LOGGING['loggers']['django']['level'] = LOG_LEVEL  # noqa: F405
LOGGING['loggers']['apps']['level'] = LOG_LEVEL  # noqa: F405