# Restore Point — Phase 36 (Frontend Engineer Learning Path Completion)

**Date:** 2026-08-10 · **Type:** Real content production + one learning-path membership addition, executing Phase 35's blueprint. No schema changes, no application code changes (`apps/api/src`, `apps/web/src` both untouched). Zero regressions: 241/241 backend tests unchanged, both builds clean, seed run twice with 0 duplicates on the second run, all 8 prior content/path seeds re-confirmed idempotent.

## What this phase was

Executed Phase 35's exact recommendation for the Frontend Engineer path: build the 1 missing course (Programming Foundations: Problem Solving with Python & JavaScript) and reuse the 2 already-real, already-production-ready courses (UI/UX Design Foundations, Full-Stack Web Development with Next.js) — no new architecture, no duplicate course.

## What's new

- **New course: Programming Foundations: Problem Solving with Python & JavaScript** — 4 modules (Programming Basics; Functions & Program Structure; Data Structures; Object-Oriented Basics, Git & Testing Fundamentals), 16 lessons, 4 quizzes (20 questions), 2 standalone projects. Scoped deliberately to teach universal, language-agnostic programming concepts primarily through Python — confirmed, by direct lesson-title comparison, not to duplicate Full-Stack Web Dev's existing JavaScript & TypeScript Fundamentals module (Phase 32).
- **New file:** `apps/api/prisma/seed-phase36-content.ts` — additive only.
- **The existing "frontend-web" `LearningPath`** (not a new path) now has 3 courses instead of 2 — Programming Foundations added at position 0, ahead of the 2 existing, completely untouched course memberships.
- **3 new, live-verified resources**: Official Python Documentation (reused from Phase 35), Official Git Documentation, Python's official `unittest` module documentation.

## Key design decision (documented, not silently made)

Phase 35 identified "Frontend Engineer" as needing 1 new course + 2 reused courses, and separately confirmed only 3 real `LearningPath` rows exist, none named "Frontend Engineer." The existing `frontend-web` path (created Phase 26) already contains exactly the same 2 reused courses Phase 35 identified. Rather than creating a second, confusingly-overlapping `LearningPath` row, this phase added the new course to the existing `frontend-web` path — reusing existing architecture per this phase's own explicit instruction, and consistent with Phase 26's own description of that path as covering "Frontend Engineer / Full Stack Engineer."

## Numbers

1 new course, 4 new modules, 16 new lessons (12 content + 4 quiz), 4 new quizzes, 20 new questions, 2 new projects, 1 new `LearningPathCourse` membership.

## Validated, not assumed

- Idempotency: `seed-phase36-content.ts` run twice — second run created 0 new records at every level (course, modules, lessons, quizzes, questions, projects, path membership). All 8 prior content/path seeds (`seed-phase25` through `seed-phase34`) re-run afterward — every one still fully idempotent, zero duplicates, confirming zero disruption anywhere in the platform.
- Record counts directly queried before/after: courses 41→42, modules 51→55, lessons 133→149, quizzes 26→30, questions 130→150, projects 23→25, `LearningPathCourse` 6→7 — exactly matching the seed script's own reported counts.
- **Direct duplicate-content database checks**: zero duplicate module/lesson/quiz/project titles or question prompts within the new course, and zero duplicate course titles platform-wide (42 total). **Cross-course overlap check**: directly compared the new course's lesson titles against Full-Stack Web Dev's existing "JavaScript & TypeScript Fundamentals" module lesson titles — confirmed no overlap.
- `tsc`, `eslint`, backend build, frontend build: all clean, both apps (frontend build completed in the background after exceeding the foreground timeout — its complete output was read and confirmed). Backend tests: 241/241, unchanged from Phase 34.
- **Live, real, end-to-end learner journey, all 16 requested steps**: login → opened the "frontend-web" learning path, confirmed Programming Foundations now appears first (position 0) → course opened, all 4 modules/16 lessons confirmed live → enrolled for real → lesson content fetched and confirmed correctly returned → all 12 non-quiz lessons marked complete (75%) → Module 1's quiz submitted with deliberately wrong answers — scored 0%/failed, a real `QuizAttempt` was recorded, completion confirmed unchanged (no false-positive completion) → the same quiz then submitted with correct answers — scored 80%/passed, a new `QuizAttempt` recorded → all 4 quizzes passed → **completion reached 100% (16/16)** entirely through the real flow → a **brand-new certificate was issued** → re-marking an already-complete lesson confirmed certificate-issuance idempotency (count stayed at exactly 1) → a real project submitted → learner confirmed blocked (403) from self-evaluation → the real owning instructor viewed and evaluated it for real → the evaluation was confirmed persisted on re-fetch.

## Discipline maintained from prior phases

No content duplicated. No resource fabricated — all 3 cited resources were live-verified via `WebFetch` before citing (2 new this phase, 1 reused from Phase 35). No architectural change was needed or made — the existing `LearningPath`/`LearningPathCourse`/`Course` architecture already supported everything this phase needed, including adding a course to an already-populated path (via a per-course existence check, not the whole-path guard Phase 26's own seed used when the path was first created — documented explicitly in the new seed file's own header comment so a future reader understands why a different guard pattern was needed).

## How to resume

Read `docs/phase36-frontend-engineer-content-production-report.md` in full. `docs/content-library/phase27-content-inventory.md` is updated to reflect the new course and the Frontend/Web path's new 3/3-course status. **Explicitly stopped: not beginning Phase 37, awaiting approval.**
