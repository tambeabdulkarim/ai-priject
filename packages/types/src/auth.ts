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
}

/**
 * docs/10-SECURITY-BIBLE.md §5 (Phase 14.2). `POST /auth/login` returns
 * this instead of `LoginResponse` when the account has MFA enabled — no
 * refresh cookie is set, no real tokens exist yet. The client must then
 * call `POST /auth/mfa/verify` with this `challengeToken` + the user's
 * code to complete login. See the MFA Security Architecture Review for
 * why this two-step shape was chosen over an inline `mfaCode` field on
 * `LoginRequest` (the old field — removed, it was never checked
 * server-side and the two-step flow replaces it entirely).
 */
export interface MfaChallengeResponse {
  mfaRequired: true;
  challengeToken: string;
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

/** What `POST /auth/login` actually returns — either real tokens, or an MFA challenge to resolve via `POST /auth/mfa/verify`. */
export type LoginResult = LoginResponse | MfaChallengeResponse;

// --- MFA (docs/10-SECURITY-BIBLE.md §5, Phase 14.2) ---

/** POST /auth/mfa/verify — step 2 of the login challenge/response flow. `code` accepts either a 6-digit TOTP code or an XXXXX-XXXXX recovery code; the server tries both. */
export interface MfaVerifyRequest {
  challengeToken: string;
  code: string;
}

/** POST /auth/mfa/enroll/begin. `secret` is shown for manual entry; `otpauthUri` is rendered as a QR code. Neither is stored client-side beyond the enrollment screen's lifetime. */
export interface MfaEnrollBeginResponse {
  secret: string;
  otpauthUri: string;
}

export interface MfaEnrollConfirmRequest {
  code: string;
}

/**
 * `recoveryCodes` is the ONLY time these codes are ever visible in
 * plaintext — the server stores only their hashes (docs/10-SECURITY-
 * BIBLE.md §5) — the UI must make the user save them now, with no way to
 * view them again short of regenerating (which invalidates these).
 */
export interface MfaEnrollConfirmResponse {
  recoveryCodes: string[];
}

export interface MfaDisableRequest {
  password: string;
}

export interface MfaRegenerateRecoveryCodesResponse {
  recoveryCodes: string[];
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
