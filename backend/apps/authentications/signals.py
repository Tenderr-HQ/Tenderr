from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from django.utils import timezone


@receiver(user_logged_in)
def touch_last_active(sender, request, user, **kwargs):
    user.last_active = timezone.now()
    update_fields = ['last_active']
    ip = None
    if request is not None:
        from apps.authentications.utils import client_ip
        ip = client_ip(request)
    if ip:
        user.last_login_ip = ip
        update_fields.append('last_login_ip')
    user.save(update_fields=update_fields)