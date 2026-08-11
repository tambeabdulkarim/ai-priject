# Restore Point

**Version:** Phase 13.8

**Status:** Test-data marking mechanism added (`User.isTestData`); a real, pre-existing migration-history gap discovered and fixed along the way

**Date:** 2026-08-05

## Current Project State

Following Phase 13.7 (Backblaze B2 live verification), a leftover test user (`storage-verify-*@example.test`) and its associated `File`/`Media`/audit-log rows remained in the real database, indistinguishable from real user data. Rather than delete them (no cascade-delete path from `User`; deleting audit-log rows would conflict with this project's audit-log-preservation principle), a reusable marking mechanism was added instead.

- **Schema check performed first (no migration until justified):** confirmed no existing mechanism could do this without a migration — no JSONB/metadata column on `User`, no environment/seed/test enum anywhere across all 49 models. The only `Json` columns in the schema are domain-specific payloads (`QuizQuestion.options`/`correctAnswer`, `QuizAttempt.answers`, `AuditLog.beforeState`/`afterState`, `Log.context`), not generic metadata bags.
- **Field name evaluated against alternatives**, not just asserted: `isQA` (too narrow — this covers ad hoc engineering verification too, not just a QA function), `isDemo` (wrong category — demo accounts may be deliberately kept for sales/product purposes, unlike disposable test rows), `isAutomation` (too narrow — this row came from a manual verification script, not CI), reusing the project's existing "seed" vocabulary (rejected — `prisma/seed.ts`'s Roles/Permissions/etc. are legitimate reference data that should never be bulk-deleted, a different concept from disposable test-run artifacts, and conflating the two words would be a real footgun), a `source` string/enum (rejected as speculative generality per `engineering-standards` §2 — no second real value exists today). **`isTestData` chosen** — correctly scoped, matches the project's existing `isX`/`is_x` boolean convention (`isSystemRole`, `isActive`, `isDefault`, `isSensitive`, `isPreview`).
- **Scope decision:** added to `User` only, not duplicated across other tables. `File.uploadedById`, `AuditLog.actorUserId`, and (two hops, via `File`) `Media` are all reachable from a `User` row via existing, already-indexed foreign keys — so test-status for any of those rows is derived by joining back to `User.isTestData`, not stored redundantly. Single source of truth per `engineering-standards` §3; avoids a 49-table migration for a fact derivable from one place.
- **Not exposed in any API/DTO** — schema/database-only, by explicit instruction, until an actual admin-facing need justifies exposing it.
- **Migration added:** `apps/api/prisma/migrations/20260805064713_add_user_is_test_data/migration.sql` — `ALTER TABLE "auth"."users" ADD COLUMN "is_test_data" BOOLEAN NOT NULL DEFAULT false;`. Purely additive, metadata-only on Postgres 11+ (no table rewrite, no downtime).

## Real, pre-existing gap discovered and fixed while applying this migration (unrelated to test-data marking itself)

`prisma migrate status` reported all 18 prior migrations as "not yet applied" against the live Neon database — but direct inspection (`information_schema.tables`/`columns`) confirmed the database already had all 51 tables with exactly the columns `schema.prisma` expects. The `_prisma_migrations` bookkeeping table itself didn't exist. Conclusion: this database's schema was originally provisioned via `prisma db push` at some point, not `prisma migrate deploy` — the schema was never drifted or wrong, only the migration *history* was never recorded.

Applying `prisma migrate dev`/`deploy` as-is would have tried to re-run all 18 migrations' SQL against tables that already existed, failing on the very first one (`relation "users" already exists`) and risking a half-written `_prisma_migrations` state. **Flagged to the user before proceeding** (this was outside the originally approved scope of "add the field, create the migration"), approved, then fixed via Prisma's documented baselining procedure: `prisma migrate resolve --applied <name>` for each of the 18 existing migrations — metadata-only, no SQL executed, no data touched. Confirmed via `prisma migrate status` → "Database schema is up to date!" before adding the new migration.

**Going forward:** use `prisma migrate dev`/`deploy` consistently for schema changes, not `prisma db push`, to avoid this recurring.

## Retroactive tagging

The existing `storage-verify-*@example.test` user (`id: 019fd091-c06c-7361-8398-f1cdef1316b0`) was tagged: `isTestData` confirmed `false` before, `updateMany` matched 1 row, re-queried after and confirmed `isTestData: true`. Its associated `File`/`Media`/`AuditLog` rows were not individually updated — they remain identifiable via the join-based design above.

## Regression check

Full backend suite re-run after the schema change and Prisma Client regeneration (had to stop a still-running backend process first — it was locking the Prisma query-engine binary, same recurring class of issue as Phase 13.6/13.7's `tsconfig.tsbuildinfo` cache problem, different file): **22/22 test suites, 166/166 tests still passing.** Grepped `apps/api/src` for `isTestData` — zero references, confirming it is not referenced or exposed anywhere in application code.

## Remaining Limitations (unchanged from Phase 13.7, not affected by this work)

1. Docker cannot run containers in this environment (WSL2 not installed, requires administrator elevation) — unresolved, no longer blocks Storage (moved to B2).
2. Real bucket-privacy ACL and real signed-URL-expiration enforcement against B2 specifically remain unverified live.
3. Real storage performance against B2 remains unmeasured.
4. `completeUpload` reports a generic "unrecognized file type" `400` for storage-connectivity failures too (cosmetic).
5. No malware-scanning engine exists (`File.scanStatus` never leaves `'pending'`).
6. Backend global rate limiter (120 req/min) — unchanged, pre-existing.
7. The `storage-verify-*` test user's underlying `File`/`Media`/`AuditLog` rows remain in the database (by design — now identifiable via the join, not deleted; deleting them was never the goal after this phase).
8. `docs/phase-14-plan.md`'s documentation-reconciliation and Admin-MFA recommendations remain the next real work — unaffected by this phase, still open.

## Safe Resume Point

Phase 13 remains closed. This phase (13.8) was incidental test-data hygiene discovered as a side effect of 13.7's live verification, not a new phase of platform work. Proceed per `docs/phase-14-plan.md` next: documentation reconciliation, then Admin MFA.

## Restorability

**Recommended starting point:** `docs/documentation-index.md`, then `docs/phase-14-plan.md`.

**Guaranteed minimum fallback** — if only the following four files survive:

1. `docs/project-status.md` — current phase (13.8, complete), what's done, next candidate (Phase 14 per `phase-14-plan.md`).
2. `docs/known-issues.md` — "Test-Data Marking (`User.isTestData`)" entry with the naming-evaluation table and the migration-history baselining discovery; "Object Storage — RESOLVED" entry from 13.7.
3. `docs/next-session.md` — what to read first, the decision point (documentation reconciliation → Admin MFA).
4. `docs/restore-point-phase13.8.md` (this file) — the authoritative snapshot.
