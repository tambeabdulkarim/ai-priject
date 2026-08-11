# Phase 15 — Platform Stabilization & Production Readiness Report

**Date:** 2026-08-06 · **Type:** Read-only audit and documentation. **No code was deleted, refactored, or renamed** — per this phase's explicit instruction, every finding below is reported for a future phase to act on, not acted on now.

**Method:** Five parallel, independent investigations (Repository Health + Dependencies, Security, API + Database, Performance, Testing) each read the real code and reported findings with severity + reasoning. Every finding was then spot-verified directly against the codebase before inclusion here — **two claims were found to be wrong and corrected**, not repeated: (1) an agent reported the Prisma migrations directory as empty ("Critical" — no reproducible schema history); direct inspection found **20 real migration folders**, so this is retracted. (2) An agent reported the entire non-`[lang]` route tree as dead; direct inspection found `checkout/success` and `checkout/cancel` are real, live Stripe redirect targets (confirmed in `orders.service.ts`), so only the *other* non-`[lang]` routes are dead, not all of them. This report reflects the corrected findings, not the raw agent output.

---

## Executive Summary

Phoenix's engineering fundamentals are genuinely solid: RS256 JWT, Argon2id password hashing, real TOTP MFA, globally-wired RBAC guards, httpOnly refresh cookies, consistent DTO validation, consistent error envelopes, cursor-based pagination, and a real rate-limiter with account lockout. The backend has 201/201 passing unit tests. This is not a prototype — it is a carefully built platform.

But it is **not ready for a real production launch today**, for reasons that are mostly configuration and process gaps rather than architecture problems:

- **No email provider is configured anywhere** — real users cannot receive verification emails, password-reset links, or MFA notifications in production as currently set up. This blocks core account-recovery flows for real users, not just a nice-to-have.
- **No HTTP security headers (helmet)** — no CSP, no `X-Frame-Options`, no `X-Content-Type-Options`. A real gap for an internet-facing API.
- **`npm audit` has never been run** — real CVE exposure across dependencies is genuinely unknown, not just unlikely.
- **The CI pipeline has never been verified on an actual GitHub Actions run** — it's proven locally but not proven where it will actually run.
- **Two real, cheap-to-fix missing database indexes** (`Product.categoryId`, `Course.categoryId`, `Order.createdAt`) will cause sequential scans as the catalog and order history grow.
- **Zero frontend unit tests and zero backend controller-level tests exist** — the safety net is E2E + service-layer tests only.

None of these require architectural rework. Most are hours, not weeks. **Deployment Readiness: 58/100. Production (engineering-quality) Readiness: 74/100.** See the scoring rationale below.

---

## 1. Repository Health Report

| Finding | Severity | Evidence |
|---|---|---|
| Orphaned legacy route tree (`app/dashboard`, `app/analytics`, `app/files`, `app/projects`, `app/workspace` — **not** `checkout/success`/`checkout/cancel`, which are real Stripe redirect targets, confirmed in `orders.service.ts`) | High | Zero internal `Link`/`href` references anywhere in `[lang]/*`; a comment in `[lang]/dashboard/page.tsx` explicitly calls the old one "a generic, unrelated task-manager placeholder — no real data, not Phoenix-specific" |
| Components exclusively serving the dead route tree (`TasksSection`, `NotesPanel`, `CalendarSection`, `ProjectsBoard`, `FilesPanel`, `AnalyticsPanel`, `BottomStatistics`, `FeatureCards`, `HomePageContent`, `Roadmap`, `News` component, `LocalStorageSync`, workspace `SettingsPanel`) | High | Same dead tree — these components have no other callers |
| `AuthPanel.tsx` — fully dead component | Medium | Confirmed: zero references anywhere in the codebase, including from the dead tree itself |
| `packages/ui`, `packages/i18n`, `packages/validation` — empty scaffolding, unused | Low | Not imported by `apps/web` or `apps/api`; appears to be intentional future-phase scaffolding, not accidental |
| `apps/admin` — confirmed inert | Low | Already formally retired and documented (Phase 14.4) |
| TODO/FIXME/deprecated markers | Info | Repo-wide grep found only 3 hits, all false positives (an "XXXXX-XXXXX" recovery-code format string) — negligible technical-debt-marker backlog |
| `ph-bstat*` CSS classes | Low | Used only by the dead `BottomStatistics` component — likely removable alongside it |

**Positive finding:** all 24 NestJS backend modules are registered in `app.module.ts` — no orphaned backend modules. No duplicate library usage found.

**Not exhaustively checked** (disclosed, not silently skipped): full CSS class usage across all ~2350 lines of `globals.css` (spot-checked ~25 classes only), `apps/web/src/lib`/`utils`/`guards`/`contexts` directories for dead code, and whether the dead route tree is excluded from the production build/middleware (only confirmed no in-app links reach it).

---

## 2. Dependency Audit

| Finding | Severity | Evidence |
|---|---|---|
| `npm audit` never run — real CVE exposure unknown | High | No network access in this audit session; this is a process gap, not a code finding, but a real pre-launch requirement |
| Next.js 14.2.15 (one major behind) | Medium | `apps/web`/`apps/admin` both pinned; Next.js 15 has been stable for a while |
| Prisma ^5.20 (one major behind) | Medium | Prisma 6 stable; schema-affecting upgrade, plan deliberately, don't rush |
| NestJS ecosystem ^10.4 (one major behind), paired with ESLint 8/typescript-eslint 7 | Medium | Self-consistent across the whole toolchain — looks like a deliberate freeze, not neglect, but should be validated as a decision rather than assumed |
| `lucide-react ^1.27.0` — unusual version number | Low | Historically this package tracks 0.x — could be genuinely current or a lockfile artifact; flagged for a manual check, not confirmed wrong |
| `stripe ^17.3.0` | Low | Stripe's SDK moves fast; verify current major before relying on webhook/API-version behavior long-term |

**No unused dependencies found** (every declared package had at least one real import). **No duplicate libraries found** (no competing HTTP clients, date libraries, or state managers). `apps/workers` has an empty dependency list, consistent with it being a documented, intentional empty shell.

---

## 3. Performance Report

| Finding | Severity | Impact |
|---|---|---|
| `next/dynamic` used nowhere in the codebase; `QRCodeSVG` (qrcode.react) imported eagerly in Settings even though only rendered during MFA enrollment | Medium | Every Settings visitor pays for the QR library's bundle weight, not just the minority enrolling in MFA |
| `Navigation.tsx` rebuilds its nav-items array and some inline style objects every render | Low | Negligible per-render cost, but runs on every authenticated page load — an easy, low-risk `useMemo`/module-const fix |
| 680-line `instructor/courses/[id]/edit/page.tsx`, 450-line `settings/page.tsx` | Medium | Maintainability/bundle-size risk more than runtime cost — real splitting candidates |
| `MediaPicker`/`MediaUploader` imported eagerly into the already-largest course-edit bundle | Low-Medium | Could be dynamically imported to shrink that route's chunk |
| Admin Audit Logs: unmemoized `flatMap` + inline `JSON.stringify` per expanded row | Low-Medium | Grows with infinite-scroll history; admin-only audience limits blast radius |
| Bundle size overall | Low | Lean dependency set (no moment.js, no full lodash), `lucide-react` imports are tree-shakeable named imports, route chunks are all normal-sized in the current build — healthy |
| `next/image` usage | Low | Used correctly (with `priority`/`sizes`) in the one place it matters (`Hero.tsx`); the single raw `<img>` found (`MediaPreview.tsx`) is a deliberate, documented exception for arbitrary user-uploaded signed URLs |
| 77 of 100 `.tsx` files are `'use client'` | Medium | Not wrong for a highly interactive dashboard app, but means Next's Server Component boundary isn't doing much work — automatic per-route code splitting is still intact, nothing found actively undermining it |

**No Critical or High performance findings** — the app is not exhibiting real user-facing slowness by any evidence found; the items above are efficiency/bundle-size opportunities, not bugs.

---

## 4. Security Report

| Area | Status | Detail |
|---|---|---|
| Authentication | **Solid** | RS256 JWT (asymmetric, private key server-side only), short-lived access tokens (15 min default), Argon2id password hashing with a per-install pepper, real TOTP MFA (RFC 6238) with AES-256-GCM-encrypted secrets and single-use hashed recovery codes |
| Authorization | **Solid** | Guards wired globally via `APP_GUARD` (`JwtAuthGuard` → `RolesGuard` → `PermissionsGuard`); `@Public()` is the explicit, auditable opt-out. No unguarded endpoint found in a sample spanning admin/payments/files controllers |
| JWT storage | **Solid** | Access token held in-memory only on the client (never `localStorage`); refresh token is an httpOnly cookie, never touched by JS |
| Cookies | **Solid** | Refresh cookie: `httpOnly: true, secure: true, sameSite: 'strict'`, scoped to `/api/v1/auth` — correct flags |
| **HTTP security headers** | **Gap — Medium-High** | No helmet or equivalent anywhere in `apps/api`; no CSP, `X-Frame-Options`, or `X-Content-Type-Options` configured. CORS itself *is* correctly scoped to a single origin (not a wildcard) |
| Secrets | **Solid** | `.gitignore` excludes `.env*`; `.env.example` documents structure without values; a real `.env` exists on disk and was not read/quoted by this audit |
| Input validation | **Solid** | Global `ValidationPipe` (`whitelist: true, forbidNonWhitelisted: true`); consistent class-validator decorators across sampled DTOs |
| Rate limiting | **Solid** | `@Throttle` on every sensitive auth route (register, login, MFA verify, password reset) plus a Redis-backed account lockout after 5 failed logins, independent of the IP-based throttle — real defense-in-depth |
| File uploads | **Mostly solid — one known gap** | Direct-to-storage presigned uploads (server never buffers untrusted bytes); server-side magic-byte MIME sniffing (not trusting client `Content-Type`); UUID-based storage keys (no path-traversal risk). **Gap (Medium):** malware scanning is not integrated — `File.scanStatus` never transitions to `'clean'` via any automated process (a known, previously-disclosed gap, not new) |
| MFA/pepper key management | **Low** | Plain env vars, no KMS/rotation — acceptable given no KMS infrastructure exists yet; already documented as such |

**No Critical security findings.** The two real gaps (helmet, malware scanning) are both well-understood, bounded fixes — not architectural problems.

---

## 5. API Report

| Finding | Severity | Detail |
|---|---|---|
| Controller path-style inconsistency | Medium | Some controllers use `@Controller('resource')` + relative sub-paths; others (`OrdersController`, `MediaController`) use bare `@Controller()` with full literal paths, mixing admin and resource routes in one controller — functionally fine, stylistically inconsistent |
| No `sort`/`orderBy` query param on any list endpoint | Medium | Every repository hardcodes `orderBy: { createdAt: 'desc' }` — not a bug today, but a naming-convention risk if sorting is added later without an established pattern |
| Error handling | Low (strength) | A single global `AllExceptionsFilter` enforces one response envelope platform-wide, never leaking internal exception detail on 500s |
| Validation | Low (strength) | Global `ValidationPipe` + consistent class-validator DTOs everywhere sampled |
| HTTP status codes | Low (strength) | 201 for creates, explicit 200 overrides for action-style POSTs, 204 for destructive/no-body actions, 202 for async work — deliberate and correct everywhere sampled |
| Pagination | Low (strength) | One shared `PaginationQueryDto` (cursor-based, default 20, clamped max 100), identically implemented across every repository checked |
| Naming | Low (strength) | camelCase request/response bodies, snake_case DB columns via `@map` — clean, consistent separation |

---

## 6. Database Report

| Finding | Severity | Detail |
|---|---|---|
| `Product.categoryId` and `Course.categoryId` filtered in their repositories but **not indexed** | High | `LibraryItem.categoryId` *is* indexed — the inconsistency suggests an oversight, not a deliberate choice. Real, actionable, cheap to fix |
| `Order.createdAt` used for admin date-range filtering + sorting but not indexed | Medium | Only `[userId]` and `[status]` are indexed on `Order` — exactly the kind of high-traffic, date-ranged query that benefits from this |
| Course/Product text search (`contains`, case-insensitive) has no supporting index | Medium | Fine at current size; would need a `pg_trgm` GIN index as the catalog grows — flag for later, not urgent now |
| Most relations rely on implicit default `RESTRICT` with no explicit `onDelete` | Medium | Safe by default (no accidental cascades), but intent is undocumented except for one case (`Enrollment.orderItem`, which explicitly reasons about it) |
| Migration history | **Retracted finding — verified intact** | An initial pass reported the migrations directory as empty; direct inspection found **20 real migration folders** from `20260730112643_layer_01_foundational` through `20260805075908_add_mfa_support`, plus `migration_lock.toml`. No issue here |
| `@map`/`@@map` naming convention | Low (strength) | 100% consistent snake_case DB mapping across all models checked |
| `Notification`, `AuditLog`, `Log` tables | Positive | Correctly pre-indexed for their high-write/time-ordered access patterns — shows the schema was generally designed with query patterns in mind, making the `categoryId`/`Order.createdAt` gaps look like isolated misses, not a systemic problem |

---

## 7. Documentation Review

`docs/documentation-index.md` was cross-checked directly against every `restore-point-phase*.md` file actually on disk — **fully synchronized**, no missing or orphaned references. Known, already-disclosed gaps remain accurately flagged and unchanged by this phase: `docs/00`–`08` numbered series are still scaffold-only, no standalone deployment guide exists, no standalone E2E reference doc exists, and the (now three-way) phase-numbering ambiguity between the formal roadmap, the Candidate track, and the visual-polish thread remains unresolved. None of these are new findings — this phase confirms they're still accurately tracked, not that they're fixed.

---

## 8. Testing Report

**Summary: 25 backend spec files (201/201 tests passing, confirmed live) · 0 real frontend unit test files (3 leftover files reference a different, unrelated project and don't run) · 23 E2E spec files.**

| Finding | Severity | Detail |
|---|---|---|
| Zero frontend unit/component tests | High | `apps/web/package.json` has no `test`/`jest`/`vitest` script at all. The only `*.test.js` files found import from `src/lib/notes.js`/`tasks.js`, which don't exist in this codebase — dead leftovers from an unrelated earlier scaffold, not Phoenix tests |
| Zero backend controller-level tests | Medium | 18 controllers, 0 direct `*.controller.spec.ts` files — controller behavior (guard wiring, DTO validation at the HTTP boundary) is only indirectly exercised via E2E |
| `lessons.service.ts`, `permissions.service.ts`, `storage.service.ts` — no unit coverage | High | Core content-authoring, authorization-adjacent, and upload/signed-URL logic respectively, all currently untested at the unit level |
| `notifications.service.ts`, `stripe.service.ts` (raw wrapper), `audit-log.service.ts`, `breached-password.service.ts` — no unit coverage | Medium | Security- or business-relevant but not directly tested (some indirectly covered via other specs' mocks) |
| Full E2E suite pass/fail state is stale | Medium | Last known full run: "30 Passed / 14 Failed (13 Rate Limit, 1 Real Backend Bug)" from Phase 11.6/11.7 — never re-run in full since, per this project's own "no blind full-suite re-run" guidance. Recent *targeted* runs (Instructor Course Editor 3/3, Moderator Queue 1/1, Moderator Review Actions 1/1, 14/14 direct authorization checks) all pass, but the current true full-suite state is genuinely unknown |
| No E2E coverage by name for Categories, Notifications, Certificates, Progress/Quiz, or Library flows | Medium | 23 E2E specs cover auth/admin/instructor/moderator/user/ai/marketplace/public flows well, but these five surfaces have no dedicated spec file |
| Orders/Enrollments have no concurrent-request race tests | Medium | `payments.service.spec.ts` *does* cover concurrent-refund races and idempotency well, and `mfa.service.spec.ts` covers recovery-code exhaustion/reuse well — but grepping `orders.service.spec.ts`/`enrollments.service.spec.ts` for "concurrent"/"race" found no matches, meaning double-enrollment or duplicate-order-submission races aren't explicitly tested, despite the same risk class being handled carefully elsewhere |

**Per this phase's explicit instruction, no test files were created or modified** — these are documented gaps for a future phase to act on.

---

## 9. Technical Debt & Final Risk Assessment

**Technical debt (not blocking, compounds over time):**
- Dead legacy route tree + its exclusive components (repo hygiene, onboarding-confusion risk for new contributors).
- Zero frontend/controller-level test coverage (real, but E2E + service tests provide a partial safety net today).
- Dependency versions one major behind across Next.js/Prisma/NestJS (self-consistent, likely deliberate, but should be a planned decision, not an assumption).
- Triple phase-numbering system in documentation (confusion risk, not a functional risk).

**Deployment risks (block a real launch, all bounded/fixable):**
- **No email provider configured** — real users cannot verify their email, reset a forgotten password, or receive MFA notifications in production. This is the single most user-facing blocker found.
- **No HTTP security headers (helmet)** — real, internet-facing gap.
- **`npm audit` never run** — unknown real CVE exposure.
- **CI pipeline never verified on an actual GitHub Actions run** — proven locally only.
- **Missing indexes** (`Product.categoryId`, `Course.categoryId`, `Order.createdAt`) — will degrade under real growth, cheap to fix now before it's a live incident.

**Operational risks (known, already disclosed in prior phases, unchanged):**
- No malware scanning on uploads (`File.scanStatus` never leaves `pending`).
- MFA is opt-in, not mandatory, for admin-capable roles (a deliberate, documented Phase 14.2 decision, not an oversight).
- Docker/WSL2 unusable in this environment (doesn't block anything currently in use — Storage moved to Backblaze B2, but blocks local MinIO/Meilisearch specifically).

**Scaling risks:**
- The two missing indexes above are the concrete, identified scaling risk. No other schema-level scaling concern was found — the rest of the schema shows deliberate index placement (`Notification`, `AuditLog`, `Log` are all correctly pre-indexed for their access patterns).

**What is genuinely NOT a risk**, confirmed by this audit, worth stating plainly: authentication, authorization, session/cookie handling, input validation, rate limiting, and the payments/refund path are all solid and well-tested. This is not a platform with a shaky foundation — it has a small number of concrete, fixable gaps between "well-engineered" and "safe to point real users and real money at."

---

## Deployment Readiness Score: 58 / 100

Reflects "can this be switched on for real users right now, as configured." Held back specifically by: no email delivery (blocks account recovery for real users), no helmet, no `npm audit` run, CI unverified on a real remote, and the two missing indexes. Every one of these is a same-day-to-few-days fix, not a redesign — this score reflects current configuration state, not a judgment on the engineering underneath it.

## Production Readiness Score: 74 / 100

Reflects the underlying engineering quality independent of the environment-configuration gaps above (email provider, npm audit, CI verification are operational/configuration steps, not code-quality problems). Held back by: zero frontend/controller test coverage, the dead-code backlog, missing indexes, and the helmet gap. The security fundamentals, API consistency, database design discipline, and service-layer test coverage all pull this score up substantially from the deployment-readiness number.

**Is Phoenix ready to launch today, as-is? No.** The blockers are narrow and well-understood (configure an email provider, add helmet, run a real `npm audit`, verify CI on GitHub, add two indexes) rather than deep — this is a platform that is close, not one that needs months of further hardening.

---

## Top 20 Recommendations, Ranked by Priority

**Critical (do before any real launch):**
1. Configure a real email provider (verification, password reset, MFA notifications currently undeliverable to real users).
2. Add helmet (or equivalent) to `apps/api/src/main.ts` for baseline HTTP security headers.
3. Run a real `npm audit` (and ideally Dependabot/Snyk) across all workspaces and triage results.
4. Confirm the CI pipeline actually runs successfully on a real GitHub Actions push, not just locally.
5. Add indexes: `Product.categoryId`, `Course.categoryId`, `Order.createdAt`.

**High:**
6. Add unit tests for `lessons.service.ts`, `permissions.service.ts`, and `storage.service.ts` — the three highest-value untested services.
7. Stand up even a minimal frontend unit-test setup (Vitest/Jest + React Testing Library) — currently zero coverage.
8. Re-run the full E2E suite once, deliberately, to get a current, non-stale pass/fail baseline (last known number is from Phase 11.6/11.7).
9. Delete the dead legacy route tree and its exclusive components — real, confirmed dead code (do this as its own scoped cleanup phase, not silently).
10. Add concurrent-request tests for Orders/Enrollments (double-enrollment, duplicate-order-submission) — same risk class already well-tested in Payments.

**Medium:**
11. Add controller-level tests for at least the highest-traffic controllers (auth, orders, courses).
12. Dynamically import `qrcode.react` in Settings so non-MFA visitors don't pay for it.
13. Add an index supporting Course/Product text search before the catalog grows meaningfully (`pg_trgm` GIN).
14. Document explicit `onDelete` intent on relations beyond the one existing example (`Enrollment.orderItem`).
15. Add a `sort`/`orderBy` query-param convention before any endpoint needs it, so it's decided once, consistently.
16. Split the 680-line course-edit page and 450-line settings page for maintainability.
17. Add E2E coverage for Categories, Notifications, Certificates, Progress/Quiz, and Library flows.
18. Resolve or formally document the CORS/helmet-adjacent config in one place so future contributors don't have to re-derive it.
19. Plan (don't rush) the Next.js 15 / Prisma 6 / NestJS 11 upgrade path as one deliberate effort, not three separate surprises.

**Low:**
20. Remove `AuthPanel.tsx` and the `ph-bstat*` CSS classes alongside the dead-route cleanup; verify `lucide-react`'s version number is genuinely current.

---

## Post-Launch Roadmap (Phase 16 and beyond, by value/priority)

1. **Phase 16 — Deployment Blockers.** Close the 5 Critical items above. This is the shortest path to a real, safe launch.
2. **Phase 17 — Test Coverage Hardening.** Frontend unit tests, controller tests, the 3 highest-value untested services, a fresh full E2E baseline, and the Orders/Enrollments concurrency tests.
3. **Phase 18 — Repository Cleanup.** Delete the confirmed-dead route tree and components (as its own scoped, reviewable phase — not folded into other work), remove `AuthPanel.tsx`, prune unused CSS.
4. **Phase 19 — Notifications Delivery (Candidate D, already planned).** Now directly unblocked by Phase 16's email-provider work — build the actual delivery worker.
5. **Phase 20 — Search (Candidate E, already planned).** Meilisearch integration, unblocked once local or hosted infrastructure is available.
6. **Phase 21 — Dependency Modernization.** One deliberate pass: Next.js 15, Prisma 6, NestJS 11, ESLint 9 — planned and tested together, not incremental surprises.
7. **Ongoing — Scaling Watch.** Revisit indexes and text-search strategy once real catalog/order volume exists; the schema is currently well-positioned but not yet load-tested.

This roadmap intentionally puts launch-blockers before feature work — Notifications and Search are valuable, but shipping a platform that can't send a password-reset email is a worse outcome than shipping slightly later with that fixed.
