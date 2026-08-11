# Phoenix Platform — Launch Preparation (Pre-Deployment)

**Date:** 2026-08-06 · **Mode:** Read-only. No source code modified, no files deleted, no features added, no refactoring, no architecture changes, no credentials or accounts invented. Everything below is either directly verified against the repository this session (`.env.example` files, `.gitignore`, root directory listing, `apps/workers/package.json`, grep for cron/OAuth code) or carried forward from this project's own prior, verified findings (Phases 15–20) — nothing is guessed. Where a value or state genuinely could not be verified without owner-held credentials, it is marked so explicitly rather than assumed.

> **Naming note (flagged, not silently resolved):** this document's brief calls itself "Phase 21," but the main Phoenix repository's `docs/phase21-v1.1-roadmap.md` (a different, already-completed report — the v1.1 strategic/architecture planning pass) was produced immediately prior under the same number. To avoid overwriting that work, this report's restore point is filed as **`../05-Restore-Points/restore-point-phase21-launch-prep.md`**, not `../05-Restore-Points/restore-point-phase21.md` (which remains the v1.1-roadmap restore point). Treat this document as a sibling deliverable to `phase21-v1.1-roadmap.md`, not a replacement — the two cover different territory (forward architecture strategy vs. this document's pre-deployment operational checklist) and both remain current.

---

## 1. Repository Health Audit

**Cleanup list only — nothing below has been deleted or modified.**

| Item | Path | Type | Recommendation | Notes |
|---|---|---|---|---|
| Legacy scaffold archive | `Phoenix_v0.1.0.zip` (87.7 MB, root) | Deployment artifact / stray file | **Remove** (with owner confirmation) | Not referenced by any build, script, or doc; a leftover from before this project's rename to Phoenix. Large enough to matter for repo clone time. |
| Screenshot dumps | `shots/`, `shots2/` (root) | Generated artifact | **Remove or relocate under the main repository's `docs/visual-review/`** | Working output from this session's live-verification screenshot passes (Phases 14.6B onward). Real, not corrupted — but two differently-named dumps at the root suggests at least one is a duplicate or an intermediate pass. Confirm which (if either) is still referenced by the main repository's `docs/visual-review/index.html` before deleting either. |
| Stale preview cache | `.preview/` (root) | Build/tool cache | **Remove** | Not `.gitignore`d, not referenced by any script found in this audit. Confirm it isn't a live tool cache still in use before deleting. |
| Stale Vercel CLI link | `.vercel/` (root) | Deployment artifact | **Remove** | Contains only `README.txt` + `project.json` (a local Vercel CLI project link, not secrets — already correctly `.gitignore`d). Predates the Phase 19 deletion of the stale `apps/web/vercel.json`; this is the CLI's own local linkage file, a separate leftover from the same pre-Phoenix scaffold era. Safe to delete; will be recreated automatically if `vercel link` is ever run again. |
| Build output directories | `apps/admin/.next`, `apps/api/dist`, `apps/web/.next` | Build artifact | **No action — already `.gitignore`d, expected to exist locally** | Confirmed covered by the root `.gitignore` (`.next`, `dist` patterns). Not a repository-health issue; listed here only for completeness of the audit. |
| Root `.env` | `.env` (root) | Secret-bearing local file | **No action — already `.gitignore`d** (verified via `.gitignore`'s `.env.*` + `!.env.example` pattern, the Phase 18 fix) | Confirmed not tracked. Flagged here only so the owner is aware a real root-level `.env` exists locally and must never be committed or copied into a shared location. |
| Stale documentation | none found | — | — | The 4 standing tracking docs (`project-status.md`, `known-issues.md`, `next-session.md`, `documentation-index.md`) have been updated at the close of every phase through Phase 21 (v1.1 roadmap) per `documentation-policy.md` — no evidence of drift. the main repository's `docs/archive/` is correctly excluded from "current" status by its own directory name and by explicit instruction in `next-session.md`. |
| Dead frontend route tree | ~14 components under non-`[lang]` `apps/web` routes (confirmed real in Phase 15, reconfirmed not touched since) | Legacy code | **Remove, as its own scoped cleanup — not part of this read-only phase** | Confirmed dead except for `checkout/success` and `checkout/cancel`, which are real, live Stripe redirect targets (do not delete those two). |
| 4 missing spec files | `categories`, `lessons`, `notifications`, `permissions` service specs | Test coverage gap, not a repo-hygiene issue | Tracked in `known-issues.md`, not a cleanup item | Listed here for completeness only — this is a testing gap, not stray files. |

**Repository structure:** standard npm-workspaces + Turborepo layout (`apps/{admin,api,web,workers}`, `packages/{api-client,config,i18n,types,ui,validation}`, `infra/`, `design/`, `docs/`) — confirmed consistent with the main repository's `docs/09-PLATFORM-ARCHITECTURE.md`, no undocumented top-level directories found beyond the stray artifacts listed above.

---

## 2. Environment Checklist

Verified against the main Phoenix repository's `apps/api/.env.example`, the main Phoenix repository's `apps/web/.env.example`, the main Phoenix repository's `apps/api/src/config/configuration.ts` (Phase 16), `apps/api/src/health/health.controller.ts` (Phase 16), and this project's own prior direct findings.

| Service | Status | Production Required? | Notes |
|---|---|---|---|
| **Frontend** (`apps/web`) | Configured (code) / **Missing (deployment)** | **Required** | Builds clean, 60 routes verified (Phase 18/19). Needs `NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_API_URL` set to real production values and a hosting target — neither exists yet (owner decision, Phase 17/19). |
| **Backend** (`apps/api`) | Configured (code) / **Missing (deployment)** | **Required** | 209/209 tests passing, builds clean. Needs a real hosting target and every secret below. |
| **Database** (Postgres/Neon) | Configured (schema + migrations) / **Missing (production instance)** | **Required** | 52 models, 21 clean migrations, dev instance verified live (Phase 16). No separate production database has been provisioned — using the dev instance for production traffic would be a real data-integrity risk; a distinct production Neon project is required. |
| **Storage** (Backblaze B2 / S3-compatible) | Configured (code, live-verified against B2, Phase 13.7) / **Missing (production bucket)** | **Required** | Code is provider-agnostic (any S3-compatible endpoint works). The bucket exercised in prior phases should be treated as dev/staging — a distinct production bucket with its own access keys is required. |
| **Email** (Postmark) | Configured (code, `EmailService`, Phase 16) / **Missing (credentials)** | **Required** | Safe-degrading: unconfigured `POSTMARK_API_KEY` makes every send log-and-return-`false` rather than throw — auth flows work today with zero real delivery. Real credentials are a hard launch requirement (verification/password-reset/MFA emails must actually arrive). |
| **OAuth** | **Not implemented** | Optional | No identity-linking table exists in the schema; no OAuth provider code found (running `grep -ril oauth apps/api/src packages` in the main Phoenix repository returned no matches this session). Not a v1.0 feature — flagged as Future in the main Phoenix repository's `docs/phase21-v1.1-roadmap.md` Section 2, not a launch blocker. |
| **AI Gateway** | Configured (code) / **Missing (credentials)** | Optional for launch (AI is a real feature but not on the critical auth/payment/enrollment path) | `AI_PROVIDER_OPENAI_API_KEY` / `AI_PROVIDER_ANTHROPIC_API_KEY` both blank in `.env.example`. Without at least one, the AI module's real endpoints will fail at call time — acceptable to launch without if AI is explicitly descoped from launch-day scope, but should be a deliberate decision, not an oversight. |
| **Payments** (Stripe) | Configured (code, live-tested incl. concurrent-refund handling) / **Missing (production keys + webhook)** | **Required** (this is a marketplace platform — payments are core, not optional) | `STRIPE_SECRET_KEY` must be a **live** key, not the test key used throughout development; `STRIPE_WEBHOOK_SECRET` must match a webhook endpoint registered against the real production URL — this registration cannot happen until the backend has a real, stable public URL, which is why it comes late in the deployment order (Section 4). |
| **Media** (upload/processing) | Configured (upload/storage chain, live-verified) / Partial | Required for upload to work; transcoding is **not implemented** (disclosed, the main Phoenix repository's `docs/phase21-v1.1-roadmap.md` Section 1) | Raw file upload/storage/serving works end-to-end. No video transcoding pipeline exists — acceptable for launch (raw playback works), a known v1.1 item, not a blocker. |
| **Workers** (`apps/workers`) | **Not implemented — empty shell** | Optional for launch, but see Notifications below | Confirmed via `apps/workers/package.json`: `dev` script literally prints "apps/workers has no job processors yet." No async job infrastructure exists. Notification delivery (email fan-out beyond the synchronous auth-flow sends) depends on this — launch is possible without it, but users will get zero email beyond auth events until it's built. |
| **Cron** | **Not implemented** | Optional | No cron/scheduled-job code found (running `grep -ril cron apps/api/src apps/workers/src` in the main Phoenix repository returned no matches). No current feature depends on a scheduled job — not a launch blocker. |
| **Analytics** | Configured, limited scope (confirmed, disclosed) | Optional | The admin analytics overview (MAU/DAU/completion/revenue) is real and works; no external analytics/telemetry service (e.g., PostHog, GA) is wired in. Not a launch blocker; a genuine post-launch decision. |
| **Monitoring** | **Not implemented** | **Strongly recommended, not strictly blocking** | Only a passive `/health` endpoint exists (`GET /api/v1/health`, `@Public()`, reports `{database, redis, storage, stripe, email}` booleans, Phase 16). No APM, no crash reporting (Sentry or equivalent), no uptime monitor configured anywhere. This is the single largest operational blind spot going into launch — see Section 6. |
| **Logging** | Configured, basic | Sufficient for launch, not ideal long-term | NestJS's built-in logger is in use; no structured/centralized log aggregation. Acceptable to launch with, should not remain the permanent state (see the main Phoenix repository's `docs/phase21-v1.1-roadmap.md` Section 4). |
| **Secrets** (JWT keypair, password pepper, MFA key) | Configured (mechanism) / **Missing (real production values)** | **Required** | `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`/`PASSWORD_PEPPER`/`MFA_ENCRYPTION_KEY` must all be freshly generated for production — **deliberately not generated in this session** (a security-hygiene decision carried from Phase 19: real production secrets should never be generated or displayed inside an AI session transcript). Exact generation commands are in the main Phoenix repository's `apps/api/.env.example` for the owner to run directly. |

---

## 3. Production Secrets Checklist

**No real values appear below or anywhere in this session — every "Example" column shows format only.**

| Name | Description | Required? | Where it comes from | Example (format only, never real) |
|---|---|---|---|---|
| `DATABASE_URL` | Production Postgres connection string | **Required** | Neon (or chosen provider) dashboard, new production project | `postgresql://user:pass@host/db?sslmode=require&channel_binding=require` |
| `UPSTASH_REDIS_REST_URL` | Redis REST endpoint | **Required** | Upstash dashboard, new production database | `https://<region>.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Redis REST auth token | **Required** | Upstash dashboard | `AbCd1234...` (opaque token) |
| `JWT_PRIVATE_KEY` | RS256 private key, PEM | **Required** | Generated by the owner directly (`openssl genrsa -out private.pem 2048`) — never in this session | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----` |
| `JWT_PUBLIC_KEY` | RS256 public key, PEM | **Required** | Derived from the same `openssl` step | `-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----` |
| `JWT_ACCESS_TOKEN_TTL` | Access token lifetime | Required (has a safe default: `15m`) | Config decision, not a secret | `15m` |
| `JWT_ISSUER` | JWT `iss` claim | Required (has a safe default) | Config decision, not a secret | `phoenix-platform` |
| `PASSWORD_PEPPER` | Server-side pepper, appended before Argon2id hashing | **Required** | Generated by the owner (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`) | `base64-encoded 32 random bytes` |
| `MFA_ENCRYPTION_KEY` | AES-256-GCM key encrypting stored TOTP secrets | **Required** | Same generation command as `PASSWORD_PEPPER` — **rotating this later invalidates every enrolled user's MFA and forces re-enrollment**, treat as immutable once set | `base64-encoded 32 random bytes` |
| `STORAGE_ENDPOINT` | S3-compatible endpoint URL | **Required** | Backblaze B2 (or chosen provider) production bucket dashboard | `https://s3.<region>.backblazeb2.com` |
| `STORAGE_BUCKET` | Production bucket name | **Required** | Same dashboard | `phoenix-prod-media` |
| `STORAGE_ACCESS_KEY_ID` | B2 application key ID | **Required** | Same dashboard | `0055abc...` |
| `STORAGE_SECRET_ACCESS_KEY` | B2 application key secret | **Required** | Same dashboard, shown once at creation | `K005...` |
| `STORAGE_REGION` | Provider region code | **Required** | Same dashboard | `us-east-005` |
| `STRIPE_SECRET_KEY` | **Live** Stripe secret key | **Required** | Stripe dashboard, Live mode (not Test mode — the key used throughout development is a test key) | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the production webhook endpoint | **Required** | Stripe dashboard, created *after* the backend has a real public URL (see Section 4 ordering) | `whsec_...` |
| `POSTMARK_API_KEY` | Postmark server token | **Required** | Postmark dashboard, "API Tokens" tab, production server | `pm-server-token-uuid-format` |
| `EMAIL_FROM_ADDRESS` | Verified sending address | **Required** | Must be a domain verified in Postmark (DNS records) | `no-reply@yourdomain.tld` |
| `EMAIL_FROM_NAME` | Sending display name | Required (has a default: `Phoenix Project`) | Config decision, not a secret | `Phoenix` |
| `AI_PROVIDER_OPENAI_API_KEY` | OpenAI API key | Optional (only if AI is in launch scope) | OpenAI dashboard | `sk-...` |
| `AI_PROVIDER_ANTHROPIC_API_KEY` | Anthropic API key | Optional (only if AI is in launch scope) | Anthropic Console | `sk-ant-...` |
| `MEILISEARCH_HOST` / `MEILISEARCH_API_KEY` | Search backend | Optional — Search is not implemented in the application layer yet (see the main Phoenix repository's `docs/phase21-v1.1-roadmap.md`) | N/A until the Search module is built | N/A |
| `NEXT_PUBLIC_SITE_URL` | Public frontend URL | **Required** | The chosen domain, once DNS is live | `https://yourdomain.tld` |
| `NEXT_PUBLIC_API_URL` | Public backend URL | **Required** | The chosen backend hosting URL | `https://api.yourdomain.tld` |
| `PORT` | Backend listen port | Required (has a default: `4000`) | Config decision; most PaaS providers override this automatically | `4000` |

**None of the above have been generated, requested, or displayed with real values in this session, in keeping with the explicit constraint against inventing production credentials.**

---

## 4. Deployment Order

1. **Database** — provision the production Postgres instance; run `prisma migrate deploy` (never `db push`) against it; verify with a direct `SELECT 1`.
2. **Storage** — provision the production bucket; verify a real object can be written and read back before anything depends on it.
3. **Email** — verify the sending domain in Postmark (DNS records), confirm `POSTMARK_API_KEY` works with a real test send.
4. **Secrets** — generate `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`/`PASSWORD_PEPPER`/`MFA_ENCRYPTION_KEY` directly in the owner's own secure environment (never in an AI session).
5. **Backend** — deploy `apps/api` with all secrets from steps 1–4 wired in; confirm it boots and `GET /api/v1/health` reports every service `true` except any deliberately deferred one (e.g., AI, if descoped).
6. **Payments webhook** — only now register the Stripe production webhook against the backend's real, live URL (step 5 must exist first) and capture `STRIPE_WEBHOOK_SECRET`; redeploy the backend with it set.
7. **Workers** — if the Notifications-delivery worker (the main Phoenix repository's `docs/phase21-v1.1-roadmap.md` Section 2, Critical) has been built before launch, deploy it here; if not, launch proceeds without it (a disclosed, non-blocking gap, not a hard dependency).
8. **Frontend** — deploy `apps/web` pointed at the real backend URL from step 5.
9. **DNS** — point the production domain at the frontend (and a subdomain at the backend, if using one); wait for propagation before proceeding.
10. **Monitoring** — wire Sentry (or equivalent) and an uptime check against the now-live URLs *before* declaring launch complete, not after.
11. **Smoke Test** — run the full checklist in Section 5 against the real, live, DNS-resolved production URLs.
12. **Rollback Snapshot** — take a fresh database backup/snapshot and record the exact deployed commit SHA for both apps *immediately after* a successful smoke test — this is the point-in-time to roll back to if a problem surfaces in the following hours.

---

## 5. Smoke Test Plan

Run against the real, live production URLs — not localhost, not staging — after DNS has propagated.

**Authentication**
- [ ] Register a new real (or clearly-marked test) account; confirm the verification email actually arrives.
- [ ] Log in with the registered account.
- [ ] Log out; confirm the session is actually invalidated (protected route redirects to login).
- [ ] Trigger "forgot password"; confirm the reset email arrives and the reset flow works end-to-end.
- [ ] Enroll in MFA on one account; confirm a real TOTP code is required on next login.

**Courses**
- [ ] Load the course catalog; confirm real data renders (not a loading/error state).
- [ ] Open a course detail page.
- [ ] (Instructor) create or edit a course; confirm it saves and reflects immediately.

**Orders / Payments**
- [ ] Complete one real end-to-end checkout with a real (or Stripe test-mode-equivalent, if launch uses live keys carefully) payment method.
- [ ] Confirm the order appears in the account's order history.
- [ ] Confirm the Stripe webhook actually fired and updated order status (check Stripe dashboard's webhook delivery log, not just app state).
- [ ] (Admin) issue one real refund; confirm it reflects in both Stripe and the app.

**Notifications**
- [ ] Confirm in-app notifications appear for at least one real event (e.g., order confirmation).
- [ ] Explicitly confirm/record whether email notifications beyond auth events are expected to work — they will not, unless the Workers/Notifications item was built before launch (Section 2).

**Media Upload**
- [ ] Upload a real file (image or document) as an authenticated user; confirm it appears in storage and is retrievable via its signed URL.
- [ ] Confirm a presigned URL actually expires per its configured TTL (spot-check, not required every launch).

**Certificates**
- [ ] Complete a course to the point of certificate issuance (or use an existing completed enrollment); confirm a certificate record is created. **Known limitation, carry into the smoke test:** no real PDF is generated (`pdfFileId` is always `null`) — do not treat a missing PDF as a smoke-test failure, it's a disclosed v1.0 gap.

**Admin**
- [ ] Log in as an admin-capable account; load the admin dashboard, users list, and audit log — confirm all three show real data.
- [ ] Perform one real, reversible admin action (e.g., view a user's detail page) to confirm the admin surface is live, not just rendering.

**Moderator**
- [ ] Log in as a moderator-capable account; confirm the moderation queue loads and, if any real content exists, that an approve/reject action works.

**Instructor**
- [ ] Log in as an instructor-capable account; confirm the instructor dashboard and course-editor both load with real data.

**AI**
- [ ] If AI is in launch scope: make one real AI Gateway request; confirm a real response returns (not a silent failure from a missing API key).
- [ ] If AI is deliberately descoped from launch: confirm the AI-dependent UI fails gracefully (a clear error/empty state, not a crash) rather than skipping this check.

**Security**
- [ ] Confirm HTTPS is enforced (HTTP requests redirect, not silently served).
- [ ] Confirm the security headers (CSP/HSTS/etc., built Phase 16) are present on a live response — re-run the same header check used in Phase 16/18, now against the real production domain, not localhost.
- [ ] Confirm an unauthenticated request to a protected endpoint is rejected (401), and a wrong-role request to an admin endpoint is rejected (403).

**Rate Limiting**
- [ ] Confirm the login endpoint's rate limit actually triggers under real repeated failed attempts, and that it resets after the configured window — do not skip this only because it was verified pre-launch; the production Redis instance is a different instance than dev and its behavior should be confirmed live.

**Health Checks**
- [ ] `GET /api/v1/health` returns `database: true`, `storage: true`, `email: true` (or a deliberately-scoped `false` for anything intentionally deferred), `stripe: true`.
- [ ] Confirm the uptime monitor (Section 6) is actually watching this endpoint, not just that the endpoint itself works.

---

## 6. Production Monitoring Plan

*Recommendation only — nothing below has been implemented or configured in this session.*

| Area | Recommendation |
|---|---|
| **Logs** | Structured JSON logging from `apps/api`, shipped to a log aggregation service (the hosting provider's built-in log viewer is an acceptable minimum for launch day; a dedicated service like Better Stack/Datadog is a reasonable near-term upgrade). |
| **Metrics** | Request rate, error rate, and p50/p95/p99 latency per route at minimum — most APM tools (Sentry Performance, Datadog APM) provide this with a single SDK addition. |
| **Alerts** | At minimum: error-rate spike, `/api/v1/health` reporting any `false`, and 5xx-response-rate threshold. Route to a channel someone actually watches (email/Slack/PagerDuty — owner's choice). |
| **Uptime** | An external uptime monitor (UptimeRobot, Better Stack, Pingdom, or the hosting provider's own) polling both the frontend and `GET /api/v1/health` on an independent schedule from the app itself. |
| **Error tracking** | Sentry (or equivalent) on both `apps/api` and `apps/web` — this is the single highest-value, lowest-cost monitoring addition available and should be treated as close to required as anything in this "recommended" section gets. |
| **Performance** | Frontend Core Web Vitals (via the hosting provider's built-in analytics, e.g. Vercel Analytics, or a dedicated RUM tool) — lower priority than error tracking for launch day, real value grows with real traffic. |
| **Backups** | Confirm the chosen database provider's automatic backup/PITR (point-in-time recovery) is actually enabled on the production instance — Neon supports this natively; verify the retention window matches the owner's risk tolerance, don't assume the default is sufficient. |
| **Database health** | Connection-pool utilization and query latency — most managed Postgres providers surface this natively in their dashboard; no custom tooling needed at launch scale. |
| **Worker health** | Not yet applicable — no worker process exists. Once the Notifications-delivery worker (Section 2, Critical in the v1.1 roadmap) is built, its job queue depth and failure rate become a real monitoring target; not before. |

---

## 7. Disaster Recovery Plan

*Documentation only — these are the documented steps to take if each scenario occurs; none has been rehearsed live against real production infrastructure in this session, since no production infrastructure exists yet.*

- **General recovery steps:** identify the failing component via the monitoring/alerting from Section 6 → consult this document's relevant scenario below → execute → verify via the Section 5 smoke test checklist (or the relevant subset) before declaring resolved → record the incident (what happened, what was done, what would prevent recurrence) in `known-issues.md`.
- **Rollback steps (application):** redeploy the previous immutable build artifact (the commit SHA captured at the end of Section 4's deployment order) — both apps should support this as a single redeploy action on the chosen hosting provider, not a manual rebuild.
- **Database restore:** use the provider's point-in-time recovery (Neon supports this natively) to restore to a timestamp immediately before the incident; confirm which migrations (if any) were applied after that point and whether they need to be reapplied.
- **Media restore:** object storage (B2) is not typically restored via PITR — recommend the provider's own versioning/lifecycle rules (if enabled) or a periodic bucket-level backup, since this project does not currently do its own media backup independent of the storage provider.
- **Email failure:** `EmailService` already fails safe (logs and returns `false`, never throws — confirmed in Phase 16) — an email-provider outage degrades to "no notification sent," not application failure. Recovery is simply: fix/restore the Postmark integration, no data is lost since nothing depended on the send succeeding.
- **Payment failure:** Stripe webhook failures should be checked in Stripe's own dashboard (which retries automatically); a sustained backend outage during checkout requires manually reconciling any orders Stripe shows as paid but the app shows as unpaid — direct database correction of the `Order` status, guided by Stripe's own transaction records as the source of truth.
- **Worker failure:** not yet applicable (no worker process exists at launch). Once built, recovery is: restart the worker process, confirm the job queue drains, and confirm no jobs were silently dropped (depends on the specific queue library's own durability guarantees — a decision made when the worker is actually built).
- **API failure:** redeploy the last known-good build (rollback steps above); if the cause is a bad deploy, this alone resolves it; if the cause is an infrastructure-provider outage, this is outside engineering control — monitor the provider's own status page.
- **Frontend failure:** same redeploy-previous-artifact pattern; frontend failures are lower-risk than backend failures since the frontend holds no state of its own.

---

## 8. Launch Day Checklist

| Task | Owner | Est. Time | Status | Blocking? |
|---|---|---|---|---|
| Choose hosting provider(s) (Vercel + Railway recommended, Phase 17) | Owner | 30 min (decision) | ⬜ Not started | Yes |
| Register domain, confirm DNS access | Owner | 1–2 hrs (registration + propagation wait) | ⬜ Not started | Yes |
| Provision production database (Neon or chosen provider) | Owner | 15 min | ⬜ Not started | Yes |
| Provision production storage bucket | Owner | 15 min | ⬜ Not started | Yes |
| Create/verify Postmark account + sending domain | Owner | 30 min + DNS propagation wait | ⬜ Not started | Yes |
| Generate production secrets (JWT keypair, pepper, MFA key) — **owner's own machine, not an AI session** | Owner | 15 min | ⬜ Not started | Yes |
| Obtain live Stripe keys | Owner | 15 min | ⬜ Not started | Yes |
| Deploy backend with all secrets wired in | Owner (+ engineering support if needed) | 30–60 min | ⬜ Not started | Yes |
| Register Stripe production webhook, redeploy backend with the secret | Owner | 15 min | ⬜ Not started | Yes |
| Deploy frontend | Owner (+ engineering support if needed) | 15–30 min | ⬜ Not started | Yes |
| Point DNS at both deployments | Owner | 5 min + propagation wait (up to 24–48 hrs worst case) | ⬜ Not started | Yes |
| Wire up monitoring (Sentry + uptime) | Owner (+ engineering support if needed) | 30–60 min | ⬜ Not started | Strongly recommended, not strictly blocking |
| Run full Section 5 smoke test against live URLs | Engineering | 1–2 hrs | ⬜ Not started | Yes |
| Take rollback snapshot (DB backup + record deployed commit SHAs) | Engineering | 10 min | ⬜ Not started | Yes |
| Announce launch | Owner | — | ⬜ Not started | No |

---

## 9. Post-Launch Checklist

**24 hours:** watch error-tracking dashboard continuously; confirm real signups/orders are processing without silent failures; confirm no rate-limit false-positives are blocking real users; check Stripe webhook delivery log for any failed deliveries.

**48 hours:** review the first full day's logs for any recurring, non-obvious error pattern that a single smoke test wouldn't have caught; confirm the database backup actually ran successfully at least once.

**7 days:** review real usage patterns against the Section 8 (Scalability) reasoning in the main Phoenix repository's `docs/phase21-v1.1-roadmap.md` — confirm the platform is comfortably within the "100–1,000 users, ready as-is" tier assumption, or note if real traffic already suggests otherwise; review any accumulated `AuditLog`/error-tracking data for security-relevant anomalies.

**30 days:** first real decision point on whether the Notifications-delivery worker (Section 2, Critical in the v1.1 roadmap) should move up given real observed user behavior; review whether AI usage (if launched) is tracking real cost against the configured provider's billing; revisit the dependency-upgrade backlog (Phase 16's 27 findings) now that production stability data exists to inform timing.

**90 days:** full review against the main Phoenix repository's `docs/phase21-v1.1-roadmap.md`'s Executive Recommendation — has real usage data answered which of Search/AI-expansion/Analytics-depth should be next, as that report predicted it would; reassess the Section 8 scalability tier against real, now-known traffic; consider whether the manual screenshot-based visual-verification practice (used extensively through Phase 14.8) should be formalized into automated visual-regression testing per the v1.1 roadmap's Section 9 recommendation.

---

## 10. Final Go / No-Go Matrix

| Area | Status | Reasoning |
|---|---|---|
| **Security** | 🟢 Green | Zero Critical findings across two independent live audits (Phase 16, 18); real RS256 JWT, Argon2id+pepper, MFA, RBAC, rate limiting, security headers — all live-verified. |
| **Infrastructure** | 🔴 Red | No production hosting, domain, or DNS exists yet — entirely owner-decision-blocked (unchanged from Phase 19). |
| **Database** | 🟡 Yellow | Schema/migrations are production-ready and verified; no separate production instance has been provisioned yet. |
| **Frontend** | 🟢 Green (code) / 🔴 Red (deployment) | Builds clean, all routes verified live (Phase 18); zero production deployment exists. |
| **Backend** | 🟢 Green (code) / 🔴 Red (deployment) | 209/209 tests passing, builds clean, health endpoint real; zero production deployment exists. |
| **Workers** | 🔴 Red | Empty shell, confirmed via direct inspection this phase — not a launch blocker per se (Notifications can launch without it, degrading gracefully), but genuinely not production-capable in its current state. |
| **Payments** | 🟡 Yellow | Code is real, tested, and live-integration-proven with Stripe test keys; live keys and the production webhook registration remain outstanding (both owner-dependent, both fast once infrastructure exists). |
| **Email** | 🟡 Yellow | `EmailService` is real, tested, and safe-degrading; real Postmark credentials and a DNS-verified sending domain are outstanding. |
| **Storage** | 🟡 Yellow | Code is real and live-verified against B2; a distinct production bucket has not been provisioned. |
| **Documentation** | 🟢 Green | Exceptionally thorough for this project's stage — 4 standing tracking docs kept current through every phase, a full freeze/inventory/roadmap set, and now this launch-preparation document. |
| **Deployment** | 🔴 Red | No deployment has occurred; this document is preparation for one, not evidence one happened. |
| **Monitoring** | 🔴 Red | Only a passive health endpoint exists; no APM, crash reporting, or uptime service is configured anywhere. |

---

## Launch Readiness

**Launch Readiness: ~72%.**

This reflects engineering completeness (which is very high — code, tests, and two independent security audits all point the same direction) discounted heavily by the operational/infrastructure gap, which is entirely external to engineering effort. It is a slightly more conservative figure than Phase 16's 76–80/100 production-readiness scores because this document specifically weighs deployment-day operational readiness (monitoring, live infrastructure, live secrets) rather than code/architecture quality, which is where this platform is strongest.

**Remaining Owner Actions** (mirrors the main Phoenix repository's `docs/phase19-execution-readiness-report.md`'s Owner Action List — unchanged, still the authoritative source):
1. Choose and set up hosting (Vercel + Railway recommended).
2. Register domain, configure DNS.
3. Provision production database, storage bucket, Postmark account (with domain verification).
4. Generate production secrets directly, outside any AI session.
5. Obtain live Stripe keys and register the production webhook (after step 1's backend URL exists).
6. Wire up monitoring (Sentry + uptime) — strongly recommended, not strictly blocking, but should not be skipped.
7. Run the Section 5 smoke test against the real, live URLs before calling launch complete.

**Estimated time until production deployment:** roughly **1–2 business days of owner-side setup work** (mostly account creation and DNS propagation waiting, not engineering effort) once the owner is available to execute Section 8's checklist — engineering support for the deploy steps themselves (backend/frontend deploy, webhook wiring, smoke test) adds a few hours on top of that, assumable in parallel with DNS propagation.

**Final recommendation:** 🟡 **Ready to launch once the owner completes the external-account setup above — no further engineering work is required to reach launch-capable state.** The codebase itself is not the blocker; treat this as a scheduling/operations task, not a development task. Monitoring should be wired up before, not after, declaring launch complete — it is the one item on this list cheap enough and important enough to not defer.

---

**STOP. Awaiting approval before Phase 22.**
