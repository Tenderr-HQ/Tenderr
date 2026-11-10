import logging

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from django.utils import timezone

from .models import AvatarUpload, Block, Companion, StandWith, User

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def bootstrap_related_models(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        from apps.settings.models import UserSettings
        from apps.notifications.models import NotificationPreference
        UserSettings.objects.get_or_create(user=instance)
        NotificationPreference.objects.get_or_create(user=instance)
    except Exception:
        logger.exception('Failed to bootstrap related models for user=%s', instance.id)


@receiver(post_save, sender=User)
def sync_settings_privacy(sender, instance, **kwargs):
    try:
        from apps.settings.models import UserSettings
        row = UserSettings.objects.filter(user=instance).first()
        if row and row.is_profile_private != instance.is_profile_private:
            row.is_profile_private = instance.is_profile_private
            row.save(update_fields=['is_profile_private', 'updated_at'])
    except Exception:
        pass


@receiver(post_delete, sender=AvatarUpload)
def delete_avatar_file(sender, instance, **kwargs):
    if instance.is_current:
        return
    try:
        if instance.file:
            instance.file.delete(save=False)
    except Exception:
        logger.exception('Failed to delete avatar file %s', instance.file.name)


@receiver(post_save, sender=Block)
def on_block(sender, instance, created, **kwargs):
    """
    Blocking someone revokes:
      - stand-with in both directions
      - companion (any status) in both directions
      - pending companion requests
    """
    if not created:
        return
    a, b = instance.blocker_id, instance.blocked_id
    StandWith.objects.filter(stander=a, target=b).delete()
    StandWith.objects.filter(stander=b, target=a).delete()
    Companion.objects.filter(initiator=a, recipient=b).delete()
    Companion.objects.filter(initiator=b, recipient=a).delete()


def touch_user_active(user):
    User.objects.filter(pk=user.pk).update(last_active=timezone.now())