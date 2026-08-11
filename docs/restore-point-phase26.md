# Restore Point — Phase 26 (Learning Path & Project Evaluation Architecture)

**Date:** 2026-08-09 · **Type:** Real schema + backend implementation. Closes exactly the two architecture gaps Phase 25 documented — nothing else touched. Zero regressions: 209 pre-existing backend tests still pass, frontend build clean, all pre-existing data byte-for-byte preserved after migration.

## What this phase was

Designed and implemented the minimum stable architecture for `LearningPath` and `Project`/`ProjectSubmission`/`ProjectEvaluation`, following the codebase's own existing conventions throughout (ownership-OR-editorial authorization via the existing `isOwnerOrRole` utility, thin repositories, audit logging, cursor pagination, slug generation) rather than inventing a new style.

## What's new

- **Schema:** `LearningPath`, `LearningPathCourse` (join table with position + duplicate-membership unique constraint), `Project`, `ProjectSubmission`, `ProjectEvaluation` — 5 new tables, one migration (`20260809081651_add_learning_paths_and_project_evaluation`), purely additive.
- **Backend modules:** `learning-paths` and `projects` (both full DTO/repository/service/controller/module, registered in `app.module.ts`).
- **API contract:** `docs/16-API-CONTRACT.md` §20–21, written before implementation per this codebase's own established convention.
- **Authorization:** 2 new permission keys (`learning_path:create`, `learning_path:publish`, content_editor/admin) added to `seed.ts`'s existing catalog; everything else (project creation, publishing, grading, submission visibility) reuses existing ownership-OR-editorial/moderator-read-only utilities with zero new permission keys — a deliberate consistency decision, explained in the report's Section 7.
- **Seed:** `seed-phase26-content.ts` — creates the 3 real learning paths (Prompt Engineer, Frontend/Web, DevOps Engineer) from Phase 25's already-real courses, and links (never copies) the 6 existing Phase 25 project-brief Lessons to new `Project` rows via a nullable, unique `sourceLessonId`.
- **Tests:** 21 new unit tests (7 `learning-paths.service.spec.ts`, 14 `projects.service.spec.ts`) covering authorization, duplicate prevention, enrollment requirements, and the submission/evaluation state machine — all passing alongside the pre-existing 209.

## The core design decision, stated plainly

**No content was duplicated.** `Project.instructions` is `null` for every one of the 6 linked projects — the brief's full text stays exactly where Phase 25 put it, in `Lesson.body`, unchanged (verified: same byte length before and after). `Project` only adds the tracking capability (submission, evaluation) that didn't exist before. Verified live: a real learner submitted a real project via the running API, a real instructor evaluated it, the submission's status correctly transitioned to `evaluated`, and re-evaluating the same submission was correctly rejected with 409.

## Validated, not assumed

- `tsc --noEmit`, `eslint`, backend build, frontend build: all clean.
- Backend tests: **230/230** (209 existing + 21 new), zero regressions.
- Migration applied to the real local database; pre/post record counts identical (41/31/47/6/30/1/1).
- Both new seed scripts run twice each — zero duplicates on the second run, confirmed by direct query.
- `seed-phase25-content.ts` re-run after the migration — Phase 25's own idempotency fully preserved.
- Roles/permissions seed re-run — 20 permissions (18 + 2 new), 48 grants, clean.
- Live API smoke test: real learning-path/project reads, real 401 on unauthenticated write, real submit→evaluate→409-on-redo flow.

## No ambiguity required stopping

Every design decision (course-scoped not module-scoped Project, no direct Project↔LearningPath relation, service-level "at least one of content/fileId" validation, no new permission key for Project actions, `learning_path:create` following the `news:create` precedent not `course:create`'s) was resolved from an existing, observable codebase convention — cited inline in both the schema comments and `docs/phase26-learning-path-project-architecture-report.md`. Nothing was guessed.

## How to resume

Read `docs/phase26-learning-path-project-architecture-report.md` in full, particularly Section 12 (Remaining Limitations) and Section 13 (Phase 27 Recommendation — two candidate directions, deliberately not chosen here). **Explicitly stopped: not beginning Phase 27, awaiting approval.**
