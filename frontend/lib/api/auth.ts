/**
 * auth.ts
 *
 * Client for `/api/auth/*` — registration, login, OAuth, logout,
 * token refresh, email verification, password reset.
 *
 * FLOW OVERVIEW:
 *   1. Register → returns tokens + requires email verification.
 *   2. Login → returns tokens.
 *   3. OAuth (Google / Apple) → client gets id_token from the provider,
 *      posts it here, backend verifies and returns our tokens.
 *   4. Logout → blacklists the refresh token server-side.
 *   5. Password reset → two-step: request email, then confirm with token.
 */
import { apiClient, tokenStore } from './client';
import type {
  LoginPayload, OAuthPayload, RegisterPayload, TokenPair,
} from './types';

/**
 * POST /api/auth/register/
 *
 * Create a new account.
 * - Sends verification email (24h TTL) and welcome email.
 * - Returns tokens immediately, so the user is logged in even before
 *   they verify their email.
 * - UI should show "Verify your email to unlock all features" banner
 *   until verification completes.
 */
export async function register(payload: RegisterPayload): Promise<TokenPair> {
  const { data } = await apiClient.post<TokenPair>('auth/register/', payload);
  tokenStore.set(data.access, data.refresh);
  return data;
}

/**
 * POST /api/auth/login/
 *
 * Email + password → JWT pair.
 * - On success, tokens are persisted automatically.
 * - On failure, throws ApiError with message "Invalid email or password."
 */
export async function login(payload: LoginPayload): Promise<TokenPair> {
  const { data } = await apiClient.post<TokenPair>('auth/login/', payload);
  tokenStore.set(data.access, data.refresh);
  return data;
}

/**
 * POST /api/auth/oauth/
 *
 * Exchange a Google or Apple `id_token` for unheard tokens.
 *
 * FRONTEND USAGE:
 *   - Google: use `@react-oauth/google`. The GoogleLogin callback gives
 *     you `credential` (the id_token). Pass it here.
 *   - Apple: use `@invertase/react-native-apple-authentication` (mobile)
 *     or Apple's JS SDK (web). The result gives `identityToken`.
 *
 * The backend verifies the token signature against Google's / Apple's
 * public keys. If the provider's email matches an existing account,
 * it links automatically (no duplicate account).
 */
export async function loginWithOAuth(payload: OAuthPayload): Promise<TokenPair> {
  const { data } = await apiClient.post<TokenPair>('auth/oauth/', payload);
  tokenStore.set(data.access, data.refresh);
  return data;
}

/**
 * POST /api/auth/logout/
 *
 * Blacklist the current refresh token. After this, the refresh token
 * cannot be used again — the user is fully logged out on the server side.
 *
 * The access token remains valid until its 30-minute lifetime expires,
 * but since the client clears it immediately, the user is effectively
 * logged out on next API call (which will 401).
 */
export async function logout(): Promise<void> {
  const refresh = tokenStore.getRefresh();
  try {
    if (refresh) {
      await apiClient.post('auth/logout/', { refresh });
    }
  } finally {
    tokenStore.clear();
  }
}

/**
 * POST /api/auth/token/refresh/
 *
 * Rotates the access token using the refresh token.
 * In practice, the interceptor in client.ts calls this automatically —
 * you rarely need to call it manually. Exposed for completeness.
 */
export async function refreshToken(): Promise<{ access: string }> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) throw new Error('No refresh token.');
  const { data } = await apiClient.post<{ access: string }>(
    'auth/token/refresh/', { refresh },
  );
  tokenStore.set(data.access, refresh);
  return data;
}

/**
 * POST /api/auth/token/verify/
 *
 * Check whether an access token is still valid.
 * Useful for the server-side session bootstrapping (SSR) to decide
 * whether to render the authenticated shell or the login page.
 */
export async function verifyToken(token: string): Promise<boolean> {
  try {
    await apiClient.post('auth/token/verify/', { token });
    return true;
  } catch {
    return false;
  }
}

/**
 * POST /api/auth/email/verify/
 *
 * Consume the email-verification token that was sent in the signup
 * email. The token is in the URL query string of the verification
 * email — the frontend route `/verify-email?token=...` extracts it
 * and calls this function.
 *
 * After success: mark the current user as verified in your state
 * (refetch `/api/accounts/me/`).
 */
export async function verifyEmail(token: string): Promise<void> {
  await apiClient.post('auth/email/verify/', { token });
}

/**
 * POST /api/auth/password/reset/
 *
 * Request a password-reset email. Returns 200 whether or not the
 * email exists (to prevent enumeration). Show a generic success
 * message: "If that email exists, a reset link is on its way."
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await apiClient.post('auth/password/reset/', { email });
}

/**
 * POST /api/auth/password/reset/confirm/
 *
 * Complete the reset using the token from the reset email.
 * After success, all sessions are invalidated — the user must
 * log in again with the new password.
 */
export async function confirmPasswordReset(payload: {
  token: string;
  new_password: string;
  new_password_confirm: string;
}): Promise<void> {
  await apiClient.post('auth/password/reset/confirm/', payload);
}