# Restore Point

**Version:** Phase 14.2 (Admin MFA Implementation)

**Status:** Complete — real, working, tested, live-verified TOTP-based MFA

**Date:** 2026-08-05

## Current Project State

Candidate B of `docs/phase-14-plan.md`'s approved order is implemented: real Multi-Factor Authentication (TOTP, `docs/10-SECURITY-BIBLE.md` §5), using the two-step challenge/response architecture selected in the preceding Security Architecture Review (Phase 14.1's session). This is a working feature, not a design document — every claim below is backed by a passing test or a real, live API call against the running backend.

### Two engineering decisions, resolved before implementation began (per this phase's explicit requirement)

1. **TOTP secret protection strategy:** AES-256-GCM symmetric encryption at rest, keyed by a new per-install secret `MFA_ENCRYPTION_KEY` (32 raw bytes, base64), the same pattern already established for `PASSWORD_PEPPER`. Rejected alternatives and why: plaintext storage (violates Security First), one-way hashing (TOTP verification requires the raw secret back — hashing would make it permanently unverifiable), an external KMS/secrets-manager (no such infrastructure exists anywhere in this project — introducing one now would repeat the exact unresolved-infrastructure pattern Storage went through before Phase 13.6 chose a provider). See `apps/api/src/common/services/mfa-crypto.service.ts`'s own header comment for the full reasoning, preserved in code, not just this document.
2. **Notification strategy during enrollment/recovery:** log-only, identical to this codebase's existing, already-disclosed pattern for email verification and password-reset tokens (no email provider is configured anywhere in `.env`/`.env.example`). The audit-log requirement §5 also states ("logged as security-sensitive events") is real and unconditional — independent of the email gap, since `AuditLogService` doesn't depend on email delivery.

### What was built

- **Schema** (migration `20260805075908_add_mfa_support`, applied and baselined against the real Neon database): `User.mfaEnabled` (boolean), `User.mfaSecret` (encrypted, nullable), new `MfaRecoveryCode` table (id, userId, codeHash [unique], usedAt, createdAt — modeled directly on `RefreshToken`'s shape: hashed, single-use, auditable). Purely additive; `prisma validate` confirmed clean before and after.
- **Backend:**
  - `MfaCryptoService` — AES-256-GCM encrypt/decrypt, fails closed (throws) if `MFA_ENCRYPTION_KEY` is empty or wrong-length, rather than silently operating insecurely.
  - `MfaService` — TOTP secret generation, `otpauth://` URI construction, code verification, 10 recovery-code generation (40-bit entropy, `XXXXX-XXXXX` format), SHA-256 recovery-code hashing. Uses `otplib` **v12** (`^12.0.1`), not the current v13 — v13 is ESM-first with a `@scure/base` transitive dependency that has no CommonJS build at all; real Node 22+ can `require()` it via native ESM interop, but Jest's own CJS module runtime cannot, so every test touching MFA failed with `SyntaxError: Unexpected token 'export'` under v13. Diagnosed via direct inspection of the installed package's `dist/*.cjs` and its `require("@scure/base")` call, not guessed. Pinning to the stable, fully-CJS v12 line was judged the stronger engineering choice over fighting an ESM/CJS interop issue in a third-party build system.
  - `MfaRecoveryCodesRepository` — createMany/findByCodeHash/markUsed/deleteAllForUser.
  - `AuthService`: `login()` now branches on `user.mfaEnabled` — if true, issues a 5-minute purpose-token challenge (`type: 'mfa_challenge'`, reusing the exact `signPurposeToken`/`verifyPurposeToken` + Redis-`jti` pattern already used for `email_verification`/`password_reset`) instead of real tokens. New `verifyMfaChallenge` (tries TOTP first, falls back to a recovery code, single-use challenge token, full audit logging on both success and failure paths), `beginMfaEnrollment`, `confirmMfaEnrollment`, `disableMfa` (password-re-confirmation required, matching `ChangePasswordDto`'s existing pattern), `regenerateMfaRecoveryCodes`. Session/token issuance logic extracted into a shared private `issueSessionAndRespond` helper, reused by both the no-MFA `login()` path and the post-challenge `verifyMfaChallenge()` path — no duplicated logic.
  - `UsersService`: `setMfaSecret`/`setMfaEnabled`/`disableMfa` (thin wrappers over the existing generic `usersRepository.update`, mirroring `setPasswordHash`'s established pattern). **`SafeUser`/`toSafeUser` updated to strip `mfaSecret`** exactly like `passwordHash` — verified this doesn't leak via `GET /users/:id`, `PATCH /users/me`, or `GET /users` (admin list). `getMeView` (`GET /users/me`) now returns `mfaEnabled` (boolean only).
  - Five new endpoints: `POST /auth/mfa/verify` (public, rate-limited 10/15min like `login`), `POST /auth/mfa/enroll/begin`, `POST /auth/mfa/enroll/confirm`, `POST /auth/mfa/disable`, `POST /auth/mfa/recovery-codes/regenerate` (all four authenticated).
  - `LoginDto`'s old, never-checked `mfaCode?` field removed entirely (dead code cleaned up, not left as a decoy) — replaced by the two-step flow.
- **Frontend:**
  - `packages/types/src/auth.ts` — `MfaChallengeResponse`, `LoginResult` union, `MfaVerifyRequest`, `MfaEnrollBeginResponse`, `MfaEnrollConfirmRequest`/`Response`, `MfaDisableRequest`, `MfaRegenerateRecoveryCodesResponse`. `packages/types/src/users.ts`'s `MeProfile` gained `mfaEnabled`.
  - `packages/api-client/src/resources/auth.ts` — `login` now types its response as `LoginResult`; new `mfaVerify` (public, `skipAuthRetry`) and `mfaEnrollBegin`/`mfaEnrollConfirm`/`mfaDisable`/`mfaRegenerateRecoveryCodes` (authenticated, normal refresh-on-401 behavior).
  - `apps/web/src/services/auth-client.ts` — `login()` passes an `mfaRequired` result straight through rather than treating it as an error; new `verifyMfa`/`mfaEnrollBegin`/`mfaEnrollConfirm`/`mfaDisable`/`mfaRegenerateRecoveryCodes`.
  - `AuthProvider.tsx`/`types/auth.ts` — `login()`'s return type extended (additively) with an `mfaRequired` case; new `verifyMfa` context method.
  - `apps/web/[lang]/login/page.tsx` — a second step: on `mfaRequired`, switches to a code-entry form (accepts either a TOTP code or a recovery code — the server tries both, so no separate UI mode is needed) calling `verifyMfa`.
  - `apps/web/[lang]/settings/page.tsx` — a new `MfaSection` component: shows current status, an enroll flow (QR code via `qrcode.react` + manual-entry secret + confirm-code form + one-time recovery-code display with an explicit "I've saved these" acknowledgment before returning to normal view), a disable flow (password-confirmed), and a regenerate-recovery-codes action.
  - New `apps/web/src/hooks/useMfa.ts` — thin `useMutation` wrappers, mirroring `useChangePassword.ts`'s existing shape.

## Verification Performed

- **Unit tests:** 35 new tests across `mfa-crypto.service.spec.ts` (real AES-256-GCM round-trip, random-IV-per-encryption confirmed, tamper detection via GCM auth tag, fail-closed on missing key), `mfa.service.spec.ts` (real TOTP generate/verify via `otplib` directly — no mocks — secret format, URI format, wrong/malformed code rejection, cross-secret rejection, recovery-code format/uniqueness/hash-determinism), `auth.service.spec.ts` (extended — login with/without MFA, full `verifyMfaChallenge` matrix including recovery-code fallback and reuse rejection, enrollment begin/confirm success and failure paths, disable with correct/incorrect password, recovery-code regeneration), and a new `users.service.spec.ts` (didn't exist before this phase — added narrowly for the MFA-related behavior this phase touched: `mfaSecret` stripped from `SafeUser`, `mfaEnabled` exposed in `getMeView`, `setMfaSecret`/`disableMfa` persist exactly the expected fields). **201/201 backend tests passing** (166 pre-existing + 35 new), confirmed via a fresh `npm test` run, not assumed from earlier in the session.
- **Type-checking:** `apps/api`, `apps/web`, and `apps/admin` all pass `tsc --noEmit` with zero errors.
- **Production builds:** both `apps/api` (`nest build`, after clearing the project's known stale-`tsconfig.tsbuildinfo` cache issue) and `apps/web` (`next build`) complete successfully — `/login` and `/settings` both build with the expected size increase from the new MFA UI.
- **Live, end-to-end verification (real backend, real database, zero mocks) — 15/15 checks passed:** a real test user (`isTestData: true`) created directly via Prisma; login without MFA returns real tokens; enrollment begin returns a real secret + `otpauth://` URI; confirm rejects a wrong code (`401`); confirm succeeds with a **real TOTP code generated via `otplib.authenticator.generate`** and returns exactly 10 recovery codes; `GET /users/me` shows `mfaEnabled: true` and never returns `mfaSecret`; a subsequent login now returns `mfaRequired` with a challenge token instead of real tokens; `/auth/mfa/verify` rejects a wrong code; succeeds with a real TOTP code (decrypted the actual DB-stored `mfaSecret` using the real `MFA_ENCRYPTION_KEY` to compute it, not a shortcut); the same challenge token cannot be replayed after a successful verify (single-use, confirmed); a valid recovery code logs the user in; that same recovery code is rejected on reuse; a different, still-unused recovery code still works; disabling MFA rejects an incorrect password; succeeds with the correct one; login afterward succeeds directly again with no challenge (confirms disable really disables it); all recovery codes are confirmed deleted from the database after disable. Test user and all associated rows cleaned up afterward.
- **Regression:** all 166 pre-existing backend tests still pass unmodified; the live verification's first check (login without MFA) directly confirms unaffected (non-enrolled) accounts behave identically to before this phase — zero behavior change for the default case.

## Security Review

- TOTP secret: encrypted at rest, never exposed via any API response (verified live), decrypted only transiently in-memory during verification.
- Recovery codes: hashed (SHA-256, correct choice for a high-entropy generated secret — same reasoning as `RefreshToken.tokenHash`), single-use (verified live — reuse rejected), regeneration invalidates all previous (verified live — old codes deleted before new ones are created).
- MFA challenge tokens carry no `sessionId` claim, so `JwtStrategy` (which requires one) rejects any attempt to use a challenge token as a real access token against a protected endpoint — no privilege leakage between the two token types, by construction, not by an added check.
- Every enroll/confirm/disable/regenerate endpoint scopes strictly to `@CurrentUser().sub` — no target-user-id parameter exists anywhere in these DTOs, so there is no IDOR surface.
- Disabling MFA requires password re-confirmation (matches the existing `ChangePasswordDto` pattern) — a hijacked-but-still-authenticated session alone cannot strip MFA protection.
- Every state change (`enabled`, `disabled`, `recovery_code_used`, `recovery_codes_regenerated`, `login.mfa_challenge_issued`, `login.mfa_failed`) is audit-logged, unconditionally, independent of the email-notification gap.
- **Two honestly-disclosed, not-fixed gaps** (see `docs/known-issues.md` for full detail): (1) MFA enrollment is opt-in for every role, not role-enforced as "mandatory" per §5's literal wording — a deliberate scope decision to preserve backward compatibility, not an oversight; (2) `/auth/mfa/verify` has no dedicated per-account lockout on repeated wrong codes, relying only on the endpoint's IP-based rate limit (judged adequate given a 6-digit TOTP code's 30-second validity window, but flagged as a future defense-in-depth hardening rather than silently claimed as equivalent to the password step's account-level lockout).

## Files Modified

**Schema:** `apps/api/prisma/schema.prisma`, new migration `apps/api/prisma/migrations/20260805075908_add_mfa_support/`.
**Config:** `apps/api/src/config/configuration.ts`, `apps/api/.env` (real key), `apps/api/.env.example` (documented, no secret).
**Backend (new):** `common/services/mfa-crypto.service.ts` (+ spec), `modules/auth/mfa.service.ts` (+ spec), `modules/auth/mfa-recovery-codes.repository.ts`, `modules/auth/dto/{mfa-verify,mfa-enroll-confirm,mfa-disable}.dto.ts`.
**Backend (modified):** `common/common.module.ts`, `modules/auth/auth.service.ts` (+ spec, extended), `modules/auth/auth.controller.ts`, `modules/auth/auth.module.ts`, `modules/auth/dto/login.dto.ts`, `modules/users/users.service.ts` (+ new spec).
**Dependencies:** `apps/api/package.json` (+`otplib@^12.0.1`), `apps/web/package.json` (+`qrcode.react`).
**Frontend:** `packages/types/src/{auth,users}.ts`, `packages/api-client/src/resources/auth.ts`, `apps/web/src/services/auth-client.ts`, `apps/web/src/providers/AuthProvider.tsx`, `apps/web/src/types/auth.ts`, `apps/web/src/app/[lang]/login/page.tsx`, `apps/web/src/app/[lang]/settings/page.tsx`, `apps/web/src/hooks/useMfa.ts` (new).
**Documentation:** `docs/project-status.md`, `docs/known-issues.md`, `docs/next-session.md`, `docs/documentation-index.md`, this restore point.

No file outside the above was modified. `docs/phase-14-plan.md` and every prior restore point/report are untouched, per `project-lifecycle`'s "never rewrite historical reports" rule.

## Remaining Limitations (new from this phase, plus unchanged carry-overs)

1. **MFA is opt-in for every role, not yet role-enforced as mandatory for admin-capable roles** (disclosed scope decision — see Security Review above). Next real decision point, not a code defect.
2. No email-delivery provider — blocks real MFA notification delivery (same pre-existing gap as email verification/password reset).
3. No dedicated per-account MFA-failure lockout (IP rate-limit only) — flagged, not fixed, judged adequate for now.
4. Carried over, unaffected by this phase: `apps/admin` vs. `apps/web` admin-route ambiguity, no CI/lint gate, Notifications delivery incomplete, Search unimplemented, Docker/WSL2 unusable in this environment, real B2 bucket-privacy/expiration-enforcement/performance unverified, no malware-scanning engine, the dual phase-numbering-system issue (still unresolved, still flagged).

## Safe Resume Point

Candidate B (Admin MFA) is closed. Per `docs/phase-14-plan.md`'s order, proceed to **Candidate F (CI pipeline + real lint gate)** next. Before or alongside it, decide the MFA role-enforcement rollout policy (see "Then decide" in `docs/next-session.md`) — a product decision, not a technical blocker.

## Restorability

**Recommended starting point:** `docs/documentation-index.md`, then `docs/project-status.md`'s Platform Implementation Status table, then `docs/phase-14-plan.md`.

**Guaranteed minimum fallback** — if only the following four files survive:

1. `docs/project-status.md` — current phase (14.2, complete), whole-platform status including MFA's real state, next candidate (CI/lint, per the approved order).
2. `docs/known-issues.md` — the MFA entry's full reasoning (why opt-in, not mandatory), plus every other real open gap.
3. `docs/next-session.md` — what to read first, the two real decision points to make next.
4. `docs/restore-point-phase14.2.md` (this file) — the authoritative snapshot of what was built, tested, and verified.
