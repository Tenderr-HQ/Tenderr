/**
 * notifications.ts
 *
 * Client for `/api/notifications/*` — the bell icon, the list page,
 * and preferences.
 *
 * The backend masks actor identity at the serializer level, so
 * `NotificationDto.actor_info` is already safe to render:
 *   - anonymous post → { type: 'anonymous', display: 'Someone' }
 *   - public actor  → { type: 'public', username, avatar_url }
 *   - system        → { type: 'system', display: 'unheard' }
 *
 * NOTHING in the frontend needs to mask usernames — the backend
 * already did it. Do NOT try to "improve" the display by looking at
 * `NotificationDto.actor_info.username` when type is 'anonymous' —
 * it will be null.
 */
import { apiClient } from './client';
import type {
  NotificationDto, Paginated, UnreadCountDto,
} from './types';

// ────────────────────────────────────────────────────────────
// List & count
// ────────────────────────────────────────────────────────────

/**
 * GET /api/notifications/
 *
 * Paginated list, newest first.
 * Optional `?unread=true` filter.
 *
 * UI USAGE:
 *   - `/notifications` page: full paginated list.
 *   - Bell dropdown: fetch only the first page (20 items) without
 *     pagination; on "view all" navigate to the full page.
 */
export async function getNotifications(params: {
  unread?: boolean;
  page?: number;
} = {}): Promise<Paginated<NotificationDto>> {
  const { data } = await apiClient.get<Paginated<NotificationDto>>(
    'notifications/', { params },
  );
  return data;
}

/**
 * GET /api/notifications/unread-count/
 *
 * Cheap endpoint that returns only `{ count }`.
 * Poll this every 60 seconds for the bell badge. Do NOT poll
 * `/notifications/` — that fetches the full list on every poll.
 */
export async function getUnreadCount(): Promise<UnreadCountDto> {
  const { data } = await apiClient.get<UnreadCountDto>(
    'notifications/unread-count/',
  );
  return data;
}

// ────────────────────────────────────────────────────────────
// Read state
// ────────────────────────────────────────────────────────────

/**
 * POST /api/notifications/<id>/read/
 *
 * Mark one notification read. Idempotent.
 * After success, decrement the bell badge locally.
 */
export async function markNotificationRead(id: number): Promise<{ is_read: boolean }> {
  const { data } = await apiClient.post<{ is_read: boolean }>(
    `notifications/${id}/read/`,
  );
  return data;
}

/**
 * POST /api/notifications/read-all/
 *
 * Mark all unread notifications read.
 * Optional `before` (ISO datetime) marks only items created before it —
 * useful if a notification arrives mid-request.
 */
export async function markAllNotificationsRead(before?: string): Promise<{
  marked_read: number;
}> {
  const body = before ? { before } : {};
  const { data } = await apiClient.post<{ marked_read: number }>(
    'notifications/read-all/', body,
  );
  return data;
}

// ────────────────────────────────────────────────────────────
// Delete
// ────────────────────────────────────────────────────────────

/**
 * DELETE /api/notifications/<id>/
 *
 * Hard-delete one notification. Only the owner can delete.
 * After success, decrement the bell badge if it was unread.
 */
export async function deleteNotification(id: number): Promise<void> {
  await apiClient.delete(`notifications/${id}/`);
}

// ────────────────────────────────────────────────────────────
// Preferences
// ────────────────────────────────────────────────────────────

/**
 * GET /api/notifications/preferences/
 *
 * Same data as `/api/settings/notifications/`, but this is the
 * "native" endpoint — use it from the bell dropdown's "settings" link
 * if you don't want to route through the settings page.
 */
export async function getNotificationPreferences(): Promise<{
  email_comments: boolean;
  email_letters: boolean;
  email_digest: boolean;
  push_comments: boolean;
  push_letters: boolean;
}> {
  const { data } = await apiClient.get('notifications/preferences/');
  return data;
}

/**
 * PATCH /api/notifications/preferences/
 *
 * Same as updateNotificationSettings() in settings.ts. Either works —
 * both hit the same model. Prefer settings.ts for the Settings page
 * and this one for the bell dropdown.
 */
export async function updateNotificationPreferences(patch: Partial<{
  email_comments: boolean;
  email_letters: boolean;
  email_digest: boolean;
  push_comments: boolean;
  push_letters: boolean;
}>): Promise<typeof patch> {
  const { data } = await apiClient.patch('notifications/preferences/', patch);
  return data;
}