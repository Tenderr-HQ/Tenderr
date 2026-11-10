from django.contrib.postgres.search import TrigramSimilarity
from django.db.models import Q

from apps.accounts.models import User


def search_users(term: str, limit: int = 30):
    term = (term or '').strip()
    if len(term) < 2:
        return User.objects.none()

    qs = User.objects.public().filter(
        Q(username__icontains=term)
        | Q(display_name__icontains=term)
        | Q(first_name__icontains=term)
        | Q(last_name__icontains=term)
    ).annotate(
        similarity=TrigramSimilarity('username', term)
        + TrigramSimilarity('display_name', term)
    ).order_by('-similarity', 'username')

    return qs[:limit]