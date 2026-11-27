/**
 * accounts.ts
 *
 * Client for `/api/accounts/*` — profile, avatar, companions,
 * stand-with, blocks, search, deactivation.
 *
 * CONCEPTS YOU NEED:
 *   - Stand With: a private one-way bookmark. The target NEVER sees it.
 *     Shown only on the current user's "People I stand with" list.
 *   - Companion: a mutual connection requiring acceptance.
 *     States: pending, accepted, declined.
 *   - Block: one-way, prevents all interaction in both directions.
 */
import { apiClient, withMultipart } from './client';
import type {
  AvatarHistoryItem, BlockItem, CompanionItem, DeactivatePayload,
  MeDto, Paginated, PublicUserDto, SessionItem, StandWithItem,
  UpdateProfilePayload,
} from './types';

// Self

/**
 * GET /api/accounts/me/
 *
 * Fetch the current user's full profile. Call on app load and after
 * any profile update to keep the auth context fresh.
 */
export async function getMe(): Promise<MeDto> {
  const { data } = await apiClient.get<MeDto>('accounts/me/');
  return data;
}

/**
 * PATCH /api/accounts/me/
 *
 * Update the user's display name, first/last name, or bio.
 * Email and username cannot be changed here (see changeUsername).
 */
export async function updateMyProfile(payload: UpdateProfilePayload): Promise<MeDto> {
  const { data } = await apiClient.patch<MeDto>('accounts/me/', payload);
  return data;
}

/**
 * POST /api/accounts/me/username/
 *
 * Change the username. Must be unique, 3-30 chars, [a-zA-Z0-9_].
 * Old username becomes immediately available to others.
 */
export async function changeUsername(username: string): Promise<MeDto> {
  const { data } = await apiClient.post<MeDto>(
    'accounts/me/username/', { username },
  );
  return data;
}

/**
 * POST /api/accounts/me/avatar/
 *
 * Upload a new avatar (multipart/form-data).
 * Validation: max 5 MB, JPEG/PNG/WEBP, min 64px, max 4096px.
 * The backend resizes to 256x256 and stores it on Cloudinary.
 *
 * FRONTEND USAGE:
 *   const form = new FormData();
 *   form.append('avatar', file);
 *   await uploadAvatar(form);
 */
export async function uploadAvatar(form: FormData): Promise<AvatarHistoryItem> {
  const { data } = await apiClient.post<AvatarHistoryItem>(
    'accounts/me/avatar/', form, withMultipart(),
  );
  return data;
}

/**
 * DELETE /api/accounts/me/avatar/
 *
 * Clear the current avatar. The user shows a default mask or initials
 * until they upload a new one.
 */
export async function clearAvatar(): Promise<void> {
  await apiClient.delete('accounts/me/avatar/');
}

/**
 * GET /api/accounts/me/avatar/history/
 *
 * Paginated history of every avatar this user has ever had.
 * Used by the settings page for "revert to a previous avatar"
 * (future feature — currently read-only audit).
 */
export async function getAvatarHistory(): Promise<Paginated<AvatarHistoryItem>> {
  const { data } = await apiClient.get<Paginated<AvatarHistoryItem>>(
    'accounts/me/avatar/history/',
  );
  return data;
}

/**
 * POST /api/accounts/me/deactivate/
 *
 * Deactivate the account. Schedules a hard delete 30 days out.
 * Logs the user out immediately.
 * The user can log back in within 30 days to cancel the deletion.
 *
 * UI CONFIRMATION:
 *   Require the user to type their username to confirm.
 */
export async function deactivateAccount(payload: DeactivatePayload = {}): Promise<{
  detail: string;
  scheduled_deletion_at: string;
}> {
  const { data } = await apiClient.post('accounts/me/deactivate/', payload);
  return data;
}

/**
 * GET /api/accounts/me/sessions/
 *
 * Audit log of every session (login) for this user. Used on the
 * Security settings tab — "these are the devices that have signed in."
 * The `ended_at` field is null for currently-active sessions.
 */
export async function getSessions(): Promise<Paginated<SessionItem>> {
  const { data } = await apiClient.get<Paginated<SessionItem>>(
    'accounts/me/sessions/',
  );
  return data;
}

// Stand With (private one-way bookmark)

/**
 * GET /api/accounts/me/stand-with/
 *
 * List of users THIS user stands with. Only the current user sees this —
 * the target user never sees it.
 */
export async function getMyStandWith(): Promise<Paginated<StandWithItem>> {
  const { data } = await apiClient.get<Paginated<StandWithItem>>(
    'accounts/me/stand-with/',
  );
  return data;
}

/**
 * POST /api/accounts/<username>/stand-with/
 *
 * Toggle stand-with on a user.
 * Response: { standing_with: boolean } — true = now standing, false = unstood.
 * Silent-fails if the target has blocked the current user.
 */
export async function toggleStandWith(username: string): Promise<{ standing_with: boolean }> {
  const { data } = await apiClient.post<{ standing_with: boolean }>(
    `accounts/${username}/stand-with/`,
  );
  return data;
}

// Companion (mutual connection)

/**
 * GET /api/accounts/me/companions/
 *
 * Accepted companions only. The user can have many.
 */
export async function getMyCompanions(): Promise<Paginated<CompanionItem>> {
  const { data } = await apiClient.get<Paginated<CompanionItem>>(
    'accounts/me/companions/',
  );
  return data;
}

/**
 * GET /api/accounts/me/companions/pending/
 *
 * Incoming companion requests awaiting the user's response.
 * UI: show a badge on the "Companions" tab; the count comes from
 * `MeDto.pending_companion_requests_count`.
 */
export async function getPendingCompanionRequests(): Promise<Paginated<CompanionItem>> {
  const { data } = await apiClient.get<Paginated<CompanionItem>>(
    'accounts/me/companions/pending/',
  );
  return data;
}

/**
 * POST /api/accounts/<username>/companion/
 *
 * Send a companion request.
 * 409 if a request already exists in either direction.
 * 403 if the target has `accepts_companion_requests = False`.
 */
export async function sendCompanionRequest(username: string): Promise<CompanionItem> {
  const { data } = await apiClient.post<CompanionItem>(
    `accounts/${username}/companion/`,
  );
  return data;
}

/**
 * POST /api/accounts/companions/<id>/accept/
 * POST /api/accounts/companions/<id>/decline/
 *
 * Respond to a pending companion request. Only the recipient can call this.
 */
export async function respondToCompanion(
  companionId: number,
  action: 'accept' | 'decline',
): Promise<CompanionItem> {
  const { data } = await apiClient.post<CompanionItem>(
    `accounts/companions/${companionId}/${action}/`,
  );
  return data;
}

/**
 * POST /api/accounts/companions/<id>/cancel/
 *
 * Cancel a pending request that YOU initiated. Only works on pending.
 */
export async function cancelCompanionRequest(companionId: number): Promise<void> {
  await apiClient.post(`accounts/companions/${companionId}/cancel/`);
}

// Block

/**
 * POST /api/accounts/<username>/block/
 *
 * Toggle block. Blocking automatically removes:
 *   - both directions of stand-with
 *   - any companion (pending or accepted)
 * Response: { blocked: boolean }.
 */
export async function toggleBlock(username: string): Promise<{ blocked: boolean }> {
  const { data } = await apiClient.post<{ blocked: boolean }>(
    `accounts/${username}/block/`,
  );
  return data;
}

/**
 * GET /api/accounts/blocks/
 *
 * List of users the current user has blocked.
 * Shown in Privacy settings with an "unblock" button per row.
 */
export async function getBlockedUsers(): Promise<Paginated<BlockItem>> {
  const { data } = await apiClient.get<Paginated<BlockItem>>('accounts/blocks/');
  return data;
}

// Public profile + search

/**
 * GET /api/accounts/profile/<username>/
 *
 * Public profile view. Behavior varies:
 *   - Public profile → full PublicUserDto
 *   - Private profile viewed by stranger → limited payload with
 *     `is_private: true`. UI should show a "This user keeps their
 *     profile private" overlay.
 *   - Private profile viewed by owner → full payload.
 */
export async function getPublicProfile(username: string): Promise<PublicUserDto> {
  const { data } = await apiClient.get<PublicUserDto>(
    `accounts/profile/${username}/`,
  );
  return data;
}

/**
 * GET /api/accounts/search/?q=<query>
 *
 * Search users by username / display_name. Respects privacy:
 *   - private profiles excluded
 *   - users with show_in_search=False excluded
 *   - users blocked either way excluded
 *
 * UI: debounce 300ms. Minimum 2 chars (backend returns empty for 1).
 */
export async function searchUsers(query: string): Promise<Paginated<PublicUserDto>> {
  const { data } = await apiClient.get<Paginated<PublicUserDto>>(
    'accounts/search/', { params: { q: query } },
  );
  return data;
}