# Restore Point

**Version:** Phase 16 (Release Candidate 1 — Production Launch Readiness)

**Status:** Complete. All 5 Critical blockers from `docs/phase15-production-readiness-report.md` closed or reduced to an operator config step. Full production validation report: `docs/phase16-production-validation-report.md`. Zero regressions.

**Date:** 2026-08-06

## What This Phase Was

The fifth thread in this project's session history — implementation work closing the Phase 15 audit's Critical findings, and only those. No new features, no UI redesign, no business-logic changes, no API contract changes, no architecture changes, per the phase's explicit Restrictions. Every change below maps directly to one of Phase 15's 5 Critical items.

## What Was Changed

### 1. Email Provider (Postmark)
- **New:** `apps/api/src/common/services/email.service.ts` — real Postmark integration, safe-degrading (logs, never throws, when unconfigured).
- **New:** `apps/api/src/common/services/email.service.spec.ts` — 8 tests.
- **Modified:** `apps/api/src/modules/auth/auth.service.ts` — 5 call sites (verification, password reset, MFA enabled/disabled/recovery-code-used) now call `EmailService` instead of logging a `BLOCKED` stub. `auth.service.spec.ts` updated with an `emailService` mock.
- **Modified:** `apps/api/src/common/common.module.ts` — registers/exports `EmailService`.
- **Modified:** `apps/api/src/config/configuration.ts` — new `email` config block.
- **Modified:** `apps/api/.env.example` — `POSTMARK_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME` documented.
- **New:** `apps/api/src/health/` (`health.module.ts`, `health.controller.ts`) — `GET /api/v1/health`, `@Public()`, reports database/redis/storage/stripe/email configuration status. Did not exist before this phase at all.

### 2. HTTP Security Headers
- **Modified:** `apps/api/src/main.ts` — `helmet()` with explicit CSP/CORP/COEP/HSTS/Referrer-Policy, plus a manual `Permissions-Policy` header (helmet has no built-in preset for it).
- **Modified:** `apps/web/next.config.mjs` — `headers()` function applying CSP/X-Frame-Options/X-Content-Type-Options/Referrer-Policy/Permissions-Policy/HSTS to every route, `poweredByHeader: false`.

### 3. Dependency Security Audit
- **No package.json/lock changes for vulnerability fixes** — all 27 `npm audit` findings require breaking major-version upgrades; none were forced. Full grouped reasoning in the validation report §3.
- (Unrelated to the audit itself: `postmark`/`helmet` were added as new, intentional dependencies for items 1–2 above.)

### 4. CI/CD
- **Modified:** `.github/workflows/ci.yml` — added the missing Turbo cache step to `test-backend`/`build-backend`/`build-frontend` (previously only `quality` had it), added `actions/upload-artifact@v4` steps to `build-backend`/`build-frontend`. YAML re-validated (parses cleanly, all 5 jobs present).
- **Not built:** a CD/deployment workflow — requires a hosting-target decision out of this phase's authority. Documented, not invented.

### 5. Database Indexes
- **New migration:** `apps/api/prisma/migrations/20260806075921_add_production_indexes/` — `Course.categoryId`, `Product.categoryId`, `Order.createdAt`.
- **Modified:** `apps/api/prisma/schema.prisma` — 3 new `@@index` lines, nothing else touched (confirmed via diff).
- Applied to the live database and independently verified via a direct `pg_indexes` query, not just `prisma migrate status`.

## Validation

- `npx tsc --noEmit` — clean, both apps.
- `npm run lint` — clean, both apps ("No ESLint warnings or errors").
- Full clean rebuild (`rm -rf dist tsconfig.tsbuildinfo && npm run build`) — both apps, clean.
- `npm test --workspace=apps/api` — **209/209 passing**, 26/26 suites (up from 201/25 before this phase).
- `prisma migrate status` — "Database schema is up to date," 21 migrations.
- Live verification: both servers restarted on the final build; `GET /api/v1/health` returns real status; a real `POST /auth/register` call succeeded (201) and the log shows the correct EmailService fallback line, not a crash; a live Playwright pass logged in as learner/instructor/superadmin and visited Settings, Orders, Certificates, Notifications, Media Manager, Admin Dashboard, and Admin Users — zero CSP violations, zero console errors, zero page crashes across all 7 pages × 3 roles.
- One real, incidental confirmation: a Neon database cold-start caused the first `prisma migrate dev` attempt to fail with `P1001` (connection refused); a lightweight retry query confirmed it was just waking up, and the actual migration succeeded on retry — not a defect, a real, disclosed transient environment condition.
- One real Windows-specific hiccup handled correctly: after applying the migration, Prisma Client regeneration hit `EPERM` renaming the query-engine DLL because the previously-running API process still held a lock on it — stopped the process, regenerated cleanly, restarted. Documented here in case it recurs.

## Real Findings From This Phase's Own Work (not in Phase 15, discovered while implementing)

- Health check infrastructure didn't exist at all — required building it from scratch to satisfy the email-provider deliverable's "update health checks" requirement.
- The CSP's `connect-src` needed a broad `https:` allowance (not a single fixed origin) because media uploads go direct-to-storage via a presigned URL whose host is provider-configured server-side, not knowable at frontend build time or exposed as a `NEXT_PUBLIC_` var — verified necessary by tracing the real upload code path (`packages/api-client/src/resources/files.ts`'s `xhr.open('PUT', uploadUrl)`), not assumed.
- `apps/api`'s build output directory had gone stale (a recurring, previously-documented issue class in this project — see `docs/phase11-final-closure-report.md`) — a `rm -rf dist tsconfig.tsbuildinfo` clean rebuild was required before the rebuilt API would boot at all with the new `env.validation` reference. Fixed as part of this phase's own validation, not left for later.

## Architecture Review

No architecture changes made or needed. The one new architectural surface (`apps/api/src/health/`) is a single `@Public()` GET endpoint with no state, following the existing module-per-concern convention — not a new subsystem.

## Remaining Risks

Everything from `docs/phase15-production-readiness-report.md` that this phase didn't target is unaffected: the confirmed-dead legacy route tree (not deleted — no-cleanup instruction), zero frontend unit tests, zero backend controller-level tests, the stale full-E2E baseline. New from this phase, all documented in `docs/phase16-production-validation-report.md`'s "Remaining Issues": no real Postmark credentials in this environment, 27 unpatched dependency findings (all breaking, deferred with reasoning), no CD workflow, CI unverified on a real remote push, the async Notification email channel still unbuilt (Candidate D's scope), no APM/monitoring service configured, database backup policy unverified.

## Safe Resume Point

Per the phase's closing instruction, **wait for approval before Phase 17.** The validation report's Engineering Recommendation is **B — Ready after minor operational tasks**: obtain real Postmark credentials, decide on and configure a hosting target, schedule the deferred dependency major-version upgrades as their own effort, and confirm CI on a real GitHub push. None of these require new code design.

## Restorability

**Recommended starting point:** `docs/documentation-index.md` → `docs/project-status.md`'s Current Phase section → `docs/phase16-production-validation-report.md` (the full validation + RC checklist + scores) → this file.

**Guaranteed minimum fallback:**
1. `docs/phase16-production-validation-report.md` — the complete validation report, RC checklist, 4 readiness scores, remaining issues, and the B recommendation with justification.
2. `docs/project-status.md` — current phase and pointer to the report.
3. `docs/known-issues.md` — newly-resolved/newly-documented findings folded into the existing structure.
4. `docs/next-session.md` — the real next decision points.
