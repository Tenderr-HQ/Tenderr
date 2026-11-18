/**
 * communities.ts
 *
 * Client for `/api/communities/*` — community hubs, memberships,
 * community posts (with media), timed discussions, discussion messages.
 *
 * CONCEPTS YOU NEED:
 *   - Community: a curated hub (Survivor Support, Mental Health
 *     Awareness, etc). Created by the unheard team.
 *   - Membership: user can join/leave. Required to post in discussions.
 *   - CommunityPost: media-rich post inside a community (unlike feed
 *     posts, these can have an image or video).
 *   - Discussion: admin-created, time-boxed topic. Auto-closes at
 *     `close_at`. Members can post messages while open.
 *   - DiscussionMessage: flat, chronological. No threading.
 */
import { apiClient, withMultipart } from './client';
import type {
  CommunityDetailDto, CommunityDto, CommunityPostDto,
  CreateCommunityPostPayload, CreateDiscussionPayload,
  DiscussionDto, DiscussionMessageDto, MembershipDto, Paginated,
} from './types';

// ────────────────────────────────────────────────────────────
// Communities list & detail
// ────────────────────────────────────────────────────────────

/**
 * GET /api/communities/
 *
 * List all official communities with member + post counts.
 * `is_member` is computed for the current viewer — use it to render
 * the "Join" or "Leave" button.
 */
export async function getCommunities(): Promise<Paginated<CommunityDto>> {
  const { data } = await apiClient.get<Paginated<CommunityDto>>('communities/');
  return data;
}

/**
 * GET /api/communities/<slug>/
 *
 * Community detail + admin roster.
 */
export async function getCommunity(slug: string): Promise<CommunityDetailDto> {
  const { data } = await apiClient.get<CommunityDetailDto>(
    `communities/${slug}/`,
  );
  return data;
}

// ────────────────────────────────────────────────────────────
// Membership
// ────────────────────────────────────────────────────────────

/**
 * POST /api/communities/<slug>/join/
 *
 * Join a community. Idempotent — if already a member, returns 201
 * with `{ joined: true }`.
 */
export async function joinCommunity(slug: string): Promise<{ joined: boolean }> {
  const { data } = await apiClient.post<{ joined: boolean }>(
    `communities/${slug}/join/`,
  );
  return data;
}

/**
 * POST /api/communities/<slug>/leave/
 *
 * Leave a community. Idempotent — returns `{ left: false }` if not a member.
 */
export async function leaveCommunity(slug: string): Promise<{ left: boolean }> {
  const { data } = await apiClient.post<{ left: boolean }>(
    `communities/${slug}/leave/`,
  );
  return data;
}

/**
 * GET /api/communities/me/
 *
 * List of communities the current user has joined.
 * Shown on the user's profile "Communities" tab.
 */
export async function getMyCommunities(): Promise<Paginated<MembershipDto>> {
  const { data } = await apiClient.get<Paginated<MembershipDto>>(
    'communities/me/',
  );
  return data;
}

// ────────────────────────────────────────────────────────────
// Community posts (with media)
// ────────────────────────────────────────────────────────────

/**
 * GET /api/communities/<slug>/posts/
 *
 * Posts in a community, pinned first, non-archived.
 */
export async function getCommunityPosts(slug: string): Promise<Paginated<CommunityPostDto>> {
  const { data } = await apiClient.get<Paginated<CommunityPostDto>>(
    `communities/${slug}/posts/`,
  );
  return data;
}

/**
 * POST /api/communities/<slug>/posts/create/
 *
 * Create a community post (admins or members).
 * Supports multipart/form-data when a file is attached.
 *
 * BACKEND RULES:
 *   - is_admin_post is set automatically based on community admins
 *   - if media is attached, is_anonymous is forced to False
 *     (a selfie/video can never be anonymous)
 *   - media validation: max 50 MB, image or video only
 */
export async function createCommunityPost(
  slug: string,
  payload: CreateCommunityPostPayload,
): Promise<CommunityPostDto> {
  const form = new FormData();
  form.append('title', payload.title);
  form.append('content', payload.content);
  form.append('is_anonymous', String(payload.is_anonymous));
  if (payload.media) form.append('media', payload.media);

  const { data } = await apiClient.post<CommunityPostDto>(
    `communities/${slug}/posts/create/`, form, withMultipart(),
  );
  return data;
}

/**
 * DELETE /api/communities/<slug>/posts/<post_id>/delete/
 *
 * Soft-archive a community post (author or admin only).
 */
export async function deleteCommunityPost(slug: string, postId: string): Promise<void> {
  await apiClient.delete(`communities/${slug}/posts/${postId}/delete/`);
}

// ────────────────────────────────────────────────────────────
// Discussions
// ────────────────────────────────────────────────────────────

/**
 * GET /api/communities/<slug>/discussions/
 *
 * List all discussions (open + closed) in a community.
 * Query param `status=open|closed` filters.
 *
 * Each discussion has `is_active` (computed live from status + close_at)
 * and `seconds_remaining`. Use `seconds_remaining` to power a countdown
 * timer on the discussion page.
 */
export async function getDiscussions(
  slug: string,
  params: { status?: 'open' | 'closed' } = {},
): Promise<Paginated<DiscussionDto>> {
  const { data } = await apiClient.get<Paginated<DiscussionDto>>(
    `communities/${slug}/discussions/`, { params },
  );
  return data;
}

/**
 * POST /api/communities/<slug>/discussions/create/
 *
 * Create a discussion (admins only).
 * - `close_at` must be 15 minutes to 90 days in the future.
 * - `is_sensitive` triggers a trigger-warning gate on the detail page.
 */
export async function createDiscussion(
  slug: string,
  payload: CreateDiscussionPayload,
): Promise<DiscussionDto> {
  const { data } = await apiClient.post<DiscussionDto>(
    `communities/${slug}/discussions/create/`, payload,
  );
  return data;
}

/**
 * GET /api/communities/discussions/<id>/
 *
 * Discussion detail (works even when closed — history is always readable).
 */
export async function getDiscussion(id: string): Promise<DiscussionDto> {
  const { data } = await apiClient.get<DiscussionDto>(
    `communities/discussions/${id}/`,
  );
  return data;
}

/**
 * POST /api/communities/discussions/<id>/close/
 *
 * Close the discussion immediately (admins only).
 * Idempotent — the Celery task will also close it at `close_at`.
 */
export async function closeDiscussion(id: string): Promise<DiscussionDto> {
  const { data } = await apiClient.post<DiscussionDto>(
    `communities/discussions/${id}/close/`,
  );
  return data;
}

/**
 * GET /api/communities/discussions/<id>/messages/
 *
 * All messages in the discussion, chronological.
 * Works for open and closed discussions.
 */
export async function getDiscussionMessages(
  discussionId: string,
): Promise<Paginated<DiscussionMessageDto>> {
  const { data } = await apiClient.get<Paginated<DiscussionMessageDto>>(
    `communities/discussions/${discussionId}/messages/`,
  );
  return data;
}

/**
 * POST /api/communities/discussions/<id>/messages/create/
 *
 * Post a message. BACKEND RULES:
 *   - 403 if discussion is not active (status !== 'open' or past close_at)
 *   - 403 if the current user is not a community member
 *   - Respects `is_anonymous` from the payload
 *
 * UI BEHAVIOR:
 *   - Hide the composer when `is_active === false` (show "this discussion
 *     has ended" banner instead).
 *   - Show a "join community to participate" CTA if 403 and not a member.
 */
export async function createDiscussionMessage(
  discussionId: string,
  payload: { content: string; is_anonymous: boolean },
): Promise<DiscussionMessageDto> {
  const { data } = await apiClient.post<DiscussionMessageDto>(
    `communities/discussions/${discussionId}/messages/create/`, payload,
  );
  return data;
}