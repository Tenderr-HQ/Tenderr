/**
 * settings.ts
 *
 * Client for `/api/settings/*` — seven tabs plus two action endpoints.
 *
 * DESIGN NOTES:
 *   - Each endpoint is GET + PATCH for its own fields only.
 *   - The backend writes `is_profile_private` to BOTH UserSettings
 *     and User, so changing it here immediately affects permission
 *     checks everywhere.
 *   - `/notifications/` proxies to `apps.notifications` — the shape
 *     matches NotificationSettingsDto.
 */
import { apiClient } from './client';
import type {
  AccountSettingsDto, AppearanceSettingsDto, DataStorageSettingsDto,
  HelpSupportDto, LanguageCode, LanguageSettingsDto,
  NotificationSettingsDto, PrivacySettingsDto, SecuritySettingsDto,
  Theme, FontSize,
} from './types';

// ────────────────────────────────────────────────────────────
// Account (read-only summary)
// ────────────────────────────────────────────────────────────

/**
 * GET /api/settings/account/
 *
 * Summary shown at the top of the Settings page.
 * Writes go through /api/accounts/me/, not here — this endpoint
 * is read-only by design.
 */
export async function getAccountSettings(): Promise<AccountSettingsDto> {
  const { data } = await apiClient.get<AccountSettingsDto>('settings/account/');
  return data;
}

// ────────────────────────────────────────────────────────────
// Privacy
// ────────────────────────────────────────────────────────────

/**
 * GET /api/settings/privacy/
 */
export async function getPrivacySettings(): Promise<PrivacySettingsDto> {
  const { data } = await apiClient.get<PrivacySettingsDto>('settings/privacy/');
  return data;
}

/**
 * PATCH /api/settings/privacy/
 *
 * Toggling `is_profile_private` affects:
 *   - /api/accounts/profile/<username>/ (returns limited payload)
 *   - /api/accounts/search/ (user disappears from results)
 *   - every `author_info` for this user (masked as "private")
 *
 * Because of this, after PATCH the UI should invalidate the current
 * user cache (useCurrentUser) and any public profile view of self.
 */
export async function updatePrivacySettings(
  patch: Partial<PrivacySettingsDto>,
): Promise<PrivacySettingsDto> {
  const { data } = await apiClient.patch<PrivacySettingsDto>(
    'settings/privacy/', patch,
  );
  return data;
}

// ────────────────────────────────────────────────────────────
// Notifications (proxied to apps.notifications)
// ────────────────────────────────────────────────────────────

/**
 * GET /api/settings/notifications/
 *
 * Email + push preferences. In-app notifications are always on.
 */
export async function getNotificationSettings(): Promise<NotificationSettingsDto> {
  const { data } = await apiClient.get<NotificationSettingsDto>(
    'settings/notifications/',
  );
  return data;
}

/**
 * PATCH /api/settings/notifications/
 *
 * `email_digest` supersedes the per-type email flags — when true,
 * comments and letters are batched into the nightly digest instead
 * of real-time emails. UI should visually disable the per-type
 * toggles when digest is on.
 */
export async function updateNotificationSettings(
  patch: Partial<NotificationSettingsDto>,
): Promise<NotificationSettingsDto> {
  const { data } = await apiClient.patch<NotificationSettingsDto>(
    'settings/notifications/', patch,
  );
  return data;
}

// ────────────────────────────────────────────────────────────
// Security
// ────────────────────────────────────────────────────────────

/**
 * GET /api/settings/security/
 */
export async function getSecuritySettings(): Promise<SecuritySettingsDto> {
  const { data } = await apiClient.get<SecuritySettingsDto>('settings/security/');
  return data;
}

/**
 * PATCH /api/settings/security/
 *
 * `two_factor_enabled` is stored but not enforced yet — the 2FA flow
 * ships with the mobile app. The toggle is fine to expose now; it just
 * doesn't change login behavior yet.
 *
 * `login_alerts` controls the "new login from <IP>" email.
 */
export async function updateSecuritySettings(
  patch: Partial<SecuritySettingsDto>,
): Promise<SecuritySettingsDto> {
  const { data } = await apiClient.patch<SecuritySettingsDto>(
    'settings/security/', patch,
  );
  return data;
}

// ────────────────────────────────────────────────────────────
// Appearance
// ────────────────────────────────────────────────────────────

/**
 * GET /api/settings/appearance/
 */
export async function getAppearanceSettings(): Promise<AppearanceSettingsDto> {
  const { data } = await apiClient.get<AppearanceSettingsDto>(
    'settings/appearance/',
  );
  return data;
}

/**
 * PATCH /api/settings/appearance/
 *
 * After success, apply the new theme/font-size to the DOM
 * (data-theme + data-font-size on <html>). Persist to localStorage
 * so the first paint after reload uses the right theme.
 */
export async function updateAppearanceSettings(
  patch: Partial<AppearanceSettingsDto>,
): Promise<AppearanceSettingsDto> {
  const { data } = await apiClient.patch<AppearanceSettingsDto>(
    'settings/appearance/', patch,
  );
  return data;
}

// ────────────────────────────────────────────────────────────
// Language
// ────────────────────────────────────────────────────────────

/**
 * GET /api/settings/language/
 */
export async function getLanguageSettings(): Promise<LanguageSettingsDto> {
  const { data } = await apiClient.get<LanguageSettingsDto>(
    'settings/language/',
  );
  return data;
}

/**
 * PATCH /api/settings/language/
 *
 * The frontend reads this on load and applies the translation.
 * Changing it does not reload the page — the i18n provider picks up
 * the new locale on the next render.
 */
export async function updateLanguageSettings(
  language: LanguageCode,
): Promise<LanguageSettingsDto> {
  const { data } = await apiClient.patch<LanguageSettingsDto>(
    'settings/language/', { language },
  );
  return data;
}

// ────────────────────────────────────────────────────────────
// Data & Storage
// ────────────────────────────────────────────────────────────

/**
 * GET /api/settings/data-storage/
 */
export async function getDataStorageSettings(): Promise<DataStorageSettingsDto> {
  const { data } = await apiClient.get<DataStorageSettingsDto>(
    'settings/data-storage/',
  );
  return data;
}

/**
 * PATCH /api/settings/data-storage/
 *
 * Only the two booleans are writable. The timestamps are read-only
 * (set by export and delete endpoints).
 */
export async function updateDataStorageSettings(
  patch: Pick<DataStorageSettingsDto, 'auto_save_drafts' | 'keep_anonymous_history'>,
): Promise<DataStorageSettingsDto> {
  const { data } = await apiClient.patch<DataStorageSettingsDto>(
    'settings/data-storage/', patch,
  );
  return data;
}

/**
 * POST /api/settings/data-storage/export/
 *
 * Request a full data export. The backend enqueues a Celery task
 * to build the archive and emails it to the user. Show a "we'll
 * email you when it's ready" confirmation.
 */
export async function requestDataExport(): Promise<{
  detail: string;
  export_requested_at: string;
}> {
  const { data } = await apiClient.post('settings/data-storage/export/');
  return data;
}

/**
 * POST /api/settings/data-storage/delete/
 *
 * Schedule account deletion 30 days out. UI REQUIRES a confirmation
 * dialog where the user types their username. After success, they
 * can log back in to cancel.
 */
export async function scheduleAccountDeletion(): Promise<{
  detail: string;
  delete_scheduled_at: string;
}> {
  const { data } = await apiClient.post('settings/data-storage/delete/');
  return data;
}

/**
 * DELETE /api/settings/data-storage/delete/
 *
 * Cancel a scheduled account deletion.
 */
export async function cancelAccountDeletion(): Promise<{
  detail: string;
  delete_scheduled_at: null;
}> {
  const { data } = await apiClient.delete('settings/data-storage/delete/');
  return data;
}

// ────────────────────────────────────────────────────────────
// Help & Support (static)
// ────────────────────────────────────────────────────────────

/**
 * GET /api/settings/help/
 *
 * Static content:
 *   - support_email
 *   - faq_url, terms_url, privacy_url
 *   - crisis_resources[]: region + name + phone + url
 *
 * RENDER THIS PROMINENTLY on the Help tab. Crisis resources should
 * also be visible from the post detail page footer and from a global
 * floating "Need help now?" button.
 */
export async function getHelpSupport(): Promise<HelpSupportDto> {
  const { data } = await apiClient.get<HelpSupportDto>('settings/help/');
  return data;
}