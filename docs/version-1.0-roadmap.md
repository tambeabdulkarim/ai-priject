# Phoenix Platform — Version 1.1+ Roadmap

**Date:** 2026-08-06 · Companion to `docs/version-1.0-freeze.md`. Everything below is post-freeze work — none of it is required to consider Phoenix v1.0 complete; all of it builds on top of the frozen foundation. Grounded entirely in this session's own verified findings (Phases 15–20), not speculative feature requests.

---

## Immediate (launch-blocking, not v1.0-blocking)

These are the Phase 19 Owner Action List items — external accounts and decisions, not engineering:

1. Choose a hosting provider (recommended: Vercel + Railway) and create the accounts.
2. Set the monorepo root directory explicitly on both platforms (`apps/web`, `apps/api`).
3. Choose/purchase a production domain.
4. Generate fresh production secrets (commands already documented, deliberately not run in this session).
5. Decide on production database/object-storage isolation (new Neon project, new B2 bucket, vs. an informed reuse decision).
6. Create a production Postmark account, verify the sending domain (SPF/DKIM/DMARC).
7. Deploy, run `prisma migrate deploy`, set environment variables, verify `/health`.
8. Set up an uptime monitor against `/health`.
9. Run the real smoke test (never with `e2e.*` fixtures) against the live production URL.

Full detail: `docs/phase19-execution-readiness-report.md`.

---

## Short Term (first 1–4 weeks post-launch)

1. **Add crash reporting** (Sentry or equivalent) to both apps — the single biggest real monitoring gap identified across Phases 16–19.
2. **Correct the vercel.json → Root Directory learning** into the deployment guide itself, now that Phase 19 actually executed the fix — close the loop on the one guide gap Phase 18 found.
3. **Fix or remove the decorative dark-mode toggle** — a small, real, user-facing defect confirmed in Phase 18.
4. **Investigate and resolve the stray root-level artifacts** (`shots/`, `shots2/`, `.preview/`, `Phoenix_v0.1.0.zip`) found while producing the Version 1.0 inventory.
5. **Add `apps/workers`'s missing `start` script** — trivial, but should land alongside the first real worker, not before (no reason to add a script with nothing to run).
6. **Confirm whether the configured `STRIPE_SECRET_KEY` is live or test-mode** before real transactions are expected to succeed.

## Medium Term (1–3 months post-launch)

1. **Candidate D — Notifications delivery worker.** The real, tested `EmailService` (Phase 16) already exists; this phase builds the actual queue/worker (`apps/workers`) that consumes `Notification` rows with `channel: email` and dispatches them. The single most valuable piece of genuinely new engineering left for Phoenix.
2. **Frontend unit/component test suite.** Stand up Vitest + React Testing Library, starting with the highest-value untested surfaces: `useAuth`, the login/register/checkout forms, and the `EmailService`-adjacent MFA UI.
3. **Backend controller-level tests and the 4 missing service specs** (`lessons`, `notifications`, `permissions`, `categories`) — `permissions.service.spec.ts` first, given its security adjacency.
4. **Concurrency-race tests for Orders/Enrollments**, mirroring the pattern `payments.service.spec.ts` already established for refunds.
5. **The visual-polish thread's remaining 8 items** (Moderator/Admin dashboard stat-card unification, a full responsive review, a real tool-assisted accessibility audit, the `globals.css` token retrofit) — see `docs/restore-point-phase14.8.md`.
6. **Re-run the full E2E suite once, deliberately**, to replace the stale Phase 11.6/11.7 baseline with a current one.
7. **Real Infrastructure-as-Code** (Terraform) for the now-live production resources, once they exist and have stabilized — replaces the current manual provisioning.

## Long Term (3–6 months post-launch)

1. **Search (Meilisearch integration).** Real backend module, indexing hooks on Courses/Products/Library/News, a query endpoint, frontend search UI wiring. Currently zero backend integration despite being provisioned.
2. **OAuth login.** Requires a new identity-linking table in the schema (does not exist today) plus real provider integration (Google/GitHub, etc.) — a genuine schema-level addition, correctly deferred rather than rushed.
3. **Malware scanning integration** for uploaded files — `File.scanStatus` already exists and is ready to be driven by a real scanning engine once one is chosen and integrated.
4. **The deferred dependency major-version upgrades** (Next.js 14→16 first, given its Critical-severity `npm audit` findings; then NestJS 10→11; then `@nestjs/config` 3→4) — one deliberate, tested effort, not three separate surprises, per Phase 15/16's own recommendation.
5. **Certificate PDF generation.** Real PDF rendering (a library/service integration) so `pdfFileId` stops being permanently `null` — the storage/download plumbing already exists and is correct, only the generation step is missing.
6. **CD/deployment workflow**, once the hosting decision (above) has been live for long enough to be confident in the target platform's real behavior.

## Future Vision (6+ months, directional only — not commitments)

1. **Mobile app** (`apps/mobile`, React Native/Expo) — the `packages/api-client`/`packages/types`/`packages/validation` split already exists specifically to support this without reimplementing API integration.
2. **A generalized `packages/i18n`** consumer beyond the current `ar`/`en` dictionary pattern, if/when a third language or the mobile app materializes — the package already exists, unused, waiting for a real second consumer.
3. **A real `packages/ui` component library**, if/when a second frontend surface (mobile, or a rebuilt `apps/admin`) needs to share components rather than each app maintaining its own.
4. **Real database scaling** (read replicas, connection pooling tuning, a caching layer beyond Redis's current session/rate-limit use) — only once real production load data justifies it, per the architecture doc's own "boring at launch, scale by adding, not by over-engineering" philosophy.
5. **Revisiting `apps/admin` as a genuinely separate, isolated app** (`docs/09-PLATFORM-ARCHITECTURE.md` §16's original security-isolation rationale, preserved not deleted in Phase 14.4) — only once a real shared-component/auth-library extraction makes it achievable without duplicating `apps/web`'s infrastructure.

---

## How to Use This Roadmap

Nothing above is scheduled or committed — it's a prioritized menu, grounded in real, verified findings rather than speculation, for whoever picks up Phoenix's next phase of work to choose from deliberately. The **Immediate** section is the only genuinely time-sensitive one (it's what's between Phoenix and its first real users); everything else can be sequenced according to real priorities once the platform is live and real usage data exists to inform them.
