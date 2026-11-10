from io import BytesIO

from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from PIL import Image

from apps.accounts.constants import (
    AVATAR_ALLOWED_FORMATS,
    AVATAR_MAX_BYTES,
    AVATAR_MAX_DIMENSION,
    AVATAR_MIN_DIMENSION,
    AVATAR_THUMBNAIL_SIZE,
)
from apps.accounts.models import AvatarUpload


def _open_image(file_obj) -> Image.Image:
    try:
        img = Image.open(file_obj)
        img.verify()
    except Exception:
        raise ValidationError('Uploaded file is not a valid image.')
    file_obj.seek(0)
    img = Image.open(file_obj)
    return img


def _validate(img: Image.Image, size_bytes: int) -> None:
    if img.format not in AVATAR_ALLOWED_FORMATS:
        raise ValidationError(f'Unsupported format: {img.format}. Use JPEG, PNG, or WEBP.')
    if size_bytes > AVATAR_MAX_BYTES:
        raise ValidationError(f'Image too large. Max {AVATAR_MAX_BYTES // (1024*1024)} MB.')
    w, h = img.size
    if min(w, h) < AVATAR_MIN_DIMENSION:
        raise ValidationError(f'Image too small. Minimum {AVATAR_MIN_DIMENSION}px on both sides.')
    if max(w, h) > AVATAR_MAX_DIMENSION:
        raise ValidationError(f'Image too large. Max {AVATAR_MAX_DIMENSION}px on either side.')


def _normalize(img: Image.Image) -> BytesIO:
    if img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGB')
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    img = img.crop((left, top, left + side, top + side))
    img = img.resize(AVATAR_THUMBNAIL_SIZE, Image.LANCZOS)
    buf = BytesIO()
    img.save(buf, format='JPEG', quality=88, optimize=True)
    buf.seek(0)
    return buf


def process_and_save_avatar(user, uploaded_file) -> AvatarUpload:
    size_bytes = uploaded_file.size
    img = _open_image(uploaded_file)
    _validate(img, size_bytes)
    buf = _normalize(img)
    data = buf.read()

    AvatarUpload.objects.filter(user=user, is_current=True).update(is_current=False)

    filename = f'user_{user.id}.jpg'
    user.avatar.save(filename, ContentFile(data), save=True)

    return AvatarUpload.objects.create(
        user=user,
        file=user.avatar.name,
        size_bytes=len(data),
        width=AVATAR_THUMBNAIL_SIZE[0],
        height=AVATAR_THUMBNAIL_SIZE[1],
        is_current=True,
    )


def clear_avatar(user) -> None:
    if user.avatar:
        user.avatar.delete(save=False)
        user.avatar = None
        user.save(update_fields=['avatar'])
    AvatarUpload.objects.filter(user=user, is_current=True).update(is_current=False)