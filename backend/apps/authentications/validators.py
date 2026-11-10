import re
from django.core.exceptions import ValidationError

PASSWORD_MIN_LENGTH = 8
PASSWORD_UPPER = re.compile(r'[A-Z]')
PASSWORD_LOWER = re.compile(r'[a-z]')
PASSWORD_DIGIT = re.compile(r'\d')
PASSWORD_SPECIAL = re.compile(r'[^\w\s]')


def validate_strong_password(value: str) -> None:
    if len(value) < PASSWORD_MIN_LENGTH:
        raise ValidationError(f'Password must be at least {PASSWORD_MIN_LENGTH} characters.')
    if not PASSWORD_LOWER.search(value):
        raise ValidationError('Password must contain at least one lowercase letter.')
    if not PASSWORD_UPPER.search(value):
        raise ValidationError('Password must contain at least one uppercase letter.')
    if not PASSWORD_DIGIT.search(value):
        raise ValidationError('Password must contain at least one digit.')
    if not PASSWORD_SPECIAL.search(value):
        raise ValidationError('Password must contain at least one special character.')