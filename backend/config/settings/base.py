"""
Shared Django settings for unheard.

Environment-specific overrides live in:
  - development.py  (default for `python manage.py ...`)
  - production.py   (loaded by wsgi.py / asgi.py on deploy)

Any env var accessed here is read through _get_env() so that a
missing variable in production fails fast (ImproperlyConfigured)
instead of silently falling back to an insecure default.
"""
from pathlib import Path
from datetime import timedelta
import os

from django.core.exceptions import ImproperlyConfigured


# ENV HELPERS

def _get_env(name: str, *, required: bool = False, default: str | None = None) -> str:
    """Read a string env var. Raises if required=True and unset."""
    value = os.environ.get(name, default)
    if required and (value is None or value == ''):
        raise ImproperlyConfigured(
            f'Environment variable {name} must be set. '
            f'Check your .env file.'
        )
    return value  # type: ignore[return-value]


def _get_bool(name: str, *, default: bool = False) -> bool:
    """Read a boolean env var. Accepts 1/true/yes/on (case-insensitive)."""
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in ('1', 'true', 'yes', 'on')


def _get_int(name: str, *, default: int) -> int:
    """Read an integer env var."""
    raw = os.environ.get(name)
    return int(raw) if raw else default


def _get_list(name: str, *, default: list[str] | None = None) -> list[str]:
    """Read a comma-separated env var as a list of trimmed strings."""
    raw = os.environ.get(name)
    if raw is None:
        return default or []
    return [item.strip() for item in raw.split(',') if item.strip()]


# PATHS

# base.py lives at backend/config/settings/base.py
#   __file__              → backend/config/settings/base.py
#   .parent               → backend/config/settings/
#   .parent.parent        → backend/config/
#   .parent.parent.parent → backend/     ← this is the project root
BASE_DIR = Path(__file__).resolve().parent.parent.parent


# CORE

# Required in ALL environments. In dev, development.py overrides this
# with a fixed dev-only value so `runserver` works without setup.
SECRET_KEY = _get_env('DJANGO_SECRET_KEY', required=True)

DEBUG = _get_bool('DJANGO_DEBUG', default=False)

ALLOWED_HOSTS = _get_list('DJANGO_ALLOWED_HOSTS')

# Required for allauth OAuth callbacks (session-based CSRF checks)
CSRF_TRUSTED_ORIGINS = _get_list('DJANGO_CSRF_TRUSTED_ORIGINS')


# APPLICATIONS

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'django.contrib.postgres',  # required for trigram search (accounts app)

    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.apple',
    'django_celery_beat',
    'channels',

    # Local apps
    'apps.accounts',
    'apps.authentications',
    'apps.moderation',
    'apps.posts',
    'apps.communities',
    'apps.notifications',
    'apps.settings',
]

AUTH_USER_MODEL = 'accounts.User'
SITE_ID = 1


# MIDDLEWARE

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',        # must be first for CORS preflight
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'


# TEMPLATES

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [BASE_DIR / 'templates'],
    'APP_DIRS': True,
    'OPTIONS': {
        'context_processors': [
            'django.template.context_processors.debug',
            'django.template.context_processors.request',
            'django.contrib.auth.context_processors.auth',
            'django.contrib.messages.context_processors.messages',
        ],
    },
}]


# DATABASE (PostgreSQL required — django.contrib.postgres is on)

DATABASES = {
    'default': {
        'ENGINE': _get_env('DB_ENGINE', default='django.db.backends.postgresql'),
        'NAME': _get_env('DB_NAME', default='unheard_dev'),
        'USER': _get_env('DB_USER', default='postgres'),
        'PASSWORD': _get_env('DB_PASSWORD', default='postgres'),
        'HOST': _get_env('DB_HOST', default='localhost'),
        'PORT': _get_env('DB_PORT', default='5432'),
        'CONN_MAX_AGE': _get_int('DB_CONN_MAX_AGE', default=60),
        'OPTIONS': {
            'sslmode': _get_env('DB_SSLMODE', default='prefer'),
        },
    }
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# AUTH VALIDATORS

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# DRF + JWT

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '60/hour',
        'user': '1000/day',
        'register': '10/hour',
        'login': '20/hour',
        'password_reset': '5/hour',
        'oauth': '60/hour',
        'report_submit': '30/hour',
        'post_create': '30/hour',
        'comment_create': '100/hour',
        'letter_send': '20/hour',
        'community_post_create': '30/hour',
        'discussion_message_create': '200/hour',
    },
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=14),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}


# CELERY

CELERY_BROKER_URL = _get_env('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = CELERY_BROKER_URL
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'
CELERY_TIMEZONE = 'UTC'
CELERY_TASK_ALWAYS_EAGER = _get_bool('CELERY_TASK_ALWAYS_EAGER', default=False)
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 5 * 60  # hard kill after 5 min

CELERY_BEAT_SCHEDULE = {
    'close-expired-discussions': {
        'task': 'apps.communities.tasks.close_expired_discussions_task',
        'schedule': 300.0,  # every 5 minutes
    },
    'send-email-digest': {
        'task': 'apps.notifications.tasks.send_email_digest_task',
        'schedule': 60.0 * 60 * 24,  # daily
    },
    'purge-expired-notifications': {
        'task': 'apps.notifications.tasks.purge_expired_notifications_task',
        'schedule': 60.0 * 60 * 24,  # daily
    },
}


# CHANNELS (WebSocket for live discussion updates)

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [_get_env('REDIS_CHANNELS_URL', default='redis://localhost:6379/1')],
        },
    },
}


# CACHE (used by throttling in production)

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': _get_env('REDIS_CACHE_URL', default='redis://localhost:6379/2'),
    }
}


# ALLAUTH (OAuth only — email registration is custom in authentications)

ACCOUNT_EMAIL_VERIFICATION = 'optional'
ACCOUNT_LOGIN_METHODS = {'email'}
ACCOUNT_SIGNUP_FIELDS = ['username*', 'email*', 'password1*', 'password2*']
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_USER_MODEL_USERNAME_FIELD = 'username'

SOCIALACCOUNT_AUTO_SIGNUP = True
SOCIALACCOUNT_EMAIL_AUTHENTICATION = True
SOCIALACCOUNT_EMAIL_AUTHENTICATION_AUTO_CONNECT = True
SOCIALACCOUNT_ADAPTER = 'apps.authentications.adapters.CustomSocialAdapter'

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {'access_type': 'online'},
    },
    'apple': {
        'APP': {
            'client_id': _get_env('APPLE_CLIENT_ID', default='com.unheard.web'),
            'secret': _get_env('APPLE_SECRET', default=''),
            'key': _get_env('APPLE_KEY_ID', default=''),
        }
    },
}

GOOGLE_CLIENT_ID = _get_env('GOOGLE_CLIENT_ID', default='')


# CORS

CORS_ALLOWED_ORIGINS = _get_list('CORS_ALLOWED_ORIGINS')
CORS_ALLOW_CREDENTIALS = True


# EMAIL

EMAIL_BACKEND = _get_env(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.console.EmailBackend',
)
EMAIL_HOST = _get_env('EMAIL_HOST', default='')
EMAIL_PORT = _get_int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = _get_bool('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = _get_env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = _get_env('EMAIL_HOST_PASSWORD', default='')

EMAIL_TIMEOUT = 10  # seconds; smtplib will raise TimeoutError instead of hanging

DEFAULT_FROM_EMAIL = _get_env('DEFAULT_FROM_EMAIL', default='no-reply@unheard.app')
SERVER_EMAIL = _get_env('SERVER_EMAIL', default=DEFAULT_FROM_EMAIL)
ADMINS = [_get_env('ADMINS', default='noc@unheard.app')]


# FRONTEND (used in email links, OAuth redirects, absolute URLs)

FRONTEND_URL = _get_env('FRONTEND_URL', default='http://localhost:3000')


# PERSPECTIVE API (moderation)

PERSPECTIVE_API_KEY = _get_env('PERSPECTIVE_API_KEY', default='')


# STATIC & MEDIA

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Django 4.2+ STORAGES format. Defaults to local filesystem in base;
# production.py overrides `default` with S3/Cloudinary.
STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
    },
}

# Upload limits
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024   # 10 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024    # 5 MB


# i18n / tz

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# LOGGING

LOG_LEVEL = _get_env('LOG_LEVEL', default='INFO')

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} {name}: {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': LOG_LEVEL,
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
    },
}