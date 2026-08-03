import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  LogoutAllResponse,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
} from '@phoenix/types';
import type { RequestFn } from '../core/request';

/**
 * docs/16-API-CONTRACT.md §1 (Authentication), verified endpoint-by-
 * endpoint against apps/api/src/modules/auth/auth.controller.ts.
 *
 * Every call here sets `skipAuthRetry: true` — none of these endpoints
 * should ever trigger the 401 → refresh → retry flow (core/request.ts):
 * a failed login/register has no session to refresh, and calling
 * `refresh` itself from inside the "refresh on 401" handler would
 * recurse. `logout`/`logoutAll` are the only two that carry a real
 * access token and could theoretically 401 (e.g. an already-expired
 * token) — even then, retrying via refresh only to immediately log out
 * again is pointless, so they're excluded too, consistently.
 */
export function createAuthResource(request: RequestFn) {
  return {
    register: (body: RegisterRequest) =>
      request<RegisterResponse>({ method: 'POST', path: '/auth/register', body, skipAuthRetry: true }),

    verifyEmail: (body: VerifyEmailRequest) =>
      request<VerifyEmailResponse>({ method: 'POST', path: '/auth/verify-email', body, skipAuthRetry: true }),

    login: (body: LoginRequest) =>
      request<LoginResponse>({ method: 'POST', path: '/auth/login', body, skipAuthRetry: true }),

    /** Relies entirely on the httpOnly refresh_token cookie (credentials: 'include', set by core/request.ts) — no body. */
    refresh: () => request<RefreshResponse>({ method: 'POST', path: '/auth/refresh', skipAuthRetry: true }),

    logout: () => request<void>({ method: 'POST', path: '/auth/logout', skipAuthRetry: true }),

    logoutAll: () => request<LogoutAllResponse>({ method: 'POST', path: '/auth/logout-all', skipAuthRetry: true }),

    forgotPassword: (body: ForgotPasswordRequest) =>
      request<ForgotPasswordResponse>({ method: 'POST', path: '/auth/forgot-password', body, skipAuthRetry: true }),

    resetPassword: (body: ResetPasswordRequest) =>
      request<ResetPasswordResponse>({ method: 'POST', path: '/auth/reset-password', body, skipAuthRetry: true }),
  };
}

export type AuthResource = ReturnType<typeof createAuthResource>;
