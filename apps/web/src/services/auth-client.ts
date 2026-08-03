// The one place allowed to hold and mutate the access token, and the one
// place that orchestrates token refresh — every other resource client
// depends on this, never reimplements it.
// (docs/FRONTEND-PHASE-1-API-ARCHITECTURE.md §2.3/§2.4)
//
// Deliberately creates its OWN small ApiClient instance (`authApi`)
// rather than importing services/api-client.ts's main `apiClient`: every
// call this module makes goes through packages/api-client's auth
// resource, which sets `skipAuthRetry: true` on every single endpoint
// (register/login/refresh/logout/logoutAll/forgot-password/reset-
// password/verify-email — none of them should ever trigger a nested
// refresh-on-401). Because of that, this module's own `onUnauthorized`
// is provably never invoked, and giving it a real implementation would
// only invite a circular import between this file and api-client.ts for
// no behavioral benefit. api-client.ts (the main client, used for
// everything else) imports FROM this module to get `getAccessToken` and
// `handleUnauthorized` — the dependency only ever points one way.

import { createApiClient } from '@phoenix/api-client';
import type { AuthUser } from '@phoenix/types';
import { env } from '../config/env';
import { decodeJwtPayload } from '../utils/jwt';

const authApi = createApiClient({
  baseUrl: env.apiBaseUrl,
  getAccessToken: () => accessToken,
  onUnauthorized: async () => null, // never actually invoked — see file header.
});

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getCurrentAuthUser(): AuthUser | null {
  if (!accessToken) return null;
  const claims = decodeJwtPayload(accessToken);
  if (!claims) return null;
  // The login/refresh response's own `user` object (email, roles, locale)
  // is the richer source held by AuthProvider; this is a lighter-weight
  // fallback derived purely from the token when only the claims are
  // needed (e.g. a role check before the profile has loaded).
  return { id: claims.sub, email: '', roles: claims.roles, locale: '' };
}

/**
 * Single-flight refresh (docs/FRONTEND-PHASE-1-API-ARCHITECTURE.md §2.4,
 * "refresh queue" / "concurrent request protection"): N concurrent 401s
 * across the app all call this function; only the first actually issues
 * `POST /auth/refresh` — every other caller awaits the same in-flight
 * promise instead of firing a duplicate request.
 */
export async function handleUnauthorized(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }
  refreshPromise = authApi.auth
    .refresh()
    .then((result) => {
      if (result.error) {
        setAccessToken(null);
        return null;
      }
      setAccessToken(result.data.accessToken);
      return result.data.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

/** App boot / hard-refresh recovery (docs §4.11): relies entirely on the httpOnly refresh_token cookie — no error is surfaced on failure, an anonymous visitor hitting this is the expected common case. */
export async function recoverSession(): Promise<AuthUser | null> {
  const token = await handleUnauthorized();
  return token ? getCurrentAuthUser() : null;
}

export async function login(email: string, password: string) {
  const result = await authApi.auth.login({ email, password });
  if (result.error) {
    return result;
  }
  setAccessToken(result.data.accessToken);
  return result;
}

export async function register(params: { email: string; password: string; displayName: string; locale?: 'ar' | 'en' }) {
  return authApi.auth.register(params);
}

export async function verifyEmail(token: string) {
  return authApi.auth.verifyEmail({ token });
}

export async function forgotPassword(email: string) {
  return authApi.auth.forgotPassword({ email });
}

export async function resetPassword(token: string, newPassword: string) {
  return authApi.auth.resetPassword({ token, newPassword });
}

/** Ends only the current session — the acting device is logged out, other sessions are untouched. */
export async function logout(): Promise<void> {
  await authApi.auth.logout();
  setAccessToken(null);
}

/** Ends EVERY session, including the acting one (matches the real backend: auth.controller.ts's logoutAll clears the current session's cookie too) — forces a fresh login regardless of which device called it. */
export async function logoutAll(): Promise<{ sessionsRevoked: number }> {
  const result = await authApi.auth.logoutAll();
  setAccessToken(null);
  if (result.error) {
    return { sessionsRevoked: 0 };
  }
  return result.data;
}
