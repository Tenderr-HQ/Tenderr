/**
 * client.ts
 *
 * The single axios instance every API module imports.
 *
 * FEATURES:
 *   1. Attaches `Authorization: Bearer <access>` to every request.
 *   2. On 401, silently tries to refresh the token ONCE. If the refresh
 *      succeeds, retries the original request transparently. If refresh
 *      fails, clears the session and redirects to /login.
 *   3. Throttles concurrent 401s — 10 simultaneous requests each
 *      401-ing → ONE refresh call, not 10.
 *   4. Normalizes errors via `toApiError()` so callers get ApiError.
 *
 * TOKENS:
 *   - Stored in `localStorage` (client-side) or read from cookies (SSR).
 *   - Access token: 30 min lifetime (from settings).
 *   - Refresh token: 14 days.
 *
 * WHEN DO TOKENS EXPIRE?
 *   The user is "logged out" when the refresh token expires OR is
 *   blacklisted (after logout). Access token expiry is invisible
 *   to the user because of the silent refresh.
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError, toApiError } from './errors';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const ACCESS_KEY = 'unheard_access';
const REFRESH_KEY = 'unheard_refresh';

// ---------- Token helpers ----------
export const tokenStore = {
  getAccess(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefresh(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ---------- Axios instance ----------
export const apiClient = axios.create({
  baseURL: `${API_BASE.replace(/\/$/, "")}/api/`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90_000,
});

// ---------- Request interceptor: attach access token ----------
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const access = tokenStore.getAccess();
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// ---------- Response interceptor: refresh on 401 ----------
let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only attempt refresh once per request, and never on the
    // refresh endpoint itself (that would loop forever).
    const isRefreshCall = original?.url?.includes('/auth/token/refresh/');
    if (error.response?.status !== 401 || original._retry || isRefreshCall) {
      throw toApiError(error);
    }
    original._retry = true;

    // Deduplicate concurrent refreshes
    if (!refreshPromise) {
      const refresh = tokenStore.getRefresh();
      if (!refresh) {
        tokenStore.clear();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new ApiError({ message: 'Session expired.', status: 401 });
      }
      refreshPromise = axios
        .post<{ access: string }>(`${API_BASE}/api/auth/token/refresh/`, { refresh })
        .then((res) => {
          tokenStore.set(res.data.access, refresh);
          return res.data.access;
        })
        .catch(() => {
          tokenStore.clear();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw new ApiError({ message: 'Session expired.', status: 401 });
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    const newAccess = await refreshPromise;
    original.headers.Authorization = `Bearer ${newAccess}`;
    return apiClient(original);
  },
);

/** Helper for FormData requests (file uploads). */
export function withMultipart(): { headers: { 'Content-Type': string } } {
  return { headers: { 'Content-Type': 'multipart/form-data' } };
}

export { API_BASE };