# Session Handoff — Phoenix Platform Backend

Status: Snapshot as of this session's pause point. Read this file first when resuming — it is the single source of truth for "where did we stop and what's next."

---

## 1. Current Completion

- **Phases complete: 5 of 13** (Authentication, Users, Sessions/Refresh Tokens, Notifications, Audit Logs query API).
- **By endpoint count:** ~21 of ~74 documented `docs/16-API-CONTRACT.md` endpoints are implemented (~28%).
- **By phase weight:** Phases 6–13 (Courses, Quiz, Library, Marketplace, AI, News, Files, Settings) are the bulk of the remaining surface area and carry more business logic per endpoint than Phases 1–5 did.

Overall: **~30% complete.**

---

## 2. Current Git Status

- **Repository has real history**, but it predates this backend work entirely: the last committed change (`366cf7a`) is a Homepage RTL/hero-section fix, from before the Turborepo monorepo migration.
- **Nothing from Phase 1 onward has ever been committed.** The entire monorepo restructure, all 18 `docs/*.md` files, the full 51-table Prisma schema + 16 migrations, and the complete NestJS `apps/api` backend (Phases 1–5) exist only as **uncommitted working-tree changes**.
- Run `git status` on reopening — expect the same large uncommitted tree (`apps/*`, `packages/*`, `docs/*`, `infra/*`, etc.) that has been accumulating since Phase 1. This has not been an oversight in prior sessions — no commit was ever explicitly requested.
- **Recommendation for next session:** consider committing the current, fully-validated state (Phases 1–5) as an explicit checkpoint before starting Phase 6, so there's a real rollback point. This was not done automatically since committing was never requested.

### Last validated commit
`366cf7a` — Homepage only. **Does not include any backend work.** There is no commit checkpoint for the backend yet; validation for Phases 1–5 was performed against the live working tree (see §6).

---

## 3. Remaining Roadmap (Phases 6–13)

Full detail (API coverage matrix, file-by-file skeleton, complexity estimates) was produced in the prior session's preparation pass and published as an artifact — not duplicated in full here, but the execution order is:

1. **Files & Media** — no blockers. Build first: `Course`/`Lesson`/`LibraryItem`/`Product`/`Certificate` all hold nullable FKs into `File`/`Media`, so every later domain benefits from this existing first.
2. **Categories** (shared taxonomy module, courses/library/marketplace) — no blockers.
3. **Phase 6a — Courses + Lessons** — no blockers for the free-course path.
4. **Phase 9 — Marketplace** (Products, Orders, Order Items, Payments) — no blockers for Products/Orders/Categories; the Stripe webhook's course-entitlement step is blocked on Blocker #1 below.
5. **Phase 6b — Enrollments** — free-course path ships right after step 3; paid-course path blocked on Blocker #1.
6. **Phase 6c — Progress + Certificates** — depends on step 5.
7. **Phase 7 — Quiz System** — depends on step 3 (Lessons); authoring-contract ambiguity noted in Blocker #6.
8. **Phase 8 — Library** — free-item path ready once steps 1–2 exist; paid-item path blocked on Blocker #2.
9. **Phase 10 — AI** — read `docs/12-AI-INTEGRATION-BIBLE.md` §7 first (Blocker #3) before finalizing the request DTO.
10. **Phase 11 — News** (incl. Moderation) — fully independent, can be pulled earlier if desired.
11. **Phase 13 — Settings** — no blockers for Settings CRUD; analytics endpoint has a noted infra deviation (Blocker #7).
12. **Phase 14/15 (cross-cutting)** — once all modules exist, re-run the full validation sequence (§6) across the assembled application.

### Dependency Graph

```
Users/Roles/Permissions (done)
        │
        ▼
      Files ──► Media
        │
        ▼
    Categories
        │
        ▼
     Courses ──► Lessons ──► Quiz System (Questions/Attempts/Results)
        │             │
        │             ▼
        │      Lesson/Reading Progress
        ▼
   Enrollments ◄──────────────── Marketplace (Products/Orders/Order Items/Payments)
        │                              ▲
        ▼                              │
   Certificates                   Library (paid-item path shares the
                                   same entitlement gap as Enrollments)

   AI ─── independent (Users only)
   News ── independent (Users only)
   Settings ── independent (Users only)
```

---

## 4. Known Blockers

1. **Product ↔ Course / LibraryItem linkage undefined** (architectural — needs a decision, same class of issue as the earlier `User_Roles` gap). `Product` has no FK to `Course` or `LibraryItem`; there is no schema path from "user bought this" to "user may access this" for paid courses or paid library items. Blocks: paid-course `Enrollment` creation, the Stripe webhook's entitlement-grant step, and `POST /library/items/:id/access` / `PUT /library/items/:id/progress` for non-free items.
2. **Notification preferences have no storage** — `PATCH /notifications/preferences` (doc16 §17) needs a per-category channel opt-in/out map; no column on `Users`, no `Notification_Preferences` table. Currently a documented `NotImplementedException` stub.
3. **AI per-feature request schemas not yet read** — `docs/12-AI-INTEGRATION-BIBLE.md` §7 governs `CreateAiRequestDto`'s shape and per-feature permission keys; not reviewed yet in this backend work.
4. **Stripe/Storage credentials never populated** — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STORAGE_*` are blank in `.env`/`.env.example` since Phase 1 scaffolding. Payments webhook and file-upload endpoints can be coded but not live-tested until filled.
5. **No job/queue infrastructure** — `POST /admin/media/:id/reprocess` implies an async transcode dispatch; no BullMQ/SQS/etc. exists anywhere (`apps/workers` is still the empty Phase-1 scaffold).
6. **Quiz authoring contract is ambiguous** — doc16 has no `POST /quizzes`/`POST /quiz-questions`; quizzes appear to be authored as a side effect of `Lesson.content_type = 'quiz'`, but the exact request shape isn't spelled out.
7. **Read-replica routing for analytics not provisioned** — `docs/09-PLATFORM-ARCHITECTURE.md` §7 mandates a read replica for `GET /admin/analytics/overview`; only a single Neon primary connection exists.
8. **Permission catalog intentionally incomplete** — only the permission keys already referenced by an implemented endpoint are seeded (10 total). Every Phase 6–13 endpoint's permission key needs the same "is this real architecture or invention" scrutiny before being added to the seed.
9. **`News_Tag_Assignments` still lacks a formal `docs/13-DATABASE-BLUEPRINT.md` entry** (pre-existing Phase 2 gap, previously audited, never fixed — the table itself is fine, only its blueprint documentation is incomplete).
10. **Index/unique/FK constraint naming deviates from `docs/11-DATABASE-BIBLE.md` §2's prescribed convention** (Prisma's default `_idx`/`_key`/`_fkey` suffix pattern vs. the doc's `idx_`/`uq_`/`fk_` prefix pattern) — flagged in an earlier architecture review, no decision made yet (rename vs. amend the doc).
11. **Status/enum columns are missing their `packages/types` mirror** — `docs/11-DATABASE-BIBLE.md` §4 requires valid-value documentation in both a migration comment and `packages/types`; only the Prisma schema doc-comment exists. `packages/types/index.ts` is still empty scaffolding.

None of these require inventing new architecture — each is either a scoped decision needed from you (Blockers 1, 2, 6, 8, 10), an infrastructure fill-in (4, 5, 7), a doc to read (3), or a cleanup task (9, 11).

---

## 5. Important Architectural Notes

- **RBAC chain**: `JwtAuthGuard` → `RolesGuard` → `PermissionsGuard`, global via `CommonModule`. `PermissionsService.getPermissionKeysForUser` is Redis-cached (5 min TTL), invalidated by `RolesService` on role reassignment.
- **Password hashing**: Argon2id + per-install pepper (`PASSWORD_PEPPER` env). Refresh tokens use SHA-256 (deliberately fast — they're high-entropy random secrets, not human-chosen).
- **Session/refresh-token rotation**: reuse of an already-rotated refresh token revokes the entire session family (`docs/10-SECURITY-BIBLE.md` §6). `JwtStrategy` performs a live session-revocation lookup on every authenticated request.
- **Email/SMS delivery, OAuth login, and MFA (TOTP) remain blocked** from the prior session — no email provider credentials, no OAuth-identity table, no TOTP-secret storage anywhere in `docs/13-DATABASE-BLUEPRINT.md`. Don't re-investigate these without new input from you; they were already root-caused.
- **`User_Roles` and the Enrollments `orderItemId` fix are the only two schema changes made since the original Phase 2 database build** — both already audited and approved.
- **`apps/workers` and `apps/admin` are still empty Phase-1 scaffolds** — nothing to preserve/worry about there yet.
- **No file in this backend work has ever been committed to git** — see §2. Treat the working tree as the only copy until a commit happens.

---

## 6. Validation Results (this session)

All run against the live working tree immediately before this handoff was written:

| Check | Result |
|---|---|
| `npm install` (workspace root) | ✅ clean |
| `prisma generate` | ✅ clean |
| `tsc --noEmit` | ✅ 0 errors |
| `tsc --noEmit --noUnusedLocals --noUnusedParameters` (extra sweep for this cleanup pass) | ✅ 0 findings — no unused imports/locals anywhere |
| `nest build` | ✅ clean, `dist/` populated |
| `jest` | ✅ 17/17 tests passing |
| Stale/TODO/debug-log sweep | ✅ no `TODO`/`FIXME`/`console.log` found; one stale comment (`users.repository.ts` header, referenced a since-completed "Phase 3 business-logic pass" deferral) found and corrected — this was the only cleanup needed |

**Note on `nest build`:** a prior session hit a silent-failure mode where a stale `tsconfig.tsbuildinfo` incremental-build cache caused `nest build` to exit 0 with zero files emitted. This session's build explicitly deleted that cache file first and confirmed real output — if `dist/` ever looks stale or empty after a clean-looking build, delete `apps/api/tsconfig.tsbuildinfo` and rebuild.

---

## 7. Next Command to Execute After Reopening

```bash
cd apps/api
npx prisma generate   # regenerate the client against node_modules (fast, always safe)
npx tsc --noEmit -p tsconfig.json   # confirm still clean before touching anything
```

Then begin the **first concrete task**, per the roadmap in §3: create the Files module skeleton —

```
apps/api/src/modules/files/files.repository.ts
```

starting with `create`, `findById`, and `updateScanStatus` methods against the existing `File`/`Upload` Prisma models (no schema changes needed — both tables already exist and are fully migrated). Follow the same repository → service → controller → DTO layering used in every Phase 1–5 module.

---

## 8. Clean Handoff Confirmation

The repository is in a **clean handoff state**:
- No feature implementation, refactoring, schema edits, or migrations occurred in this pass — only comment cleanup and validation.
- `npm install`, `prisma generate`, `tsc --noEmit`, `nest build`, and `jest` all pass with zero errors.
- No stray debug artifacts, TODOs, or console logs remain in `apps/api/src`.
- This document, plus the Phase 6–13 preparation report from the prior pass, contain everything needed to resume without re-deriving context.

Ready for continuation without additional preparation.
