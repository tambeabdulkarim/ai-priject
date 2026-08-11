# Restore Point — Phase 21 Production Smoke Test & Launch Automation

**Date:** 2026-08-06 · **Type:** Implementation + documentation. New scripts and docs only — no business logic, API contract, database schema, or UI changed. Verified via `git status`: pre-existing modified files (accumulated from earlier phases, still uncommitted) are unchanged by this phase; this phase's diff is additive-only.

## Naming collision, flagged (fourth occurrence)

This is the **fourth** deliverable filed under "Phase 21" in this session, after `phase21-v1.1-roadmap.md`, `phase21-launch-preparation.md`, and the production-infrastructure-preparation pass (`restore-point-phase21-infra-prep.md`). Filed here as **`restore-point-phase21-smoke-test.md`** to avoid overwriting any of the three prior restore points. All four are siblings covering complementary territory (v1.1 strategy / pre-deployment checklist / infra templates / this phase's runnable smoke-test + automation tooling); none supersedes another. Recommend the next session start phase numbers fresh (e.g. "Phase 22") to stop this pattern.

## What this phase was

Built real, runnable launch-automation tooling — not just documentation — so a deployment operator's remaining work is executing a fixed sequence rather than making engineering decisions.

## Files created

- `scripts/production-smoke-test.js` — standalone Node script, PASS/FAIL/WARN per check across Frontend/Backend/Database/Storage/Notifications/Certificates/Payments/AI/Security/Authentication. Read-only by default; `--deep` mode (with fixture credentials) additionally exercises login/session/refresh/logout and guard checks. Never places a real order, calls a real AI provider, or fabricates a result.
- `scripts/verify-deployment-readiness.js` — orchestrates build → env-var presence check → DB validation → health check → smoke test → summary, reusing existing project scripts (Turbo build, Jest, Prisma CLI) rather than reimplementing them.
- `docs/launch-automation-package.md` — documents both scripts and exactly what's reused vs. new.
- `docs/production-checklist.md` — provider-specific checklist (Domain/DNS/SSL/Vercel/Railway/Postmark/Neon/Backblaze/env vars/security headers/monitoring/backups/recovery), each item a real requirement, cross-referencing rather than duplicating `docs/deployment-checklist.md`.
- `docs/handover-guide.md` — written for a technical operator with zero project knowledge: prerequisites, accounts, credentials, deployment order, post-deployment validation, rollback steps, an emergency-contacts placeholder table, and known risks.
- `docs/production-verification-report-template.md` — a fillable per-deployment report template, plus a worked example from this phase's own local validation run (explicitly labeled local, not a production claim).
- `docs/restore-point-phase21-smoke-test.md` — this file.

## Validation results (real, executed this phase)

- **Backend build:** clean (`npm run build --workspace=apps/api`, `nest build`, zero errors).
- **Backend tests:** **209/209 passing**, 26/26 suites — zero regressions from this phase's work (no application code was touched).
- **Frontend build:** clean (`npm run build --workspace=apps/web`, all routes compiled).
- **Smoke test executed against a real local environment:** `node scripts/production-smoke-test.js` run against a live backend (`localhost:4000`) and a real `next build`+`next start` production-mode frontend. Final result: **17 PASS, 7 WARN, 0 FAIL — overall PASS WITH WARNINGS.**

## A real finding surfaced during validation (investigated, not just reported)

The first smoke-test run (against a long-running `next dev` instance left over from earlier in this session) showed the homepage returning HTTP 500. Per this project's established discipline of investigating apparent failures before reporting them (Phase 18 did the same for two E2E false negatives), this was not accepted at face value: a fresh, real production-mode build (`next build` + `next start`) was tested directly and correctly returned HTTP 307 (the expected locale redirect). Root cause: a `next dev`-only artifact from a stale watch-mode process, not a real application defect. This distinction is recorded in `docs/production-verification-report-template.md`'s worked example so it isn't lost, and demonstrates the smoke-test tooling catching a real discrepancy worth investigating — exactly its intended purpose.

## Regression results

Zero regressions. No file under `apps/api/src`, `apps/web/src`, or `prisma/schema.prisma` was modified this phase — confirmed via `git status` before and after this phase's work. All new files are additive: two root-level scripts, one root-level `deployment/` folder (from the prior phase, untouched this phase), and the documentation listed above.

## Remaining launch blockers

Unchanged in substance from `docs/phase21-launch-preparation.md` and the infra-prep phase — this phase did not remove or add any external/owner-side blocker, it made verifying a real deployment, once one exists, faster and less error-prone. See `docs/launch-package.md` for the current consolidated list.

## Engineering recommendation

The engineering side of launch preparation is now complete across all four "Phase 21" passes: strategy (`phase21-v1.1-roadmap.md`), operational checklist (`phase21-launch-preparation.md`), infrastructure templates (`.env.production.example` etc.), and now runnable verification tooling (this phase). **No further engineering preparation is needed before a real deployment.** The remaining work is entirely the owner executing `docs/handover-guide.md` / `docs/production-readme.md`'s steps with real credentials, then running `scripts/production-smoke-test.js` against the real result.

## How to resume

Read `docs/handover-guide.md` first if picking this up as the deployment operator; read this restore point and `docs/launch-automation-package.md` first if picking it up as engineering. **Explicitly stopped, per this phase's own instruction: waiting for approval before any deployment phase.**
