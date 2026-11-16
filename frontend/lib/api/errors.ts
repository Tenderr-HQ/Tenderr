/**
 * errors.ts
 *
 * DRF returns errors in several shapes:
 *   - {detail: "Not found."}                    — simple message
 *   - {field: ["This field is required."]}      — field validation
 *   - {non_field_errors: ["Passwords don't match."]}
 *   - {detail: "You already reported this.", report_id: "..."}
 *
 * Every API function in this codebase throws ApiError.
 * The UI catches it and renders `error.message` — no
 * raw DRF payload ever leaks to the user.
 */
import axios, { AxiosError } from 'axios';

export class ApiError extends Error {
  status: number;
  code: string;
  fields: Record<string, string[]>;
  raw: unknown;

  constructor(opts: {
    message: string;
    status: number;
    code?: string;
    fields?: Record<string, string[]>;
    raw?: unknown;
  }) {
    super(opts.message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code ?? 'unknown';
    this.fields = opts.fields ?? {};
    this.raw = opts.raw;
  }

  /** True for 401 — triggers the login redirect. */
  get isUnauthenticated(): boolean {
    return this.status === 401;
  }

  /** True for 403 — user is logged in but not allowed. */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** True for 404 — resource gone. */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** True for 429 — rate-limited. */
  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

export function toApiError(error: unknown): ApiError {
  // Network error (no response)
  if (axios.isAxiosError(error) && !error.response) {
    return new ApiError({
      message: 'Cannot reach the server. Check your connection.',
      status: 0,
      code: 'network',
      raw: error,
    });
  }

  // Axios error with response
  if (axios.isAxiosError(error)) {
    const axErr = error as AxiosError<Record<string, unknown>>;
    const status = axErr.response?.status ?? 500;
    const data = axErr.response?.data ?? {};

    // DRF simple detail
    if (typeof data === 'object' && 'detail' in data && typeof data.detail === 'string') {
      return new ApiError({ message: data.detail, status, raw: data });
    }

    // DRF field errors
    const fields: Record<string, string[]> = {};
    let firstMessage = '';
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
        fields[key] = value as string[];
        if (!firstMessage) firstMessage = (value as string[])[0];
      }
    }
    if (firstMessage) {
      return new ApiError({ message: firstMessage, status, fields, raw: data });
    }

    // Fallback
    return new ApiError({
      message: `Request failed (${status})`,
      status,
      raw: data,
    });
  }

  // Non-axios error
  return new ApiError({
    message: error instanceof Error ? error.message : 'Unknown error',
    status: 500,
    raw: error,
  });
}