# 10 — Security Bible

Status: Governing standard. Applies to every Phoenix service (`apps/web`, `apps/admin`, `apps/api`, `apps/workers`, future `apps/mobile`). Supersedes ad-hoc security decisions made in individual features — if a feature's implementation conflicts with this document, this document wins and the feature is corrected.

---

## 1. Security Philosophy

- **Defense in depth.** No single control is trusted to carry the whole burden — network, transport, application, and data layers each enforce security independently, so a failure in one layer doesn't mean a full breach.
- **Least privilege by default.** Every account, service, and API key starts with the minimum access it needs; access is granted explicitly, never assumed.
- **Never trust the client.** Every input — from the first-party web app included — is validated server-side. Client-side checks are UX, not security.
- **Security is not a phase.** It is enforced at design time (this document), build time (CI checks, dependency scanning), and runtime (monitoring, rate limiting) — not bolted on before launch.
- **Assume breach.** Systems are designed so that if one component is compromised, the blast radius is contained (service separation, scoped tokens, encrypted secrets) rather than assuming perimeter defenses will never fail.

---

## 2. Authentication Standards

- Authentication is centralized in `apps/api`'s Auth module — no other service independently verifies credentials.
- Supported methods: email + password, OAuth (Google, Apple), magic link. All three converge on the same internal identity record; a user is never represented by more than one account regardless of login method used.
- Every authentication attempt (success and failure) is logged with actor IP, user agent, and outcome (see §18).
- Account enumeration is prevented: login, registration, and password-reset endpoints return identical responses/timing whether or not an email exists in the system.
- Brute-force protection: progressive delays and temporary lockout after repeated failed attempts on a single account, combined with per-IP rate limiting (§11) so distributed attempts across many accounts are also caught.

---

## 3. Authorization Standards

- Authorization is enforced **server-side, on every request**, in `apps/api` — UI-level hiding of unavailable actions is a convenience, never a security boundary.
- RBAC model (roles → permissions → resource:action strings) as defined in `09-PLATFORM-ARCHITECTURE.md` §5. No endpoint ships without an explicit permission check; "no check" is never treated as "allow."
- Admin-capable roles require a distinct elevated session scope on top of normal authentication — holding a valid user session is not sufficient to reach admin endpoints.
- Object-level authorization is mandatory wherever a resource ID is client-supplied (e.g., `/courses/:id`) — the API verifies the requesting user is entitled to that specific resource, not just that they hold a role that can generally access the resource type. This closes IDOR (Insecure Direct Object Reference) gaps.

---

## 4. Password Policy

- Minimum 10 characters; no arbitrary maximum below 128; no forced periodic rotation (rotation policies are deprecated industry practice — they push users toward weaker, predictable passwords).
- Passwords are checked against a breached-password list (e.g., Have I Been Pwned range API) at registration and password-change time; a match is rejected regardless of complexity.
- Hashing: Argon2id, with per-install pepper stored in the secrets manager (§17) in addition to the standard per-password salt.
- No password is ever logged, cached, or transmitted in a password-reset email — reset flows issue a single-use, time-limited token instead.
- Password-reset tokens expire in 15 minutes, are single-use, and invalidate all other outstanding reset tokens for the account when one is used.

---

## 5. MFA Policy

- TOTP-based (RFC 6238), optional for the `learner` role, **mandatory** for `instructor`, `content_editor`, `moderator`, `support`, `admin`, and `superadmin`.
- Recovery codes (single-use, 10 generated at enrollment) are issued for account recovery if the TOTP device is lost; regenerating codes invalidates all previous codes.
- MFA enrollment and disablement are both logged as security-sensitive events (§18) and trigger a notification to the account's verified email.
- SMS-based MFA is not offered (SIM-swap risk); TOTP or platform passkeys only.

---

## 6. Session Management

- Sessions are represented by a short-lived JWT access token (15 minutes) plus a server-tracked refresh token — no long-lived session token is ever handed to a client.
- Refresh tokens are stored server-side hashed (never in plaintext), scoped to a single device/session record, and individually revocable — "log out this device" and "log out everywhere" are both supported without invalidating unrelated sessions.
- Idle session timeout: 30 days for `learner`, 12 hours for admin-capable roles, enforced by refresh-token expiry.
- Concurrent session limits are configurable per role; admin-capable roles are capped at a small number of concurrent sessions to reduce the value of a stolen token.
- Every successful login rotates the refresh token (rotation on use) — reuse of an already-rotated refresh token is treated as a signal of token theft and revokes the entire session family immediately.

---

## 7. JWT Strategy

- Access tokens: short-lived (15 min), signed with an asymmetric algorithm (RS256/EdDSA) so `apps/api` holds the private signing key and every other service (including edge functions) can verify tokens with the public key alone, without needing the ability to mint tokens.
- Claims kept minimal: subject (user ID), role scope, session ID, issued-at, expiry. No PII beyond what's operationally necessary is embedded in the token payload — tokens are not encrypted, only signed, so anything in them is effectively public to anyone holding the token.
- Token validation on every request checks signature, expiry, and that the session ID has not been revoked (fast Redis lookup) — a signed-but-revoked token is still rejected.
- Key rotation: signing keys are rotated on a schedule (quarterly) and immediately on suspected compromise; both current and previous public keys are honored for verification during a rotation window so in-flight tokens aren't invalidated mid-rotation.

---

## 8. Refresh Token Strategy

- Opaque, high-entropy random tokens (not JWTs) — refresh tokens carry no decodable payload, so their only value is as a lookup key against the server-side session record.
- One-time use with rotation: each use issues a new refresh token and invalidates the old one; reuse detection (§6) treats replay of an old token as compromise.
- Bound to device/session metadata (user agent, approximate IP range) at issuance — a refresh request from a starkly different context flags the session for step-up verification.
- Stored client-side as an httpOnly, Secure, SameSite=Strict cookie for web; secure platform keystore (Keychain/Keystore) for the future mobile app — never in `localStorage`, which is readable by any script on the page (§10).

---

## 9. CSRF Protection

- Because auth tokens live in httpOnly cookies for the web app, all state-changing requests (`POST`/`PUT`/`PATCH`/`DELETE`) require a CSRF token (double-submit cookie pattern or a synchronizer token) validated server-side, in addition to the SameSite cookie attribute.
- `SameSite=Strict` (or `Lax` where a cross-site GET-triggered flow like OAuth redirect requires it) is set on all auth-related cookies as a first line of defense, with the CSRF token as defense-in-depth rather than the sole control.
- Webhook endpoints (Stripe, OAuth callbacks) are exempt from CSRF token checks by necessity but are instead verified via provider-signed payload signatures (§13).

---

## 10. XSS Protection

- React's default output escaping is relied on as the baseline; `dangerouslySetInnerHTML` is prohibited platform-wide except for two explicitly reviewed cases: rendering author-authenticated rich-text content that has passed a server-side sanitizer (allowlist-based, e.g., DOMPurify with a strict tag/attribute allowlist), and static, build-time-known JSON (e.g., structured data) with no user input interpolated.
- Strict Content-Security-Policy (CSP) is enforced at the edge on every response: no `unsafe-inline` scripts, nonce-based script allowance only, no `unsafe-eval`. This provides a second layer of protection even if an escaping bug slips through code review.
- User-generated content (reviews, comments, course discussion) is always rendered as plain text or through the sanitized rich-text pipeline — never trusted as raw HTML.
- All cookies carry `HttpOnly` where they don't need JS access (auth/session cookies), removing them from the attack surface of any XSS that does occur.

---

## 11. SQL Injection Protection

- All database access goes through Prisma's parameterized query interface — raw SQL string concatenation with user input is prohibited platform-wide.
- The rare cases requiring raw SQL (complex reporting queries) use Prisma's tagged-template raw query API, which parameterizes inputs automatically, never manual string interpolation.
- Database roles used by the application are scoped to only the schemas/tables they need (§ see `11-DATABASE-BIBLE.md` §3) and never hold `DROP`/`ALTER` privileges at runtime — even a successful injection is constrained by what the connected role is permitted to do.
- Static analysis (CI lint rule) flags any raw SQL template that isn't using the parameterized tag, blocking merge.

---

## 12. Rate Limiting

- Enforced at the API gateway layer, before requests reach application code, using a sliding-window algorithm backed by Redis.
- Tiers: per-IP (protects against anonymous abuse), per-account (protects against a compromised or malicious authenticated user), per-endpoint-class (auth endpoints, AI Gateway endpoints, and search each have distinct, tighter limits than general read traffic).
- Auth endpoints (login, password reset, MFA verification) have the strictest limits and add progressive backoff (§2) on top of the hard rate limit.
- AI Gateway calls (`12-AI-INTEGRATION-BIBLE.md` §9) are additionally metered against per-user plan quotas, distinct from the general abuse-prevention rate limits.
- Rate-limit responses use standard `429` status with `Retry-After` headers; limits are never silently absorbed or degraded without signaling the client.

---

## 13. API Protection

- All endpoints require TLS; plaintext HTTP is not served in any environment including local development parity checks in CI.
- Every request body is validated against a strict zod schema before any business logic executes — unknown fields are rejected, not silently ignored, to prevent mass-assignment-style vulnerabilities.
- Webhooks (Stripe, OAuth providers) are verified via the provider's signature scheme before the payload is trusted; unsigned or invalidly signed webhook calls are rejected and logged as a potential attack.
- Internal service-to-service calls (`apps/api` ↔ `apps/workers`) use mutual authentication (service tokens or mTLS within the private network) — internal endpoints are never reachable from the public internet.
- API responses never leak internal implementation details (stack traces, ORM error messages, file paths) — error responses are sanitized to a generic message plus an internal correlation ID for support/debugging.

---

## 14. File Upload Security

- All uploads go through presigned-URL direct-to-storage flow (`09-PLATFORM-ARCHITECTURE.md` §9) — the application server never buffers untrusted file content in memory.
- File type is validated by content inspection (magic-byte sniffing), not by trusting the client-supplied extension or MIME type.
- Size limits are enforced both at the storage-policy level (presigned URL constraints) and application level, tiered per role and content type.
- Uploaded files are stored in private buckets, never directly executable or servable from the same origin as the application — served through a CDN with a distinct domain to prevent any theoretical stored-content-as-script attack.
- Filenames are never trusted as storage paths; a generated, opaque object key is used, with the original filename retained only as metadata for user-facing display.

---

## 15. Malware Scanning

- Every uploaded file is scanned asynchronously by an antivirus/malware engine (ClamAV or a hosted equivalent) before it is marked available for download by other users.
- Files pending scan are held in a quarantine state, inaccessible to anyone other than the uploader (who is informed the file is processing).
- A positive scan result immediately quarantines the file permanently, notifies the security/admin team, and flags the uploading account for review.
- Scanning coverage includes not just directly uploaded files but also files fetched by the platform on a user's behalf (e.g., an avatar imported from a URL).

---

## 16. Encryption Standards

- **In transit:** TLS 1.2+ everywhere (1.3 preferred), including internal service-to-service traffic within the private network — internal does not mean unencrypted.
- **At rest:** full-disk/volume encryption on all managed database and storage services (enabled at the provider level as a baseline), plus application-level column encryption for specifically sensitive fields (government ID numbers, phone numbers where collected) using envelope encryption — a data-encryption key per record, itself encrypted by a master key held in the secrets/KMS layer.
- **Backups:** encrypted at rest with the same standard as primary storage; encryption keys for backups are managed separately from application secrets so a single compromised credential can't unlock both live data and backup archives.
- Encryption keys are never stored alongside the data they protect, and key access is itself logged and access-controlled.

---

## 17. Secrets Management

- No secret (API key, database credential, signing key) is ever committed to version control, including in `.env` files — `.env.example` files document required keys with placeholder values only.
- All secrets are stored in a dedicated secrets manager (AWS Secrets Manager, Doppler, or equivalent) and injected into the runtime environment at deploy time.
- Secrets are scoped per-environment (local/staging/production never share a secret) and per-service (a worker doesn't hold credentials it doesn't need).
- Rotation: database credentials and signing keys are rotated on a fixed schedule (quarterly minimum) and immediately upon suspected exposure (e.g., a secret accidentally logged or pushed to a public repo, however briefly).
- Access to the secrets manager itself is audited and restricted to CI/CD service identities and a small number of senior engineers — not the general engineering team.

---

## 18. Logging & Audit

- Security-relevant events are logged distinctly from general application logs, in an append-only store with restricted access: authentication attempts (success/failure), MFA enrollment/disablement, password changes, role/permission changes, admin actions (ban, refund, content takedown), and any rate-limit or WAF trigger.
- Audit log entries capture: actor (user/service ID), action, target resource, timestamp, source IP, and — for data-mutating admin actions — a before/after diff.
- Audit logs are immutable from the application's perspective (no update/delete capability exposed to any role, including `superadmin`, through normal application paths) and retained per the schedule in `11-DATABASE-BIBLE.md` §15.
- Logs never contain raw passwords, full payment card numbers, unmasked tokens, or full session/refresh tokens — sensitive values are redacted or truncated before persistence.

---

## 19. Incident Response

- A documented, versioned incident response runbook exists outside this document (operational, not architectural) but this Bible defines the minimum required stages: **Detect** (monitoring/alerting, §19 of `09-PLATFORM-ARCHITECTURE.md`) → **Contain** (revoke affected credentials/sessions, isolate affected service) → **Eradicate** (patch the root cause) → **Recover** (restore normal service, verified via monitoring) → **Post-mortem** (blameless written report, required for any incident affecting user data or availability beyond a defined threshold).
- A designated on-call rotation owns initial triage for security alerts around the clock once the platform is in production.
- Any incident involving actual or suspected user data exposure triggers the data-breach notification process aligned with applicable regulations (GDPR 72-hour notification and equivalent regional requirements) — legal/compliance is looped in immediately, not after technical resolution.
- Credentials and tokens suspected of compromise are rotated/revoked as a Contain-phase action, before root cause is fully understood — containment is never delayed waiting for full diagnosis.

---

## 20. Backup Security

- Backups are encrypted at rest (§16) with keys managed independently from production data-encryption keys.
- Backup storage is access-controlled separately from production data access — an attacker who compromises production application credentials does not automatically gain access to backup archives.
- Backup integrity is verified as part of the restore-drill process (`09-PLATFORM-ARCHITECTURE.md` §20) — a backup is not considered valid until a successful restore has been demonstrated against it.
- Backups containing user data are covered by the same retention and deletion policy as live data — a user's "delete my data" request is honored in backup rotation timelines, not just the live database, as backups age out per the retention schedule.

---

## 21. Disaster Recovery

- Recovery Point Objective (RPO): 5 minutes for the primary database (via continuous WAL archiving), 24 hours for object storage (via replication lag tolerance).
- Recovery Time Objective (RTO): under 1 hour for full service restoration from a regional outage, under 15 minutes for a single-service failure given the multi-service architecture allows independent recovery.
- Cross-region replication is maintained for the primary database and for object storage buckets holding paid/critical content, so a full-region outage does not equal full data loss.
- DR failover procedures are tested on a defined schedule (semi-annual minimum), not left as an untested document — a DR plan that has never been exercised is assumed non-functional until proven otherwise.

---

## 22. OWASP Top 10 Compliance

| Risk | Mitigation (this document reference) |
|---|---|
| A01 Broken Access Control | §3 Authorization Standards, object-level checks |
| A02 Cryptographic Failures | §16 Encryption Standards |
| A03 Injection | §11 SQL Injection Protection, §13 input validation |
| A04 Insecure Design | §1 Security Philosophy, threat modeling at design time |
| A05 Security Misconfiguration | §13 API Protection, CI-enforced config checks |
| A06 Vulnerable & Outdated Components | Automated dependency scanning in CI (`09-PLATFORM-ARCHITECTURE.md` §18) |
| A07 Identification & Authentication Failures | §2 Authentication Standards, §4 Password Policy, §5 MFA |
| A08 Software & Data Integrity Failures | Signed deploy artifacts, verified webhook signatures (§13) |
| A09 Security Logging & Monitoring Failures | §18 Logging & Audit, §19 Incident Response |
| A10 Server-Side Request Forgery | Outbound requests from the API restricted to an allowlist of known destinations; no user-suppliable URL is fetched server-side without validation |

---

## 23. Security Checklist

Applied to every new feature before it ships:

- [ ] All inputs validated server-side with a zod schema
- [ ] Authorization check present and tested for every new endpoint (role-level and object-level)
- [ ] No secrets or credentials introduced into source control
- [ ] No raw SQL string concatenation introduced
- [ ] No new `dangerouslySetInnerHTML` without sanitization review
- [ ] Rate limiting applied to any new public-facing endpoint
- [ ] Sensitive actions (data export, account deletion, role change) logged to the audit trail
- [ ] File upload paths (if any) go through the presigned-URL + scanning pipeline
- [ ] New third-party dependency reviewed for known vulnerabilities before merge
- [ ] Error responses reviewed to confirm no internal detail leakage
