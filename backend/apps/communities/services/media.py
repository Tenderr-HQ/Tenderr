"""
Media validation for community posts.

Community posts are the only place media is allowed on the platform.
The validator here does three things:

  1. Rejects oversized files (before they reach storage).
  2. Rejects wrong content types (only the allow-list in constants).
  3. Detects the media type ('image' or 'video') so the model's
     `media_type` field can be set automatically.

Images are validated via Pillow; videos are validated by extension
and content type only. If you need deeper inspection (e.g. duration
limits), do it in a Celery task, not here — keep the request fast.
"""
import logging

from django.core.exceptions import ValidationError
from PIL import Image

from apps.communities.constants import (
    MEDIA_ALLOWED_CONTENT_TYPES,
    MEDIA_ALLOWED_IMAGE_FORMATS,
    MEDIA_ALLOWED_VIDEO_FORMATS,
    MEDIA_MAX_BYTES,
)

logger = logging.getLogger(__name__)


def _detect_kind(uploaded_file) -> str:
    """
    Return 'image' or 'video' or raise ValidationError.
    Uses the declared content type first, then falls back to filename.
    """
    content_type = (getattr(uploaded_file, 'content_type', '') or '').lower()
    if content_type.startswith('image/'):
        return 'image'
    if content_type.startswith('video/'):
        return 'video'

    name = (getattr(uploaded_file, 'name', '') or '').lower()
    if name.endswith(('.jpg', '.jpeg', '.png', '.webp', '.gif')):
        return 'image'
    if name.endswith(('.mp4', '.webm', '.mov')):
        return 'video'

    raise ValidationError('Unsupported file type.')


def validate_community_media(uploaded_file) -> str:
    """
    Validate and return 'image' or 'video'.

    Raises ValidationError if anything is wrong — DRF will surface
    it as a 400 with the message under the `media` field.
    """
    if uploaded_file is None:
        return 'none'

    if uploaded_file.size > MEDIA_MAX_BYTES:
        raise ValidationError(
            f'File too large. Max {MEDIA_MAX_BYTES // (1024 * 1024)} MB.'
        )

    content_type = (getattr(uploaded_file, 'content_type', '') or '').lower()
    if content_type and content_type not in MEDIA_ALLOWED_CONTENT_TYPES:
        raise ValidationError(f'Unsupported content type: {content_type}.')

    kind = _detect_kind(uploaded_file)

    if kind == 'image':
        try:
            img = Image.open(uploaded_file)
            img.verify()
        except Exception:
            raise ValidationError('Uploaded image is not valid.')
        uploaded_file.seek(0)
        img = Image.open(uploaded_file)
        if img.format not in MEDIA_ALLOWED_IMAGE_FORMATS:
            raise ValidationError(f'Unsupported image format: {img.format}.')
    else:
        name = (getattr(uploaded_file, 'name', '') or '').upper()
        ext = name.rsplit('.', 1)[-1] if '.' in name else ''
        if ext not in MEDIA_ALLOWED_VIDEO_FORMATS:
            raise ValidationError(f'Unsupported video format: {ext}.')

    return kind