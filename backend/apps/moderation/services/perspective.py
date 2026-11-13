"""
Perspective API wrapper.

The Jigsaw Perspective API scores content on:
  - TOXICITY          (rude, disrespectful, or unreasonable)
  - THREAT            (intent to inflict pain or harm)
  - SEVERE_TOXICITY   (hateful / violent)

The exact scores matter less than the shape of the decision:

    threat      > THREAT_THRESHOLD_CRITICAL  → critical
    toxicity    > TOXICITY_THRESHOLD_MEDIUM  → medium
    otherwise                                → approve

Fail-open policy:
  If the API times out or errors, we APPROVE the content
  (`severity=None`). Rationale:
    - The crisis keyword scan already caught the highest-risk text.
    - Blocking publishing on API failure would hide legitimate
      posts during perspective-api outages.
    - Moderation is *additional*, not a gate.

If you want fail-closed instead (hold all content while the API is
down), change the returned severity in `analyze()` — but note that
this would make the feed empty for everyone during an outage.
"""
import logging

import requests
from django.conf import settings

from apps.moderation.constants import (
    PERSPECTIVE_ATTRIBUTES,
    PERSPECTIVE_TIMEOUT_SECONDS,
    THREAT_THRESHOLD_CRITICAL,
    TOXICITY_THRESHOLD_MEDIUM,
)

logger = logging.getLogger(__name__)


class PerspectiveResult:
    """
    Small value object so callers don't have to know the exact shape
    of the API response. Populated in `analyze()` below.
    """
    __slots__ = ('severity', 'reason', 'score', 'raw')

    def __init__(self, severity, reason, score, raw):
        self.severity = severity
        self.reason = reason
        self.score = score
        self.raw = raw


def analyze(text: str) -> PerspectiveResult:
    """
    Call Perspective API and return a decision.

    Always returns a result. Never raises. If the API is unavailable,
    returns a result with `severity=None` (meaning "approve").
    """
    api_key = getattr(settings, 'PERSPECTIVE_API_KEY', '') or ''
    if not api_key:
        # No key configured → approve. Same as fail-open.
        logger.warning('Perspective API key not configured; skipping toxicity analysis.')
        return PerspectiveResult(severity=None, reason='', score=None, raw=None)

    url = (
        'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze'
        f'?key={api_key}'
    )
    payload = {
        'comment': {'text': text},
        'requestedAttributes': {attr: {} for attr in PERSPECTIVE_ATTRIBUTES},
        'languages': ['en'],
    }

    try:
        resp = requests.post(url, json=payload, timeout=PERSPECTIVE_TIMEOUT_SECONDS)
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        logger.exception('Perspective API call failed; approving by fail-open policy.')
        return PerspectiveResult(severity=None, reason='', score=None, raw=None)

    attributes = data.get('attributeScores', {})
    toxicity = attributes.get('TOXICITY', {}).get('summaryScore', {}).get('value', 0.0) or 0.0
    threat = attributes.get('THREAT', {}).get('summaryScore', {}).get('value', 0.0) or 0.0

    # Threat takes priority — a threat is more dangerous than toxicity.
    if threat > THREAT_THRESHOLD_CRITICAL:
        return PerspectiveResult(
            severity='critical',
            reason=f'Perspective: threat score {threat:.2f}',
            score=threat,
            raw=data,
        )
    if toxicity > TOXICITY_THRESHOLD_MEDIUM:
        return PerspectiveResult(
            severity='medium',
            reason=f'Perspective: toxicity score {toxicity:.2f}',
            score=toxicity,
            raw=data,
        )
    return PerspectiveResult(severity=None, reason='', score=toxicity, raw=data)