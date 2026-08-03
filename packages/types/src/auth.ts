// docs/16-API-CONTRACT.md §1 (Authentication). Every shape below is
// verified against the real backend (apps/api/src/modules/auth/
// auth.controller.ts + auth.service.ts + dto/*.ts) at
// backup/backend-production-ready-v1 @ 05f9a7a67c40a738d0e8da21073e731b4e043282,
// not just the docs — see individual field comments where the two differ.

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  locale?: 'ar' | 'en';
}

/** Always this exact shape, whether or not the email was already taken — docs/16 enumeration-prevention; the frontend must never branch on it. */
export interface RegisterResponse {
  userId: string;
  email: string;
  verificationRequired: true;
}

export interface LoginRequest {
  email: string;
  password: string;
  /** Accepted by the DTO but never checked server-side yet — MFA is BLOCKED BY DOCUMENTATION in the real backend (no TOTP-secret column exists). Sending it is harmless but has no effect. */
  mfaCode?: string;
}

/** JWT claims as actually signed by AuthService (common/interfaces/jwt-payload.interface.ts) — decoded client-side for role checks, never re-verified (no secret on the client). */
export interface JwtClaims {
  sub: string;
  sessionId: string;
  roles: string[];
  adminScope?: boolean;
  iat?: number;
  exp?: number;
  iss?: string;
}

/** The `user` object embedded in the login response — deliberately smaller than the full profile (see UsersModule.getMeView for that). */
export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
  locale: string;
}

/**
 * The refresh token itself is never in this body — verified against
 * auth.controller.ts's `login()`: it's extracted from the service result
 * and set as an httpOnly cookie server-side; only `{ accessToken, user }`
 * is ever returned to the client. Matches this package's own
 * never-store-the-refresh-token-in-JS design (see api-client's auth
 * resource and apps/web/src/services/auth-client.ts).
 */
export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface LogoutAllResponse {
  sessionsRevoked: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

/** Always this exact generic message — enumeration-safe (docs/15-SYSTEM-WORKFLOWS.md §6), the frontend must render it verbatim regardless of whether the account existed. */
export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: true;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  verified: true;
}
