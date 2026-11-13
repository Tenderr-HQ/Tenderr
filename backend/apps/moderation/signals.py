"""
No signals in the moderation app.

Why no signals?

Signals are convenient but they hide the coupling between apps. If
`posts` used `post_save` to trigger moderation, a future developer
reading the posts app might not realize moderation is happening.
Instead, the coupling is explicit:

    posts/services/moderation_hooks.enqueue_moderation(...)

is called from `posts/apps.py`'s `ready()` — well, actually no, it's
called from the Post and Comment `post_save` signals in
`apps/posts/signals.py`, which then call `enqueue_moderation`.

The point is: the posts app owns the decision to moderate; the
moderation app just provides the tools. No cross-app signals are
defined here.

This file exists only to satisfy the standard app skeleton. Leave
it empty.
            
            -Omah
"""