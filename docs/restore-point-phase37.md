# Restore Point — Phase 37 (Backend Engineer Learning Path Production)

**Date:** 2026-08-10/11 · **Type:** Real content production + one new `LearningPath`, executing Phase 35's blueprint (with a disclosed, verified correction to Phase 35's own course-count error). No schema changes, no application code changes (`apps/api/src`, `apps/web/src` both untouched). Zero regressions: 241/241 backend tests unchanged, both builds clean, seed run twice with 0 duplicates on the second run, all 9 prior content/path seeds re-confirmed idempotent.

## What this phase was

Executed Phase 35's Backend Engineer recommendation: build the 1 remaining new course (Database Design & SQL Mastery), reuse the 4 already-real, already-production-ready courses (Programming Foundations, Full-Stack Web Development with Next.js, Computer Networking Foundations, DevOps Foundations), and create a genuinely new `backend-engineer` `LearningPath` (no existing path was a real fit — confirmed by direct inspection).

## What's new

- **New course: Database Design & SQL Mastery** — 4 modules (Relational Fundamentals & SQL Querying; Schema Design & Normalization; Indexing, Performance & Transactions; NoSQL & Database Administration Basics), 15 lessons (11 content + 4 quiz), 4 quizzes (20 questions), 2 standalone projects (Design and Query a Real Schema — Beginner; Refactor a Bad Schema — Capstone). Scoped to teach relational schema design and SQL directly, from a database-design perspective — confirmed, by direct comparison against Full-Stack Web Dev's existing "Databases & ORMs" lesson, not to duplicate it (that lesson teaches ORM usage at an application-developer level and assumes this course's skills already exist).
- **New file:** `apps/api/prisma/seed-phase37-content.ts` — additive only.
- **New `LearningPath`: `backend-engineer`** — 5 courses in sequence: Programming Foundations (1) → Database Design & SQL Mastery (2) → Full-Stack Web Development with Next.js (3) → Computer Networking Foundations (4) → DevOps Foundations (5).
- **1 new, live-verified resource**: "Use The Index, Luke!" (Markus Winand) — cited in the Indexing lesson. 2 resources reused (PostgreSQL Docs, Prisma Docs — both live-verified Phase 25).

## Key design decision (documented, not silently made)

Phase 35's own Executive Summary/Section 17 stated Backend Engineer needs "3 new courses," but its own detailed Section 3 course list only ever named 2 (Programming Foundations, Database Design & SQL Mastery). Confirmed by direct database inspection before writing anything: no plausible "3rd new course" exists anywhere. Treated as a genuine counting error in Phase 35's own document (per the user's own instruction to extract course names from the Blueprint + actual content inspection, not assume them) — not an undiscovered architectural gap. Since Programming Foundations was already built in Phase 36, this leaves exactly one genuinely new course for Phase 37. Full reasoning in `docs/phase37-backend-engineer-content-production-report.md` Section 2 and in the seed file's own header comment.

A second decision: unlike Phase 36 (which added a course to an *existing* `frontend-web` path), Backend Engineer required a genuinely *new* `LearningPath` row — confirmed by direct inspection that `devops-engineer` (the closest existing candidate) is missing 3 of the 5 required courses entirely. This follows Phase 26's original whole-path-membership-guard pattern (safe here since it's a brand-new path with zero prior memberships), not Phase 36's per-course-membership guard (which was needed there specifically because that path already had partial memberships).

## Numbers

1 new course, 4 new modules, 15 new lessons (11 content + 4 quiz), 4 new quizzes, 20 new questions, 2 new projects, 1 new `LearningPath`, 5 new `LearningPathCourse` memberships.

## Validated, not assumed

- Idempotency: `seed-phase37-content.ts` run twice — second run created 0 new records at every level (course, modules, lessons, quizzes, questions, projects, path, memberships). All 9 prior content/path seeds (`seed-phase25` through `seed-phase36`) re-run afterward — every one still fully idempotent, zero duplicates, confirming zero disruption anywhere in the platform.
- Record counts directly queried before/after: courses 42→43, modules 55→59, lessons 149→164, quizzes 30→34, questions 150→170, projects 25→27, paths 3→4, `LearningPathCourse` 7→12 — exactly matching the seed script's own reported counts.
- **Direct duplicate-content database checks**: zero duplicate module/lesson/quiz/project titles or question prompts within the new course, zero duplicate course titles/slugs platform-wide (43 total), zero duplicate learning-path slugs.
- `tsc`, `eslint`, backend build, frontend build: all clean, both apps. Backend tests: 241/241, unchanged from Phase 36.
- **Live, real, end-to-end learner journey, all 15 requested steps**: login → opened the new "Backend Engineer" path, confirmed all 5 courses in correct sequence → course opened, all 4 modules/15 lessons confirmed live → enrolled for real → all 11 non-quiz lessons marked complete (73%) → Module 1's quiz submitted with deliberately wrong answers — scored 0%/failed, completion confirmed unchanged at 73% (no false-positive completion) → the same quiz resubmitted with correct answers — scored 100%/passed → all 4 quizzes passed at 100% → **completion reached 100% (15/15)** entirely through the real flow → a **brand-new certificate was issued** (`CERT-EC99494AF3B0`) → re-triggering the completion path confirmed certificate-issuance idempotency (count stayed at exactly 1 for this course) → a real project submitted (real schema design, 5 real SQL queries, deletion-policy justification) → learner confirmed blocked (403 FORBIDDEN) from self-evaluation → the real owning instructor evaluated it for real (92%, passed) → the evaluation was confirmed persisted and re-readable on a later fetch.

## Discipline maintained from prior phases

No content duplicated. No resource fabricated — the 1 new cited resource was live-verified via `WebFetch` before citing. No architectural change was needed or made — the existing `LearningPath`/`LearningPathCourse`/`Course` architecture already supported everything this phase needed. The two Phase 35 architecture gaps (no `learningPathId` on `Certificate` or `Project`) remain open, unaffected, undisclosed-as-fixed.

## Incidental environment fix (not a scope change)

While starting the backend server for live verification, found and fixed a stale `apps/api/tsconfig.tsbuildinfo` incremental-build cache (pre-existing, unrelated to Phase 37's content) that caused `nest build`/`nest start --watch` to silently skip emitting to `dist/`. Deleting the stale cache file resolved it. No source code was changed; flagged in the production report's Limitations section for visibility since `npm run dev` may hit the same issue again if the cache goes stale in a future session.

## How to resume

Read `docs/phase37-backend-engineer-content-production-report.md` in full. `docs/content-library/phase27-content-inventory.md` is updated to reflect the new course and the new Backend Engineer path's 5/5-course status. **Explicitly stopped: not beginning Phase 38, awaiting approval.**
