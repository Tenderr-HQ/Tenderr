/**
 * posts.ts
 *
 * Client for `/api/posts/*` — feed, posts, comments, reactions,
 * anonymous letters.
 *
 * ANONYMITY RULES (must be reflected in UI):
 *   - Posts are anonymous by default. `is_anonymous` decides how
 *     the author chip renders (mask vs avatar).
 *   - After every submit, reset the compose form's `is_anonymous`
 *     toggle back to `true`.
 *   - If `allow_comments === false`, hide the comment composer and
 *     show the "support bar" instead (love / me_too / letters).
 */
import { apiClient } from './client';
import type {
  CommentDto, CreateCommentPayload, CreatePostPayload,
  LetterDto, Paginated, PostCategory, PostDto, PostIntent,
  ReactionType, SendLetterPayload,
} from './types';

// ────────────────────────────────────────────────────────────
// Feed & post list
// ────────────────────────────────────────────────────────────

/**
 * GET /api/posts/
 *
 * Main feed — approved posts, block-aware, paginated (20 per page).
 *
 * Query params:
 *   - category: love | life | mental_health | family
 *   - intent:   vent | advice | similar | talk
 *
 * UI USAGE:
 *   const { data, fetchNextPage } = useInfiniteQuery({
 *     queryKey: ['feed', category],
 *     queryFn: ({ pageParam }) => getFeed({ category, page: pageParam }),
 *   });
 */

export async function getFeed(
  params: {
    category?: PostCategory;
    intent?: PostIntent;
    page?: number;
  } = {}
): Promise<PostDto[] | Paginated<PostDto>> {
  const { data } = await apiClient.get("posts/", { params });
  return data;
}


/**
 * GET /api/posts/mine/
 *
 * All posts by the current user, including pending and soft-deleted.
 * Shown on the user's own profile "My posts" tab. The author sees
 * their own moderation status for each post.
 */
export async function getMyPosts(): Promise<Paginated<PostDto>> {
  const { data } = await apiClient.get<Paginated<PostDto>>('posts/mine/');
  return data;
}

/**
 * GET /api/posts/<id>/
 *
 * Single post. Used for permalink pages (e.g. /feed/<id>).
 * Returns 404 if not approved or soft-deleted (unless you're the author).
 */
export async function getPost(id: string): Promise<PostDto> {
  const { data } = await apiClient.get<PostDto>(`posts/${id}/`);
  return data;
}

/**
 * POST /api/posts/create/
 *
 * Create a new post. It is created with status 'pending' and a
 * moderation task runs asynchronously. The user sees the post
 * immediately in "mine/" but it's not in the public feed until approved
 * (usually a few seconds).
 *
 * IMPORTANT: after success, reset the compose form's is_anonymous
 * toggle to true (the default).
 */
export async function createPost(payload: CreatePostPayload): Promise<PostDto> {
  const { data } = await apiClient.post<PostDto>('posts/create/', payload);
  return data;
}

/**
 * DELETE /api/posts/<id>/
 *
 * Soft-delete a post (author only). The post disappears from the feed
 * immediately but the row stays in the DB (is_removed=True) for audits.
 */
export async function deletePost(id: string): Promise<void> {
  await apiClient.delete(`posts/${id}/`);
}

// ────────────────────────────────────────────────────────────
// Comments (1 level deep)
// ────────────────────────────────────────────────────────────

/**
 * GET /api/posts/<post_id>/comments/
 *
 * Top-level comments on a post, approved only, block-aware.
 * Returns 0 comments if `allow_comments === false` (the endpoint
 * does not 403 — the post is still visible, just no comments).
 *
 * Use `replies_count` on each comment to show "+3 replies" without
 * fetching them; lazy-load replies via getCommentReplies().
 */
export async function getComments(postId: string): Promise<Paginated<CommentDto>> {
  const { data } = await apiClient.get<Paginated<CommentDto>>(
    `posts/${postId}/comments/`,
  );
  return data;
}

/**
 * POST /api/posts/<post_id>/comments/create/
 *
 * Create a top-level comment OR a one-level reply.
 * - Pass `parent` (comment id) to create a reply.
 * - Pass `parent: null` or omit to create a top-level comment.
 *
 * BACKEND REJECTS:
 *   - 403 if post.allow_comments === false
 *   - 403 if you have a block relationship with the post author
 *   - 400 if `parent` is itself a reply (one-level-deep rule)
 */
export async function createComment(
  postId: string,
  payload: CreateCommentPayload,
): Promise<CommentDto> {
  const { data } = await apiClient.post<CommentDto>(
    `posts/${postId}/comments/create/`, payload,
  );
  return data;
}

/**
 * GET /api/posts/comments/<comment_id>/replies/
 *
 * Replies to a specific top-level comment. Lazy-loaded when the user
 * taps "View replies" on a comment.
 */
export async function getCommentReplies(commentId: string): Promise<Paginated<CommentDto>> {
  const { data } = await apiClient.get<Paginated<CommentDto>>(
    `posts/comments/${commentId}/replies/`,
  );
  return data;
}

// ────────────────────────────────────────────────────────────
// Reactions
// ────────────────────────────────────────────────────────────

/**
 * POST /api/posts/<post_id>/react/
 *
 * Toggle love / me_too. One tap adds, next tap removes.
 * Body: { type: 'love' | 'me_too' }
 * Response: { toggled: boolean, type: 'love' | 'me_too' }
 *
 * UI OPTIMISM:
 *   Update the reaction count + `mine` array locally before the request
 *   resolves. On error, revert. This gives instant feedback (critical
 *   for the "me too" button, which should feel immediate).
 */
export async function toggleReaction(
  postId: string,
  type: ReactionType,
): Promise<{ toggled: boolean; type: ReactionType }> {
  const { data } = await apiClient.post(
    `posts/${postId}/react/`, { type },
  );
  return data;
}

// ────────────────────────────────────────────────────────────
// Anonymous Letters
// ────────────────────────────────────────────────────────────

/**
 * POST /api/posts/<post_id>/letters/
 *
 * Send a one-way private letter to the post's author.
 * - Max 500 chars.
 * - One letter per post per sender (409 if you already sent one).
 * - Cannot letter your own post (400).
 * - Author can read but NOT reply inside the letter.
 *
 * WHERE TO SHOW THIS:
 *   - Button "Send a letter" on every post card.
 *   - Also inside the "comments disabled" support bar.
 *   - Also in the empty state of the post detail page.
 */
export async function sendLetter(
  postId: string,
  payload: SendLetterPayload,
): Promise<LetterDto> {
  const { data } = await apiClient.post<LetterDto>(
    `posts/${postId}/letters/`, payload,
  );
  return data;
}

/**
 * GET /api/posts/letters/inbox/
 *
 * Letters received on your posts, newest first.
 * Each letter shows: masked sender, preview of the source post,
 * content, read status.
 *
 * UI: display in /letters. Unread count from
 * `NotificationBell` — because letters also fire a notification.
 */
export async function getLetterInbox(): Promise<Paginated<LetterDto>> {
  const { data } = await apiClient.get<Paginated<LetterDto>>(
    'posts/letters/inbox/',
  );
  return data;
}

/**
 * POST /api/posts/letters/<letter_id>/read/
 *
 * Mark a letter as read. Idempotent.
 * Only the recipient (post author) can call this.
 */
export async function markLetterRead(letterId: string): Promise<void> {
  await apiClient.post(`posts/letters/${letterId}/read/`);
}

/**
 * POST /api/posts/<post_id>/save/
 *
 * Toggle the saved state for the current user.
 * Response: { saved: boolean } — true = now saved, false = unsaved.
 *
 * UI OPTIMISM:
 *   Flip the bookmark icon immediately, then reconcile with the
 *   server response. If the request fails, revert and show a toast.
 *
 * WHERE TO WIRE THIS UP:
 *   - The bookmark icon in the top-right of every post card in the
 *     feed. Tapping toggles the state.
 *   - Same button in the post detail page.
 *   - The saved list page shows the same posts with the bookmark
 *     already "on" — tapping removes them from the list.
 */
export async function toggleSavePost(postId: string): Promise<{ saved: boolean }> {
  const { data } = await apiClient.post<{ saved: boolean }>(
    `posts/${postId}/save/`,
  );
  return data;
}

/**
 * GET /api/posts/saved/
 *
 * List all posts the current user has saved, newest save first.
 *
 * IMPORTANT: This endpoint requires authentication. It returns 401
 * for anonymous users. The /saved page should redirect to /login
 * if the user isn't logged in.
 *
 * Rows disappear from this list if:
 *   - The author blocks the user, or the user blocks the author.
 *   - The post is soft-deleted or flagged by moderation.
 *   - The post's author deactivates their account.
 *   - The user manually unsaves the post.
 *
 * UI USAGE:
 *   const { data, isLoading } = useQuery({
 *     queryKey: ['saved'],
 *     queryFn: () => getSavedPosts(),
 *   });
 *
 * EMPTY STATE:
 *   When `data.count === 0`, show a friendly prompt:
 *   "Nothing saved yet. Tap the bookmark icon on any post to save it
 *    for later."
 */
export async function getSavedPosts(): Promise<Paginated<PostDto>> {
  const { data } = await apiClient.get<Paginated<PostDto>>('posts/saved/');
  return data;
}