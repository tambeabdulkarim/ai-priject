# Restore Point

**Version:** Phase 11.8

**Status:** Stable — Phase 11 closed

**Date:** 2026-08-04

## Current Project State

Phase 11 (E2E test stabilization + the two real bugs it surfaced) is complete and closed. The project is in a clean, stable, fully-documented state.

- E2E test harness in place: worker-scoped role fixtures (`apps/web/tests/e2e/fixtures/roles.ts`), batch execution strategy (`apps/web/tests/e2e/run-batches.js`), real fixture provisioning (`apps/web/tests/e2e/setup/global-setup.ts`). No mocks anywhere in the suite.
- Two real application bugs found and fixed during Phase 11, both verified with no regressions:
  1. Text lesson creation (frontend form gap).
  2. Moderator course visibility (backend authorization gap).
- Phase 11.8 stabilization review performed: every file touched during Phase 11 checked for TODO/FIXME/temporary workarounds/debug code/unused imports/dead code/commented-out experimental code. None found, except one latent test-flakiness pattern (unscoped `getByRole('alert')` in `auth/login.spec.ts`, a known collision class already fixed once elsewhere in Phase 11.5) — fixed for consistency.
- Documentation reviewed for cross-file consistency; one staleness issue found and fixed (`next-session.md` still asked the next session to decide on the moderator-visibility bug, which was already resolved in Phase 11.7.2).

## Resolved Issues (cumulative, Phase 11)

- Text Lesson Creation (`POST /courses/:id/modules/:id/lessons` → `400 "text lessons require body"`). Frontend-only root cause. See `docs/bugfix-text-lesson-body.md`.
- Moderator Course Visibility (`GET /courses/:slug` → `404` for moderators). Backend authorization gap, fixed with a narrow, read-only, least-privilege check. See `docs/phase11.7.2-report.md`.
- Latent `getByRole('alert')` strict-mode collision (test-harness-only), fixed in both known instances (`reset-password.spec.ts`, `auth/login.spec.ts`).

## Remaining Limitations (deferred, not blocking)

- Backend global rate limiter (120 req/min, platform-wide, unmodified) — a real environment characteristic of the shared dev backend, not a code defect. A full, blind E2E suite re-run can still surface transient `429`s; the batch-execution strategy and the fail-fast, clearly-labeled `RATE_LIMITED` error in `helpers/auth.ts` are the harness-level mitigations already in place. See `docs/known-issues.md`.
- The full 44-test E2E suite has not been re-run end-to-end since the two bug fixes; targeted spec runs and direct API verification were used instead (see `docs/phase11-final-closure-report.md` Testing Status section for the rationale).

## Safe Resume Point

Phase 12A — Documentation Canonicalization and Phase 12B — Documentation Freeze are both complete (see `docs/documentation-audit-report.md` and `docs/phase12-documentation-freeze-report.md`). Documentation is frozen; the project is confirmed ready for normal development. No application code changes were made in either Phase 12A or 12B (both documentation-only).

## Restorability

**Recommended starting point:** `docs/documentation-index.md` (added in Phase 12A) — project status, restore points, architecture, API, frontend, backend, testing, deployment, reports, known issues, next session, historical reports, and archive, all in one place. When in doubt about which document is current, that index is authoritative.

**Guaranteed minimum fallback** — if only the following four files survive, this project's Phase 11 state can still be fully reconstructed, with no dependency on conversation history or the index above, by reading them in this order:

1. `docs/project-status.md` — what phase, what's done, current results.
2. `docs/known-issues.md` — what's still open and why.
3. `docs/next-session.md` — what to read first, what decision (if any) is pending.
4. `docs/restore-point-phase11.8.md` (this file) — the authoritative snapshot and pointer to the detailed reports for anyone who needs the full history.
