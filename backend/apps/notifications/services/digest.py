"""
Helper functions for the nightly digest task.

The heavy lifting (sending emails) is in services.email.
This module decides WHICH users get a digest and WHICH notifications
go into each email.

Rules:
  - Only users with `NotificationPreference.email_digest=True`.
  - Only notifications that have NOT already been emailed.
  - Only notifications from the last 24 hours.
  - At most DIGEST_MAX_ITEMS_PER_EMAIL per user per digest.
"""
import logging
from collections import defaultdict

from django.utils import timezone

from apps.notifications.constants import DIGEST_MAX_ITEMS_PER_EMAIL
from apps.notifications.models import Notification, NotificationPreference

logger = logging.getLogger(__name__)


def collect_digest_batch(users_queryset=None):
    """
    Return a dict mapping user_id -> list[Notification] of the
    notifications that should appear in this run's digest.

    `users_queryset` is the queryset of users to consider; if None,
    we default to "everyone with email_digest=True".
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()

    if users_queryset is None:
        digest_user_ids = NotificationPreference.objects.filter(
            email_digest=True,
        ).values_list('user_id', flat=True)
        users_queryset = User.objects.filter(id__in=digest_user_ids, is_active=True)

    # 24-hour window
    since = timezone.now() - timezone.timedelta(hours=24)

    # One query: fetch all candidate notifications for all users.
    notifications = (
        Notification.objects
        .filter(
            user__in=users_queryset,
            email_sent_at__isnull=True,
            created_at__gte=since,
        )
        .select_related('user', 'actor')
        .order_by('-created_at')
    )

    grouped: dict[int, list[Notification]] = defaultdict(list)
    for n in notifications:
        if len(grouped[n.user_id]) >= DIGEST_MAX_ITEMS_PER_EMAIL:
            continue
        grouped[n.user_id].append(n)

    # Skip users with no notifications
    return {uid: items for uid, items in grouped.items() if items}