import type { ApiError } from './errors';

/**
 * Injected at construction time (createApiClient(config)) rather than
 * read from global state — this is what lets apps/web and a future
 * apps/mobile (apps/admin is retired, see
 * docs/09-PLATFORM-ARCHITECTURE.md §16) each supply their own token
 * storage / refresh strategy without forking this package.
 * (docs/FRONTEND-PHASE-1-API-ARCHITECTURE.md §2.2)
 */
export interface ApiClientConfig {
  /** e.g. http://localhost:4000/api/v1 — no trailing slash. */
  baseUrl: string;
  /** Reads the current in-memory access token; null when signed out. Never reads a cookie/localStorage — the caller (apps/web/src/services/auth-client.ts) owns where this value actually lives. */
  getAccessToken: () => string | null;
  /**
   * Called on a 401 from an endpoint that isn't itself an auth endpoint.
   * Must perform (or await an already-in-flight) token refresh and
   * return the new access token, or null if the refresh itself failed
   * (session genuinely gone). The request wrapper retries the original
   * request exactly once if this resolves to a non-null token.
   */
  onUnauthorized: () => Promise<string | null>;
  /** Called (fire-and-forget) whenever a 403 is returned, for cross-cutting concerns (e.g. redirecting to a 403 page from an admin route) — never blocks the caller from also handling the ApiError itself. */
  onForbidden?: (error: ApiError) => void;
  /** Per-request default; individual calls may override via RequestOptions. */
  timeoutMs?: number;
}

export interface RequestOptions {
  /** AbortController-driven; overrides ApiClientConfig.timeoutMs for this call only. */
  timeoutMs?: number;
  /** Auth endpoints (login, register, refresh, forgot/reset-password, verify-email) set this internally — a failed request to one of these must never trigger the onUnauthorized refresh flow (there's no session to refresh yet, or it would recurse on /auth/refresh itself). */
  skipAuthRetry?: boolean;
  /** Omit the Authorization header even if a token is present (currently unused by any Phase 2 endpoint, but kept for a genuinely public call made through an otherwise-authenticated client instance). */
  skipAuthHeader?: boolean;
  /** AbortSignal to compose with the wrapper's own timeout-driven signal — e.g. a caller-provided cancellation (React Query's own signal). */
  signal?: AbortSignal;
}

export type ApiResult<T> = { data: T; error: null } | { data: null; error: ApiError };
