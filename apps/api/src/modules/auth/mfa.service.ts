// docs/10-SECURITY-BIBLE.md §5 (MFA Policy). Pure TOTP/recovery-code
// primitives — no DB access, no HTTP concerns — kept separate from
// AuthService (which orchestrates login/session/audit, same layering
// AuthService already uses for PasswordService/BreachedPasswordService).
//
// Pinned to otplib v12 (`^12.0.1`), not the current v13 major:
// v13 rewrote the package as ESM-first with a `@scure/base` transitive
// dependency that ships no CommonJS build at all. Real Node (v22+) can
// `require()` it via native ESM interop, but Jest's own CJS module
// runtime cannot, so every test touching this file failed with
// "Unexpected token 'export'" — a real, verified incompatibility, not a
// hypothetical one. v12's classic `authenticator` API is fully
// synchronous CommonJS, RFC 6238-compliant, and has no such dependency —
// the stronger engineering choice here is avoiding an unstable
// ESM/CJS interop fight entirely, not working around it.

import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { authenticator } from 'otplib';

const ISSUER = 'Phoenix Platform';
const RECOVERY_CODE_COUNT = 10;

@Injectable()
export class MfaService {
  /** A new base32 TOTP secret — RFC 6238 default (SHA-1, 30s step, 6 digits), the universally-compatible authenticator-app configuration. */
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  /** `otpauth://` URI for QR-code rendering — the secret itself is also returned separately by the caller for manual entry (some authenticator apps don't scan). */
  buildOtpauthUri(email: string, secret: string): string {
    return authenticator.keyuri(email, ISSUER, secret);
  }

  /** `otplib`'s default verify already tolerates one step of clock drift either side — real-world authenticator-app clocks are rarely perfectly synced. */
  verifyCode(secret: string, code: string): boolean {
    try {
      return authenticator.verify({ token: code, secret });
    } catch {
      // otplib throws on a malformed token (e.g. non-numeric) rather than
      // returning false — treat that identically to "wrong code", not a
      // server error.
      return false;
    }
  }

  /**
   * docs/10-SECURITY-BIBLE.md §5: "Recovery codes (single-use, 10
   * generated at enrollment)". High-entropy, generated (not user-chosen),
   * human-typeable format: 10 hex chars (40 bits) split as XXXXX-XXXXX —
   * combined with this endpoint's own rate limiting (AuthController) and
   * the account lockout already enforced on repeated login failures, a
   * reasonable margin without asking users to type an unwieldy string.
   */
  generateRecoveryCodes(): string[] {
    return Array.from({ length: RECOVERY_CODE_COUNT }, () => {
      const raw = randomBytes(5).toString('hex').toUpperCase(); // 10 hex chars
      return `${raw.slice(0, 5)}-${raw.slice(5)}`;
    });
  }

  /**
   * Same reasoning as RefreshTokensService.hash: recovery codes are
   * high-entropy generated secrets, not user-chosen passwords, so a fast
   * deterministic hash (not Argon2id) is correct — and required, to look
   * a submitted code up by hash in O(1) via the unique index rather than
   * comparing against every row.
   */
  hashRecoveryCode(code: string): string {
    return createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
  }
}
