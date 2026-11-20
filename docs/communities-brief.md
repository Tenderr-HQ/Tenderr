"""
COMMUNITIES - FRONTEND IMPLEMENTATION BRIEF

This document explains what a "Community" is inside Tenderr, how the seven features around it work, and the exact rules the frontend must enforce. It assumes you've read docs/api-contract.md and are using the files in frontend/lib/api/ (especially communities.ts). Every endpoint referenced here has a corresponding typed function in that file.

--------------------------------------------------------------------------

1. What a Community is:
A community is a curated hub created and managed by the unheard team. Examples: "Survivor Support," "Mental Health Awareness," "Domestic Abuse Education."

There are ~10–20 communities at launch. Users cannot create communities. Only your backend team (via the Django admin) can create them, add admins, and set the banner/description.

A community contains:
    - Community posts — media-rich posts (image or video) authored by admins or members.
    - Discussions — admin-created, time-boxed topics (e.g. "Why victims don't speak up") that close automatically after a set period.
    - Membership — users can join or leave; joining is required to post in discussions (but not to read).

Community posts are different from regular feed posts: the feed is text-only (media would break anonymity on a photo of a face), but community posts allow images and videos because they are usually awareness content uploaded by admins.

--------------------------------------------------------------------

2. Discovery — the community list
Where it appears: /communities route. Sidebar item in the app shell.

What it shows: All official communities, sorted alphabetically. Each card displays:

    - Banner image (optional; fallback to a solid purple block with the community name).
    - Name and short description.
    - Member count and post count — from the paginated API response, no extra requests.
    - Join / Leave button whose state depends on the is_member flag.

API call: GET /api/communities/ → paginated CommunityDto[].

Frontend rule: The response is paginated at 20. Use useInfiniteQuery with getNextPageParam from the next field, or a simple "Load more" button. Do not fetch all communities at once — even though there are only ~20, this keeps the pattern consistent when the list grows.

-------------------------------------------------------------------------

3. Community detail page
Where it appears: /communities/[slug] route.

Layout: A three-part header + two tabs.

Header:
    - Banner image, community name, description.
    - Member count + post count.
    - Join / Leave button. Clicking it calls POST /api/communities/<slug>/ join/ or /leave/ and refreshes the header counts.

    - Admin roster — from the admins field on CommunityDetailDto. Show each admin's avatar and display name with a verified shield badge (since admins are public identity in this space — see §10).

Tabs:
    - Posts — default tab.
    - Discussions — see §6.
API call: GET /api/communities/<slug>/ → CommunityDetailDto.

------------------------------------------------------------------

4. Community posts (media-rich)
Endpoint: GET /api/communities/<slug>/posts/ → paginated CommunityPostDto[].

Each post shows:
    - Author chip. This is the critical difference from the feed: an admin post always shows the admin's real avatar + username with a shield badge. A member post respects the is_anonymous flag — mask icon if anonymous, avatar if public. The API gives you author_info already masked; never try to reconstruct the username yourself from a side channel.
    -   Title, body, media (image or video based on media_type).
    - Pin badge if is_pinned is true — pinned posts sort first (backend does this already).
    - Created timestamp.

Pinned first: the API returns posts with -is_pinned, -created_at ordering. Don't re-sort client-side.

Media rendering:
    - media_type === 'image' → <img src={media_url} /> with loading="lazy".
    - media_type === 'video' → <video controls src={media_url} /> — do not autoplay. Victims and survivors may be viewing in public.
    - media_url is already a Cloudinary URL with CDN caching. Never proxy through your own server.

Create post:
    - Only admins and members can create — for MVP, any logged-in user (backend allows members and admins).

    - Form fields: title (200 chars), content (5000 chars), optional media upload (image or video, max 50 MB), is_anonymous toggle.

    - Media forces is_anonymous to false automatically — the backend enforces this. In the UI, disable the anonymous toggle when a file is attached and show a note: "Attaching media will post publicly — photos and videos can identify you."

    - Call createCommunityPost(slug, { title, content, media, is_anonymous }).

Delete post: admins can soft-archive any community post; authors can soft-archive their own. Call deleteCommunityPost(slug, postId). Show a confirmation dialog: "This will archive the post. It can be restored by a moderator."

------------------------------------------------------------------------

5. Discussions — the flagship feature
A discussion is a time-boxed, admin-moderated conversation topic. It's like a group chat but:
    - Flat, not threaded — messages appear chronologically, no replies-to-replies.
    - Has an expiry — a hard close_at timestamp. When it hits, no new messages are accepted. The discussion becomes read-only.
    - Admins can close early with one click, but the timer will close it anyway.

Where it appears: the "Discussions" tab on the community detail page, and each discussion has its own page.

Discussions list (/communities/[slug]/discussions):
    - Paginated list of open and closed discussions.
    - Use ?status=open or ?status=closed to filter; UI default is open.
    - Each card shows: title, admin author (with shield), message count, and a live countdown to close_at (e.g. "Closes in 2d 4h" or "Closes in 45m"). Also a small is_sensitive badge if is_sensitive === true.
    - Closed discussions should still appear (with a "Closed" badge) so users can read history — but sorted below open ones if both shown together.

Discussion detail (/communities/discussions/[id]):
This is the most important page in the community module. Build it carefully.

Top of the page:
    - Title (large).
    - Admin chip with shield + admin name — always public identity, never masked.
    - Description block with the topic prompt (e.g. "SILENCE PROTECTS THE RAPIST, NOT THE VICTIM — why victims don't speak up and how society can change that.").
    - Live countdown to close_at. Use seconds_remaining from the API; update it every second with setInterval. When it hits 0, stop accepting new input and show the "This discussion has ended" banner without refetching.
    - Status pill: "Open" (green) or "Closed" (grey).

Trigger warning gate (if is_sensitive === true):
    - The description is blurred by default. Overlay the description area with a card: "This discussion contains sensitive content. Take care of yourself before continuing." + a [Show content] button.
    - On click, reveal the description and enable reading. This state should not persist across page loads — every visit re-blurs.
    - Messages are also blurred until the warning is dismissed — the whole page is behind the gate, not just the description.

Message list:
    - Fetch with GET /api/communities/discussions/<id>/messages/.
    - Each message shows: masked or real author chip (depends on is_anonymous — API returns it correct), content, timestamp.
    - Order chronologically, oldest first. This is a conversation, not a feed.
    - New messages appear at the bottom. Use a real-time channel if backend delivers one; for MVP, poll the messages endpoint every 5s while the discussion is open, or refresh on user action.
    - Messages are one-column only. No reply-to-message UX — flat is intentional.

Message composer (bottom):
    - Disabled and hidden when is_active === false (either status is closed or countdown hit zero).
    - When disabled, show a soft purple banner: "This discussion has ended. Thank you to everyone who shared."
    - When active, allow text input (max 1000 chars) and an is_anonymous toggle defaulting to anonymous.
    - Before submit, check membership. If the user is not a member of the community, the composer should be replaced with a "Join this community to participate" CTA that calls joinCommunity(slug).
    - Composer resets the toggle to anonymous after every successful post.

Admins-only:
    Show a "Close discussion early" button. Calls closeDiscussion(id) after confirmation. On success, set the local state to closed without refetch.

----------------------------------------------------------------------

6. Membership
Membership is a simple opt-in. It's used to:
    - Unlock the message composer in discussions.
    - Show the community in the user's /settings or profile "Communities" tab (via GET /api/communities/me/).

Join: POST /api/communities/<slug>/join/ — idempotent. After success, update is_member locally and increment member_count.

Leave: POST /api/communities/<slug>/leave/ — idempotent. Warn the user: "Leaving a community doesn't hide its posts. You can rejoin anytime."

Do not gate reading behind membership. Anyone can read a community, its posts, and its discussions.

-----------------------------------------------------------------------

7. Anonymity rules that apply inside communities

This is where the community module differs most from the feed. Read carefully:

Content||     	          Always public?||	      Respects is_anonymous?||
Community admin roster	           ✅ Yes	              ❌ N/A
Admin-authored community posts	   ✅ Yes                   ❌ N/A
Discussion author (admin)	        ✅ Yes	              ❌ N/A
Discussion messages	                ❌ No	               ✅ Yes
Member-authored community posts (text only)	❌ No	        ✅ Yes
Member-authored community posts (with media)	✅ Yes	  ❌ N/A (forced public)


Rule of thumb: admins are public. Members are anonymous unless they choose otherwise. Media strips anonymity by design. The backend already enforces all of this — you just render what the API returns.

UI pattern for author chips: reuse the AuthorChip component from components/identity/author-chip.tsx. It renders:
    - Mask icon + "Anonymous" for type === 'anonymous'.
    - Avatar + display name (linkable) + shield badge for type === 'public' && is_admin === true.
    - Avatar + display name (linkable, no shield) for type === 'public' && is_admin !== true.

----------------------------------------------------------------------
ROUTES
/communities                          → community list
/communities/[slug]                   → detail (defaults to Posts tab)
/communities/[slug]/posts             → Posts tab (also default)
/communities/[slug]/posts/create      → compose community post
/communities/[slug]/discussions       → Discussions list
/communities/[slug]/discussions/create → create discussion (admin only)
/communities/discussions/[id]         → discussion detail + messages


components/communities/
├── community-card.tsx
├── community-list.tsx
├── community-header.tsx
├── join-leave-button.tsx
├── community-post-card.tsx
├── community-post-list.tsx
├── community-post-composer.tsx
├── media-uploader.tsx
├── discussion-card.tsx
├── discussion-list.tsx
├── discussion-header.tsx
├── discussion-countdown.tsx
├── discussion-message-list.tsx
├── discussion-message-item.tsx
├── discussion-composer.tsx
├── discussion-closed-banner.tsx
├── trigger-warning-gate.tsx
├── admin-discussion-form.tsx
└── close-discussion-dialog.tsx
