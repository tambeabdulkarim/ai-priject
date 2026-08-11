import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  LoginResult,
  LogoutAllResponse,
  MfaDisableRequest,
  MfaEnrollBeginResponse,
  MfaEnrollConfirmRequest,
  MfaEnrollConfirmResponse,
  MfaRegenerateRecoveryCodesResponse,
  MfaVerifyRequest,
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
      request<RegisterResponse>({
        method: 'POST',
        path: '/auth/register',
        body,
        skipAuthRetry: true,
      }),

    verifyEmail: (body: VerifyEmailRequest) =>
      request<VerifyEmailResponse>({
        method: 'POST',
        path: '/auth/verify-email',
        body,
        skipAuthRetry: true,
      }),

    /** docs/10-SECURITY-BIBLE.md §5 (Phase 14.2): returns `LoginResponse` OR `MfaChallengeResponse` — the caller must check `'mfaRequired' in result` before touching `.accessToken`. */
    login: (body: LoginRequest) =>
      request<LoginResult>({ method: 'POST', path: '/auth/login', body, skipAuthRetry: true }),

    /** Step 2 of the MFA challenge/response flow — no access token exists yet at this point, same reasoning as `login`. */
    mfaVerify: (body: MfaVerifyRequest) =>
      request<LoginResponse>({
        method: 'POST',
        path: '/auth/mfa/verify',
        body,
        skipAuthRetry: true,
      }),

    /** Relies entirely on the httpOnly refresh_token cookie (credentials: 'include', set by core/request.ts) — no body. */
    refresh: () =>
      request<RefreshResponse>({ method: 'POST', path: '/auth/refresh', skipAuthRetry: true }),

    logout: () => request<void>({ method: 'POST', path: '/auth/logout', skipAuthRetry: true }),

    logoutAll: () =>
      request<LogoutAllResponse>({ method: 'POST', path: '/auth/logout-all', skipAuthRetry: true }),

    forgotPassword: (body: ForgotPasswordRequest) =>
      request<ForgotPasswordResponse>({
        method: 'POST',
        path: '/auth/forgot-password',
        body,
        skipAuthRetry: true,
      }),

    resetPassword: (body: ResetPasswordRequest) =>
      request<ResetPasswordResponse>({
        method: 'POST',
        path: '/auth/reset-password',
        body,
        skipAuthRetry: true,
      }),

    // docs/10-SECURITY-BIBLE.md §5 (Phase 14.2) — enrollment/management,
    // all authenticated (unlike everything above): deliberately NOT
    // `skipAuthRetry` — these behave like any other authenticated call
    // (e.g. users.changePassword), so a 401 from an expired access token
    // should go through the normal refresh-and-retry flow, not fail outright.
    mfaEnrollBegin: () =>
      request<MfaEnrollBeginResponse>({ method: 'POST', path: '/auth/mfa/enroll/begin' }),

    mfaEnrollConfirm: (body: MfaEnrollConfirmRequest) =>
      request<MfaEnrollConfirmResponse>({ method: 'POST', path: '/auth/mfa/enroll/confirm', body }),

    mfaDisable: (body: MfaDisableRequest) =>
      request<void>({ method: 'POST', path: '/auth/mfa/disable', body }),

    mfaRegenerateRecoveryCodes: () =>
      request<MfaRegenerateRecoveryCodesResponse>({
        method: 'POST',
        path: '/auth/mfa/recovery-codes/regenerate',
      }),
  };
}

export type AuthResource = ReturnType<typeof createAuthResource>;
