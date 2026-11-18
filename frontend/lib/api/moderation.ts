/**
 * moderation.ts
 *
 * Client for `/api/moderation/*`.
 *
 * TWO AUDIENCES:
 *   1. Regular users → submitReport() only. That's it.
 *   2. Moderators (is_staff) → everything else.
 *
 * The moderator endpoints return 403 for non-staff. The UI should
 * hide the /moderator routes entirely for non-staff.
 */
import { apiClient } from './client';
import type {
  ContentStatus, ContentType, ModerationFlagDto,
  Paginated, ReportDto, ReportPayload,
} from './types';

// ────────────────────────────────────────────────────────────
// Report submission (any authenticated user)
// ────────────────────────────────────────────────────────────

/**
 * POST /api/moderation/reports/
 *
 * Submit a report against any content type.
 * - One report per user per content (409 on duplicate).
 * - The reporter's identity is NOT exposed in the moderation queue.
 * - The backend validates that the target still exists (400 if not).
 *
 * WHERE TO WIRE THIS UP:
 *   - "..." menu on every post card → "Report"
 *   - "..." menu on every comment → "Report"
 *   - "..." menu on every discussion message → "Report"
 *   - Public profile "..." menu → "Report user"
 */
export async function submitReport(payload: ReportPayload): Promise<ReportDto> {
  const { data } = await apiClient.post<ReportDto>('moderation/reports/', payload);
  return data;
}

// ────────────────────────────────────────────────────────────
// Queues (moderators only — is_staff=True)
// ────────────────────────────────────────────────────────────

/**
 * GET /api/moderation/queue/flags/
 *
 * Unreviewed flags, ordered by severity (critical → medium → low)
 * then by recency. This is the moderator's primary inbox.
 *
 * Each flag has `content_preview` (200 chars of the flagged text)
 * and `severity_label` for the UI badge.
 */
export async function getFlagQueue(): Promise<Paginated<ModerationFlagDto>> {
  const { data } = await apiClient.get<Paginated<ModerationFlagDto>>(
    'moderation/queue/flags/',
  );
  return data;
}

/**
 * GET /api/moderation/queue/reports/
 *
 * Unresolved user reports, newest first.
 */
export async function getReportQueue(): Promise<Paginated<ReportDto>> {
  const { data } = await apiClient.get<Paginated<ReportDto>>(
    'moderation/queue/reports/',
  );
  return data;
}

// ────────────────────────────────────────────────────────────
// Resolve (moderators only)
// ────────────────────────────────────────────────────────────

/**
 * POST /api/moderation/flags/<id>/resolve/
 *
 * Mark a flag as reviewed. Idempotent. Optional `note` is appended
 * to the flag's reason for audit.
 */
export async function resolveFlag(
  flagId: string,
  note: string = '',
): Promise<ModerationFlagDto> {
  const { data } = await apiClient.post<ModerationFlagDto>(
    `moderation/flags/${flagId}/resolve/`, { note },
  );
  return data;
}

/**
 * POST /api/moderation/reports/<id>/resolve/
 *
 * Mark a report as resolved.
 */
export async function resolveReport(
  reportId: string,
  note: string = '',
): Promise<ReportDto> {
  const { data } = await apiClient.post<ReportDto>(
    `moderation/reports/${reportId}/resolve/`, { note },
  );
  return data;
}

/**
 * POST /api/moderation/content/<content_type>/<object_id>/status/
 *
 * The "verdict" endpoint. A moderator decides what happens to the
 * content, and (by default) all related flags/reports are resolved.
 *
 * Body: {
 *   status: 'approved' | 'flagged' | 'removed',
 *   note?: string,           // audit
 *   auto_resolve?: boolean   // default true
 * }
 *
 * USE THIS from the flag card when the moderator makes a decision:
 *   - "Approve post" → status='approved'
 *   - "Remove post"  → status='removed'
 *   - "Leave flagged" → status='flagged'
 */
export async function setContentStatus(
  contentType: ContentType,
  objectId: string,
  payload: {
    status: ContentStatus;
    note?: string;
    auto_resolve?: boolean;
  },
): Promise<{
  content_type: ContentType;
  object_id: string;
  status: ContentStatus;
  flags_resolved?: number;
  reports_resolved?: number;
}> {
  const { data } = await apiClient.post(
    `moderation/content/${contentType}/${objectId}/status/`, payload,
  );
  return data;
}