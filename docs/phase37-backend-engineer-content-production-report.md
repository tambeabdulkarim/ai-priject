# Phase 37 — Backend Engineer Learning Path Content Production Report

**Date:** 2026-08-10/11. **Scope:** execute Phase 35's Backend Engineer recommendation — build the one remaining real gap, create the `backend-engineer` `LearningPath`, and verify the full journey live against the running API. No schema changes, no certificate-rule changes, no business-logic changes.

---

## 1. What existed before Phase 37

Directly queried before writing anything:

- **Courses (real, production):** 6 — Prompt Engineering, AI Foundations, UI/UX Design Foundations, Full-Stack Web Development with Next.js, Computer Networking Foundations, DevOps Foundations (all completed Phases 25–34), plus Programming Foundations (Phase 36).
- **Learning Paths (real, production):** 3 — `prompt-engineer`, `frontend-web`, `devops-engineer`. No `backend-engineer` path existed.
- No course or path matching a plausible "Database Design & SQL Mastery" or "Backend Engineer" existed anywhere in the database.
- Baseline record counts (direct query, `apps/api/count_records.js`, immediately before this phase's seed):
  `{"courses":42,"modules":55,"lessons":149,"quizzes":30,"questions":150,"projects":25,"paths":3,"pathCourses":7,"enrollments":7,"certs":7}`
  (The 42 courses include 35 non-production E2E/test-fixture rows, consistently disclosed and excluded from analysis since Phase 35.)

## 2. Resolving Phase 35's own course-count inconsistency (disclosed, not silently fixed)

`docs/content-library/phase35-learning-path-master-blueprint.md`'s Executive Summary and Section 17 both state Backend Engineer needs **"3 new courses."** But Section 3's own detailed course list only ever names **2 new courses** (Programming Foundations, Database Design & SQL Mastery) plus 3 reused courses (Full-Stack Web Dev, Computer Networking Foundations, DevOps Foundations) = 5 total.

Before writing any seed, this was checked directly against the real database (`apps/api/inspect37.js`, deleted after use): no course or learning path resembling a plausible "3rd new course" exists anywhere. Per the user's own Phase 37 instruction — "don't assume final course names, extract them from the Blueprint + actual content inspection" — this is treated as a real counting error in Phase 35's own document, not an undiscovered architectural gap requiring a stop-and-ask. Programming Foundations (Phase 35's 1st new course) was already built in Phase 36. **That leaves exactly one genuinely new course for Phase 37: Database Design & SQL Mastery.**

This resolution is recorded here, in `apps/api/prisma/seed-phase37-content.ts`'s own header comment, and in `docs/content-library/phase27-content-inventory.md`'s new Backend Engineer section — not silently corrected.

## 3. What was reused

Four courses, unmodified this phase, added as memberships to the new `backend-engineer` path:

| Course | Built | Reused as-is |
|---|---|---|
| Programming Foundations: Problem Solving with Python & JavaScript | Phase 36 | position 1 |
| Full-Stack Web Development with Next.js | Phase 32 | position 3 |
| Computer Networking Foundations | Phase 34 | position 4 |
| DevOps Foundations: CI/CD, Containers & Infrastructure | Phase 31 | position 5 |

No modules, lessons, quizzes, or projects were added to any of these 4 courses. Confirmed by re-running their seeds (Section 6) with 0 new records created.

## 4. What was newly created

### 4.1 Course: Database Design & SQL Mastery (`database-design-sql-mastery`)

Per `docs/content-library/courses.md`'s blueprint entry #11 ("starts from a deliberately bad schema and refactors it live across the course"). Category: `databases` (new `Category` row, `prisma.category.upsert`). Instructor: the `e2e.instructor@phoenix.test` fixture (same convention every prior phase used for new-course creation).

**4 modules, 15 lessons (11 content + 4 quiz), 4 quizzes, 20 questions, 2 projects:**

| Module | Lessons | Quiz questions |
|---|---|---|
| 1. Relational Fundamentals & SQL Querying | What Is a Relational Database?; Writing Real Queries: SELECT/WHERE/Filtering; Combining Data: JOINs Across Tables; Module Review & Final Assessment | 5 (2 single, 1 multiple, 1 true/false, 1 text) |
| 2. Schema Design & Normalization | Designing a Schema: Entities and Relationships; Normalization: Removing Redundancy Without Breaking Things; Foreign Keys and Referential Integrity; Module Review & Final Assessment | 5 (same type mix) |
| 3. Indexing, Performance & Transactions | Indexes: Making Queries Fast; Transactions: All-or-Nothing Operations; Diagnosing a Slow Query; Module Review & Final Assessment | 5 (same type mix) |
| 4. NoSQL & Database Administration Basics | When SQL Isn't the Right Tool: NoSQL Basics; Backups, Migrations, and Basic Database Administration; Module Review & Final Assessment | 5 (same type mix) |

All 20 questions are unique — no repeated prompt, format, or phrasing across the 4 quizzes (verified by direct duplicate-prompt scan, Section 5).

**2 standalone projects** (per this session's established "quality over quantity" precedent, matching `courses.md`'s own description of this course rather than its literal "3 projects" planning figure):
- **Design and Query a Real Schema** (Beginner) — design a real multi-table schema from a stated scenario, write 5 real queries including a JOIN, justify a deletion policy.
- **Refactor a Bad Schema** (Capstone) — given a deliberately bad, unnormalized "orders" table, diagnose its real problems, refactor it fully (normalization, foreign keys, indexing, a transaction example, a migration plan preserving existing data), applying every module together.

**Why this course is necessary for Backend Engineer:** the 4 reused courses teach programming fundamentals, full-stack web development, networking, and DevOps — none of them teach relational schema design, SQL querying, normalization, indexing, or transactions at a foundational, database-design level. Full-Stack Web Dev's own Module 4 lesson ("Databases & ORMs: Persisting Real Data," Phase 32) teaches ORM usage and the N+1 query problem from an *application-developer's* perspective and explicitly assumes the underlying relational-design skill already exists — this course supplies that missing prerequisite skill directly, with no lesson-title or topic overlap (checked directly against Full-Stack Web Dev's real lesson titles before writing this course).

**Skills covered:** relational modeling (entities, relationships, one-to-many/many-to-many), SQL querying (SELECT/WHERE/JOIN), normalization, foreign keys and referential integrity, indexing and query diagnosis (EXPLAIN), transactions, NoSQL tradeoffs, backups and migrations.

### 4.2 Learning Path: Backend Engineer (`backend-engineer`)

No existing path was a real fit — confirmed by direct inspection before writing anything: `devops-engineer` (the closest candidate) only contains Computer Networking Foundations and DevOps Foundations, missing Programming Foundations, Database Design & SQL Mastery, and Full-Stack Web Development with Next.js entirely. A genuinely new path was required, consistent with Phase 35's own Section 21 recommendation.

5 courses linked in Phase 35's specified sequence: Programming Foundations (1) → Database Design & SQL Mastery (2) → Full-Stack Web Development with Next.js (3) → Computer Networking Foundations (4) → DevOps Foundations (5).

## 5. New verified resources

| Resource | Status | Used for |
|---|---|---|
| PostgreSQL Documentation (`postgresql.org/docs`) | 🟢 Reused, live-verified Phase 25 | General SQL reference |
| Prisma Documentation (`prisma.io/docs`) | 🟢 Reused, live-verified Phase 25 | ORM cross-reference |
| "Use The Index, Luke!" (Markus Winand, `use-the-index-luke.com`) | 🟢 **New, live-verified this phase via WebFetch** | Module 3, Indexing lesson |

No book, video, ISBN, or URL was fabricated. `docs/content-library/resource-verification-report.md` updated with the new entry.

## 6. Database results

**Seed run 1** (`node --loader ts-node/esm` via `npx ts-node --transpile-only apps/api/prisma/seed-phase37-content.ts`):
```
Created course: Database Design & SQL Mastery (database-design-sql-mastery)
4 modules created, 15 lessons created, 4 quizzes created, 20 quiz questions created,
2 projects created (0 already existed), 1 learning path created, 5 path memberships created.
```

**Seed run 2** (idempotency check): `0 modules created, 0 lessons created, 0 quizzes created, 0 quiz questions created, 0 projects created (2 already existed), 0 learning path created, 0 path memberships created` — course, modules, projects, path, and memberships all reported "already exists, skipping." **Confirmed idempotent.**

**Record count comparison (direct query, before → after):**

| Field | Before | After | Δ | Matches design |
|---|---|---|---|---|
| courses | 42 | 43 | +1 | ✅ |
| modules | 55 | 59 | +4 | ✅ |
| lessons | 149 | 164 | +15 | ✅ |
| quizzes | 30 | 34 | +4 | ✅ |
| questions | 150 | 170 | +20 | ✅ |
| projects | 25 | 27 | +2 | ✅ |
| paths | 3 | 4 | +1 | ✅ |
| pathCourses | 7 | 12 | +5 | ✅ |
| enrollments | 7 | 7 | 0 | ✅ (learner-journey enrollment came after this snapshot) |
| certs | 7 | 7 | 0 | ✅ (same) |

**Direct duplicate scan** (`apps/api/dupe_check37.js`, deleted after use): module titles, lesson titles (scoped per module), quiz titles, question prompts (scoped per quiz), project titles (scoped per course), course slugs, course titles, and learning-path slugs platform-wide — **zero duplicates found at every level.**

## 7. Cross-contamination check — all prior seeds re-run

Re-ran `seed-phase25`, `26`, `27`, `30`, `31`, `32`, `33`, `34`, `36` (in that order) after Phase 37's seed. Every single one reported 0 new records created — all pre-existing content recognized and skipped via each seed's own idempotency guard. Post-re-run record counts were re-checked and found identical to the post-Phase-37 snapshot above. **Zero cross-contamination.**

## 8. Real learner journey (live API, no mocks)

Executed via direct HTTP calls against the real running backend (`node dist/main.js`, port 4000) — no browser-automation tool available this session, same methodology as every prior content phase.

1. **Login** as `e2e.learner@phoenix.test` — succeeded (one transient 500 on the very first attempt, traced in the server log to a momentary Neon connection drop unrelated to Phase 37's content — succeeded immediately on retry).
2. **Opened the Backend Engineer learning path** (`GET /learning-paths/backend-engineer`) — confirmed all 5 courses present, in the correct sequence.
3. **Opened the course** (`GET /courses/database-design-sql-mastery`) — confirmed all 4 real modules.
4. **Opened modules** — confirmed all 15 real lessons (11 text + 4 quiz), correct titles and content types.
5. **Enrolled** (`POST /enrollments`) — real enrollment created.
6. **Completed all 11 text lessons** (`PUT /progress/lessons/:id`, `progressPercent: 100`) — completion rose to 73% (11/15).
7. **Deliberately wrong answers** on Module 1's quiz — `scorePercent: 0`, `passed: false`. Re-checked course progress: **still 73%**, quiz lesson not marked complete. **Confirmed: a failed attempt does not falsely raise completion.**
8. **Correct answers on all 4 quizzes** — each scored 100%, `passed: true`.
9. **Confirmed 100% completion** (`GET /progress/courses/:id` → `completionPercent: 100`).
10. **Confirmed a brand-new certificate was issued** (`GET /certificates/me` → new `CERT-EC99494AF3B0` for this course/enrollment, `issuedAt` timestamp matching the completion moment).
11. **Re-triggered completion** (re-submitted an already-passed quiz) and re-checked certificates — **still exactly 1 certificate** for this course. **Confirmed: no duplicate certificate on re-trigger.**
12. **Real project submission** (`POST /projects/:id/submissions`, "Design and Query a Real Schema") — real schema design, 5 real SQL queries, deletion-policy justification submitted as `content`.
13. **Learner self-evaluation attempt** (`POST /projects/submissions/:id/evaluate` as the learner) — **`403 FORBIDDEN`, "Not authorized to modify this resource."** Confirmed blocked.
14. **Instructor evaluation** (`POST /projects/submissions/:id/evaluate` as `e2e.instructor@phoenix.test`) — `scorePercent: 92`, `passed: true`, real written feedback — succeeded (`201`).
15. **Confirmed evaluation persisted and re-readable** (`GET /projects/submissions/:id`) — submission `status: "evaluated"`, embedded `evaluation` object with the exact score/passed/feedback from step 14.

**All 15 steps passed exactly as designed. No step was skipped or assumed.**

### Test-harness notes (not content bugs)

Two issues were hit and resolved while running the journey, both harness/environment issues, not defects in the seeded content or application code:
- Two DTO payload shapes had to be discovered from the real DTOs (`progressPercent` not `status` for lesson progress; `answers` as an object keyed by questionId, not an array, for quiz submission; `content` not `submissionUrl`/`notes` for project submission; `scorePercent`/`passed` not `status`/`score` for evaluation) — these are pre-existing API contracts, not something Phase 37 introduced or needed to change.
- An inline `curl -d` invocation mangled em-dashes in the quiz-2 correct-answer payload (shell/codepage encoding, not a real content bug) — the *seeded* `correctAnswer` values always had proper em-dashes; switching to a UTF-8 file body (`curl --data-binary @file`) fixed the test call and scored 100% as expected.

## 9. Test/build results — all actually run

- **Backend tests:** `npm run test` in `apps/api` → **28 suites, 241/241 tests passing.** Unchanged from Phase 36 (no backend logic touched this phase).
- **Backend tsc:** `npm run type-check` → clean, no errors.
- **Backend lint:** `npm run lint` → clean, no errors.
- **Backend build:** `npm run build` → clean, `dist/main.js` produced.
- **Frontend tsc:** `npm run type-check` in `apps/web` → clean, no errors.
- **Frontend lint:** `npm run lint` → clean, "No ESLint warnings or errors."
- **Frontend build:** `npm run build` → clean, all 60 routes built successfully.

**One incidental, pre-existing environment issue found and fixed while starting the server for live verification:** a stale `apps/api/tsconfig.tsbuildinfo` incremental-build cache (left over from a prior session, predating Phase 37) caused both `nest build` and `nest start --watch` to silently believe compilation was already up to date and skip emitting to `dist/` entirely — `dist/main.js` was missing even though the compiler reported "Found 0 errors." Deleting the stale cache and rebuilding resolved it immediately; this is a local dev-environment artifact, not a code or content defect, and required no source changes.

## 10. Real remaining limitations

- The two architecture gaps documented in Phase 35 remain open, unaffected by this phase: `Certificate` has no `learningPathId` (a learner completing all 5 Backend Engineer courses receives 5 separate course certificates, not one path-level certificate — the same limitation every other path has); `Project` has no `learningPathId` (no path-level capstone mechanism exists).
- `nest start --watch` (the normal local dev command) is currently broken by the stale-tsbuildinfo issue described in Section 9 whenever `dist/` and the buildinfo cache fall out of sync — deleting `tsconfig.tsbuildinfo` before running `npm run dev` is the workaround until investigated further. Not touched or "fixed" as a code change this phase, per the instruction not to modify architecture beyond the approved scope — flagged here for visibility.
- 4 of the original 6 named learning paths from Phase 35's blueprint remain unbuilt: Full Stack Engineer, Data Scientist, Cloud Engineer, Cyber Security Analyst. Per Phase 35's priority order, Full Stack Engineer is next and should be the cheapest remaining path to complete, since it shares both of Backend Engineer's new-course needs (Programming Foundations, Database Design & SQL Mastery) with Backend Engineer's own courses.

## 11. Explicitly not started

**Phase 38 was not started.** This phase stops here, per the user's explicit instruction, awaiting approval before any further phase.

---

**Files created:** `apps/api/prisma/seed-phase37-content.ts`, this report, `docs/restore-point-phase37.md`.
**Files updated:** `docs/project-status.md`, `docs/known-issues.md`, `docs/next-session.md`, `docs/documentation-index.md`, `docs/content-library/phase27-content-inventory.md`, `docs/content-library/resource-verification-report.md`.
**Temporary files created and deleted after use:** `apps/api/inspect37.js`, `apps/api/count_records.js`, `apps/api/dupe_check37.js`, `apps/api/get_quiz_ids37.js`.
