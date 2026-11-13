"""
Fast, deterministic keyword scan for crisis language.

Runs BEFORE any external API call. If it hits, we:
  - mark severity 'critical'
  - do not call Perspective (no point, we already have what we need)
  - leave the content's status as 'pending' for a human

Determinism is the point: the same text always yields the same
verdict, independent of API outages, rate limits, or ML drift.

The keyword list lives in constants.CRISIS_KEYWORDS. If you add a
keyword, add a test case for it in tests/test_crisis_scan.py.
"""
from apps.moderation.constants import CRISIS_KEYWORDS


def scan_for_crisis(text: str) -> str | None:
    """
    Return the matched crisis keyword if any, otherwise None.

    The match is a case-insensitive substring search. It intentionally
    does not use regex — regex invites accidentally matching inside
    other words ("therapist" contains "rapist", for example). Plain
    substring matching is fast, predictable, and easy to audit.

    Example:
        >>> scan_for_crisis('I want to kill myself tonight')
        'kill myself'
        >>> scan_for_crisis('I had a bad day')
        None
    """
    if not text:
        return None
    lowered = text.lower()
    for keyword in CRISIS_KEYWORDS:
        if keyword in lowered:
            return keyword
    return None