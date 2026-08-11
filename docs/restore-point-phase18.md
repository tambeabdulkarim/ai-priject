# Restore Point

**Version:** Phase 18 (Release Verification & Dry Run — Final Launch Validation)

**Status:** Complete. **Final Decision: 🟡 GO WITH CONDITIONS.** Live, end-to-end verification across 8 domains; exactly one genuine launch-blocking finding, fixed live with proof; everything else documented per the phase's explicit "verify, don't fix unless truly launch-blocking" rule.

**Date:** 2026-08-06

## What This Phase Was

The seventh thread in this project's session history — not development, a rehearsal. Five parallel, independent live-verification passes (Frontend, Security, Database, Documentation-accuracy, and a newcomer dry-run of the Phase 17 deployment guide) plus a live, browser-driven E2E pass across all four user roles and a live API sweep, both run directly rather than delegated. The full report is **`docs/phase18-release-verification-report.md`** — this restore point summarizes it and records the one fix made and why.

## What Was Verified (all live, not simulated)

- **End-to-end user journeys**, all 4 roles, real browser automation against the real running app: Learner (register/login/browse/orders/certificates/notifications/logout), Instructor (login/dashboard/course-creation/media), Moderator (login/queue), Admin (dashboard/users/audit-logs/settings). Two apparent failures in the first pass were investigated and found to be test-harness timing bugs, not product bugs — both directly reproduced as working correctly on a careful re-run. Seven more were this session's own accumulated login rate-limiting (the real `@Throttle` limiter working as designed) — all 7 passed on retry after the window cleared.
- **API surface** — live `curl` sweep, one token, 11 endpoint categories, all 200.
- **Frontend** — 8 areas, 7 PASS, 1 real confirmed FAIL (dark mode toggle is decorative, not functional — directly measured via computed styles and pixel comparison, not assumed).
- **Security** — 9 live checks, all PASS, zero regression from Phase 15/16.
- **Database** — 5 live checks against the real Neon DB, all PASS (indexes, constraints, migration status, relations, no migration conflicts).
- **Documentation accuracy** — 5 cross-checks against real code, all PASS.
- **Deployment guide newcomer dry-run** — found the one real launch-blocking issue (below), plus 3 lower-priority documentation gaps.

## The One Fix Made

**`.gitignore` did not cover `.env.production`** (only 5 exact filenames were listed: `.env`, `.env.local`, `.env.development.local`, `.env.test.local`, `.env.production.local` — none matches the common `.env.production` convention many hosting guides suggest). `docs/phase17-deployment-launch-guide.md` had explicitly (and, this phase found, incorrectly) told readers this was "safe by construction." Left as-is, this was a real, live path to committing production secrets during the exact launch process this phase rehearses.

**Fix:** added `.env.*` with a `!.env.example` negation to `.gitignore`. Verified before and after with `git check-ignore -v`:
- `apps/api/.env` → still correctly ignored (pre-existing pattern, unaffected).
- `apps/api/.env.example` / `apps/web/.env.example` → confirmed still tracked, NOT ignored (the negation works).
- A test file `apps/api/.env.production` → confirmed now correctly ignored (the actual gap, now closed), then deleted.

This is the only file this phase modified. Every other finding — including three more real ones in the deployment guide itself, and the confirmed dark-mode defect — is documented, not fixed, per the phase's explicit addendum.

## Validation

- `npm test --workspace=apps/api` — **209/209 passing**, 26/26 suites (unchanged from Phase 16/17 — the one change this phase made was a `.gitignore` line, which cannot affect test outcomes).
- No `tsc`/lint/build re-run was needed — no source code was touched.

## Real Findings From This Phase's Own Work

1. **Dark mode toggle confirmed non-functional** — suspected since Phase 14.6B, never directly measured until now. Directly confirmed via computed-style and pixel-screenshot comparison before/after clicking: zero change. Real, user-facing, not launch-blocking (misleading, not dangerous).
2. **`.gitignore` gap** — found and fixed (above).
3. **Deployment guide's monorepo root-directory configuration is undocumented** — the single most likely real stall point for a newcomer following the Phase 17 guide on Vercel/Railway, both of which need an explicit service-root setting for a Turborepo monorepo that the guide never mentions.
4. **`apps/workers/package.json` has no `start` script**, despite the guide implying Railway/Nixpacks could run it as a second service — irrelevant today (workers is an intentional empty shell) but would surface immediately if someone tried to actually stand it up as described.
5. **The guide overstates a documentation cross-reference** (implies the P2034 payment race is written up in `known-issues.md` the way the migration-baselining incident is; it isn't — it's a code comment + test only). The underlying handling is real and correct; only the guide's framing is slightly off.

## Architecture Review

No architecture changes. The one fix (`.gitignore`) is infrastructure-hygiene, not application logic.

## Remaining Risks

Carried over, unaffected, from Phase 16/17: 27 unpatched dependency findings (1 Critical), no CD workflow, CI unverified on a real GitHub push, unbuilt async Notification email channel, no APM/crash reporting, no real Postmark production credentials, certificates have no real PDF generation. New from this phase, all documented in `docs/phase18-release-verification-report.md`'s Remaining Issues: `vercel.json` still stale (found in Phase 17, re-confirmed, still not fixed — deliberately, out of verification scope), the deployment guide's monorepo-config gap, the confirmed dark-mode defect, two unconfirmed frontend observations (header clipping, blank-page-on-auth-failure).

## Safe Resume Point

Per the phase's closing instruction, **wait for approval before Phase 19.** Per the report's own Final Decision — **🟡 GO WITH CONDITIONS** — and its explicit statement: **Phoenix v1.0's core development is complete.** Any phase after this one is v1.1-and-beyond work (launch execution, deferred dependency upgrades, Candidate D, the visual-polish thread's remaining items, or genuinely new features), not completion of the base version.

## Restorability

**Recommended starting point:** `docs/documentation-index.md` → `docs/project-status.md`'s Current Phase section → `docs/phase18-release-verification-report.md` (the complete verification report and Final Decision) → this file.

**Guaranteed minimum fallback:**
1. `docs/phase18-release-verification-report.md` — the complete 8-domain verification report, release checklist results, Final Decision (🟡 GO WITH CONDITIONS), and Launch Confidence section.
2. `docs/project-status.md` — current phase and pointer to the report.
3. `docs/known-issues.md` — newly-confirmed findings folded into the existing structure.
4. `docs/next-session.md` — the real next decision points.
