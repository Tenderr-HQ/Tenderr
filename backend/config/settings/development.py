"""
Local development settings.

Loaded by manage.py by default. Safe, convenient, and NOT suitable
for production — CORS is open, DEBUG is on, and email is printed
to the console.

To run with these settings:
    python manage.py runserver
    python manage.py migrate
    pytest
"""
from .base import *  # noqa: F401,F403
import os


DEBUG = True

# Localhost works, wildcard doesn't. This is safer than '*' and
# still lets VS Code's dev tunnels, Docker, etc. reach the server.
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]']

# Fixed dev key — NEVER used in production (production.py requires
# DJANGO_SECRET_KEY from the env). Kept stable so JWT tokens issued
# in one `runserver` keep working across restarts.
SECRET_KEY = 'dev-only-insecure-secret-key-do-not-use-in-production'


# CORS — the Next.js dev server

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
]


# EMAIL — prints to terminal, no SMTP needed

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'


# FRONTEND URL — used in verification / reset email links

FRONTEND_URL = 'http://localhost:3000'


# CELERY — optionally run tasks synchronously
# Set CELERY_TASK_ALWAYS_EAGER=True in your .env if you want
# moderation to run inline during `runserver` without spinning up
# a worker. Useful for debugging. Leave False by default because
# eager mode can mask bugs that only appear with a real worker.
CELERY_TASK_ALWAYS_EAGER = os.environ.get(
    'CELERY_TASK_ALWAYS_EAGER', 'False',
).lower() in ('1', 'true', 'yes')


# DATABASE — point at local Postgres, no SSL

DATABASES['default']['OPTIONS']['sslmode'] = 'prefer'  # noqa: F405