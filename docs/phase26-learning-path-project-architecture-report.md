# Phase 26 — Learning Path & Project Evaluation Architecture Report

**Date:** 2026-08-09 · **Role:** Senior Technical Owner · **Scope:** closes exactly the two architecture gaps Phase 25 discovered and documented — nothing else. No business logic rewritten, no existing content duplicated, no existing API contract silently changed.

---

## 1. Executive Summary

Phase 25 seeded real educational content and, in doing so, found and documented two genuine architecture gaps: no `LearningPath` model, and no `Project`/submission/grading model. This phase closes both, following the codebase's own existing conventions throughout rather than introducing a new architectural style — the same ownership-OR-editorial authorization pattern already used by Courses/Lessons, the same thin-repository/service/controller layering, the same audit-logging and slug-generation helpers, the same cursor-pagination shape.

**Four new Prisma models** (`LearningPath`, `LearningPathCourse`, `Project`, `ProjectSubmission`, `ProjectEvaluation` — five, including the join table), **one clean migration**, **two new backend modules** (`learning-paths`, `projects`), **21 new backend unit tests** (all passing, zero regressions across the existing 209), **two new seed scripts** (idempotent, verified by running twice), and **a live, end-to-end smoke test** of the real submit → evaluate → status-transition flow against the running API — not simulated.

**The 6 existing Phase 25 project-brief Lessons were never duplicated.** Each is now linked to exactly one new `Project` row via a nullable, unique `sourceLessonId` foreign key; the brief's full text remains exactly where Phase 25 put it (`Lesson.body`). Verified directly: every seeded `Project.instructions` is `null`, and the linked lesson's body length is unchanged from Phase 25.

**No ambiguity required stopping this phase for owner approval** — every design decision below was resolvable from an existing, observable codebase convention (cited inline), consistent with this phase's own "inspect first, don't guess" instruction.

## 2. Current Schema Before Changes

Inspected directly (not assumed) before any schema edit. Relevant existing models in the `courses` Prisma schema namespace: `Course` (instructorId, categoryId, title, slug, description, status, priceCents — no difficulty/hours/prerequisites/tags fields), `Module` (courseId, title, position — no unique constraint beyond `id`), `Lesson` (moduleId, title, position, contentType, body, videoMediaId, isPreview — no unique constraint beyond `id`), `Quiz`/`QuizQuestion`, `Enrollment`, `LessonProgress`, `QuizAttempt`, `Certificate`. **No `LearningPath` model. No `Project`, `ProjectSubmission`, or `ProjectEvaluation` model.** `Tag`/`NewsTagAssignment` exist but are wired only to `News`, not `Course`. `Category` is hierarchical (self-referencing `parentCategoryId`) and domain-tagged (`courses`/`library`/`marketplace`).

Baseline record counts, captured before migration: 41 courses, 31 modules, 47 lessons, 6 quizzes, 30 quiz questions, 1 enrollment, 1 certificate.

## 3. Architecture Gap Confirmed in Phase 25

Re-confirmed by direct schema inspection, not taken on faith from the Phase 25 report: both gaps were real. A learning path existed only as documentation (`docs/content-library/learning-paths.md`). A project's brief existed as a `Lesson` row (`contentType: 'text'`), but nothing tracked a learner's actual submission or its evaluation — no table, no field, nowhere.

## 4. Final Chosen Data Model and Why

### LearningPath + LearningPathCourse

```
LearningPath { id, title, slug (unique), description, status (draft|published|archived), timestamps }
LearningPathCourse { id, learningPathId, courseId, position, @@unique([learningPathId, courseId]) }
```

- **`status` uses the exact same `draft | published | archived` convention as `Course`/`Product`/`News`** — no new status vocabulary invented.
- **The duplicate-course-membership guard is the `@@unique([learningPathId, courseId])` database constraint** — the DTO's own validation (`@ArrayUnique`) is a fast client-facing check, but the constraint is the actual last-line guard, matching this codebase's own stated pattern elsewhere (e.g. `LearningPathCourse`'s doc comment cites the identical reasoning `Enrollment`/`Certificate` use).
- **No direct `Project ↔ LearningPath` relation.** A path's projects are simply the union of its member courses' own projects. Adding a second, redundant relation would let a path's project list silently diverge from its course list — a real consistency risk avoided by not building it, consistent with this phase's "minimum stable architecture" instruction.

### Project

```
Project { id, courseId, sourceLessonId (nullable, unique), title, description, instructions (nullable), status (draft|published|archived), position, timestamps }
```

- **`courseId` required, not `moduleId` or `learningPathId`.** A project is scoped at the course level (matching how `docs/content-library/projects.md` already frames path-level projects as belonging to a path's *courses*, not individual lessons/modules) — this is the narrowest scope that's still genuinely useful, avoiding the complexity of module-level project scoping the current content doesn't need.
- **`sourceLessonId` is nullable and unique** — nullable because a future project might be created directly, without a pre-existing lesson brief; unique because one lesson maps to at most one project (prevents two different projects silently claiming to be "sourced from" the same brief).
- **`instructions` is nullable, deliberately.** For a lesson-sourced project (all 6 seeded this phase), the brief lives in `Lesson.body` and is never copied — `instructions` stays `null`. It exists only for a future project created without a source lesson. **Verified directly against the live database:** all 6 seeded projects have `instructions: null`.

### ProjectSubmission

```
ProjectSubmission { id, projectId, userId, content (nullable), fileId (nullable), attemptNumber, status (submitted|evaluated), submittedAt, timestamps, @@unique([projectId, userId, attemptNumber]) }
```

- **`content`/`fileId` are both nullable; at least one is required — enforced in `ProjectsService`, not the database.** Prisma has no portable "at least one of" column constraint. This is the exact same tradeoff already accepted for `Certificate.pdfFileId` (nullable, service-governed) — not a new pattern.
- **`fileId` reuses the existing `File` model**, the same mechanism `LessonFile` already uses for internal artifact links — no new storage/upload mechanism invented.
- **`attemptNumber` supports resubmission without losing history.** The unique constraint blocks only an accidental duplicate of the exact same attempt; a genuine resubmission increments the number and is a new row.

### ProjectEvaluation

```
ProjectEvaluation { id, submissionId (unique), evaluatorId, scorePercent, passed, feedback, method (manual|automated, default "manual"), status (completed|disputed, default "completed"), evaluatedAt, timestamps }
```

- **`submissionId` is unique — a real, enforced 1:1.** A resubmission creates a new `ProjectSubmission` (and therefore gets its own new evaluation) rather than overwriting evaluation history.
- **`scorePercent`/`passed` naming directly matches `QuizAttempt`'s existing field names** — not a coincidence; reusing established naming instead of inventing `score`/`grade`.
- **`method` exists now, always written as `"manual"`, specifically so a future automated-evaluation feature is additive** (a new allowed value, no migration) **rather than a breaking schema change later.** Per this phase's explicit instruction, no automated evaluation logic was implemented — the column is future-proofing only.

## 5. Migration/Data-Preservation Strategy

1. **Inspected the real schema and all existing educational records first** (Section 2) — before writing a single line of new Prisma schema.
2. **Confirmed exactly how the 6 project briefs are represented**: `Lesson` rows with `contentType: 'text'`, titled `"Project: <name>"`, inside their course's Module 1.
3. **Snapshot taken before migration**: 41/31/47/6/30/1/1 (courses/modules/lessons/quizzes/questions/enrollments/certificates).
4. **One migration**, `20260809081651_add_learning_paths_and_project_evaluation`, purely additive (5 new tables, 2 new relation columns on existing tables via back-relations only — no existing column altered, dropped, or renamed).
5. **Applied via `prisma migrate dev`** against the real local database (Neon).
6. **Post-migration count verified identical to the pre-migration snapshot** — 41/31/47/6/30/1/1, exact match, confirmed by direct query, not assumed.
7. **New tables confirmed present and empty** immediately after migration, before either new seed script ran.
8. **Linking, not copying**: `seed-phase26-content.ts` creates 6 `Project` rows, each via `sourceLessonId` pointing at the exact, unchanged, already-existing Lesson — verified the linked lesson's `body` length is unchanged from its Phase 25 value (2,058 characters for the sampled lesson).

## 6. API Changes

**`docs/16-API-CONTRACT.md` §20–21 added** (following this codebase's own established convention — every existing controller cites a doc16 section; the two new sections were written *before* implementation, in the same format, as the specification the new controllers implement against). 11 new endpoints total:

- `GET/POST /learning-paths`, `GET /learning-paths/:slug`, `PATCH /learning-paths/:id`, `POST /learning-paths/:id/publish`, `PUT /learning-paths/:id/courses`
- `GET/POST /courses/:courseId/projects`, `GET /projects/:id`, `POST /courses/:courseId/projects/:id/publish`, `POST /projects/:id/submissions`, `GET /projects/submissions/me`, `GET /courses/:courseId/projects/submissions`, `GET /projects/submissions/:id`, `POST /projects/submissions/:id/evaluate`

**No existing endpoint's contract was changed.** `GET /courses/:slug` still returns exactly what it returned before this phase — it does not (yet) include `projects` or path membership in its response; that remains a documented, deliberate frontend-integration gap (Section 8), not a silent contract change.

## 7. Authorization Model

Verified live against the running API, not just unit-tested:

| Action | Rule | Mechanism |
|---|---|---|
| Learner submits a project | Must hold an active `Enrollment` in the project's course | Business rule in `ProjectsService`, reusing the existing `CoursesRepository.hasActiveEnrollment` — no new permission key |
| Learner views own submissions/evaluations | Always scoped to the caller | `GET /projects/submissions/me`, no ownership check needed (self-scoped query) |
| Instructor views submissions for their course | Resource owner (course's `instructorId`) OR content_editor/admin | `isOwnerOrRole`/`assertOwnerOrRole` — the exact existing utility Courses/Lessons already use, reused directly, not reimplemented |
| Instructor/evaluator grades | Same ownership-OR-editorial pattern — grading is conceptually an edit action on course-owned content | Same utility, same reasoning as `CoursesService.update` |
| Moderator | Read-only visibility into submissions (never grading) | `canViewAsModerator` — the existing, narrowly-scoped utility, reused unchanged |
| LearningPath create/edit/publish | `learning_path:create` / `learning_path:publish` — 2 new permission keys, content_editor/admin only | Follows the `news:create` precedent (an editorial/curricular object spanning multiple instructors), not `course:create`'s any-instructor precedent — reasoning documented inline in `seed.ts` |
| Project create/edit/publish | **No new permission key** — ownership-OR-editorial against the parent course, identical to how Lessons are created today | Deliberate: adding a permission key here would have been inconsistent with the existing Lesson-creation precedent |

**Live-verified this phase, not just asserted:** unauthenticated `POST /learning-paths` → 401. Owning instructor evaluates a real submission → 201, submission status flips to `evaluated`. Re-evaluating the same submission → 409. A real learner's `GET /projects/submissions/me` correctly shows the embedded evaluation.

**Zero conflicts with the existing RBAC catalog** — the 2 new permission keys are new, non-colliding strings; every other authorization decision reuses existing roles/utilities without modification.

## 8. Frontend Integration Status

**No frontend code was changed this phase**, per the explicit instruction against speculative UI. Assessed directly: the existing course-detail page (`apps/web/src/app/[lang]/courses/[slug]/page.tsx`) renders `course.modules`/`lessons` directly from `GET /courses/:slug`'s response, which does not include the new `projects`/learning-path data — exposing it would require either changing that endpoint's response shape (a contract change this phase deliberately did not make) or a genuinely new fetch + new UI surface (a submission form, an instructor grading queue). Neither qualifies as a "small, safe extension" of an existing screen, so per this phase's own decision rule, no frontend work was attempted.

**Integration points for a future frontend phase**, documented rather than built:
- A learning-path browse/detail page consuming `GET /learning-paths` / `GET /learning-paths/:slug`.
- A "Projects" section on the course-detail page consuming `GET /courses/:courseId/projects` (a read-only addition — genuinely small, could be a future quick win).
- A submission form (`POST /projects/:id/submissions`) and a learner's "My Submissions" view (`GET /projects/submissions/me`).
- An instructor grading queue (`GET /courses/:courseId/projects/submissions`, `POST /projects/submissions/:id/evaluate`).

## 9. Test Results

All commands actually run this phase, not assumed:

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ Clean, zero errors |
| `npm run lint` (eslint) | ✅ Clean, zero errors |
| `npm run build` (backend, `nest build`) | ✅ Clean |
| `npm run build` (frontend, `next build`) | ✅ Clean, all routes compiled — confirms zero regression despite no frontend code being touched |
| `npm test` (backend, Jest) | ✅ **230/230 passing**, 28/28 suites (209 pre-existing + 21 new) |
| `npx prisma validate` | ✅ Schema valid |
| New unit tests — `learning-paths.service.spec.ts` (7 tests) | ✅ create/publish/setCourses authorization, duplicate-course rejection, draft visibility |
| New unit tests — `projects.service.spec.ts` (14 tests) | ✅ ownership-OR-editorial authorization (create/publish/evaluate), duplicate `sourceLessonId` rejection, enrollment requirement, at-least-one-of validation, attempt-number increment, double-evaluation conflict, submission-visibility authorization (owner/editorial/moderator/unrelated-learner) |
| Live API smoke test (real HTTP, not simulated) | ✅ `GET /learning-paths` (3 real paths), `GET /learning-paths/prompt-engineer` (correctly ordered 2-course path), `GET /courses/:id/projects` (2 real, correctly-linked projects), unauthenticated `POST /learning-paths` → 401, full submit → evaluate → status-transition flow, double-evaluation → 409 |

## 10. Seed/Idempotency Results

- **`seed-phase26-content.ts` run twice.** First run: 3 learning paths created, 6 courses linked into them, 6 projects created (linked to existing lessons). Second run: **0 created**, every item logged "already exists/already linked, skipping."
- **`seed-phase25-content.ts` re-run after the Phase 26 migration**, to confirm Phase 25's own idempotency survived the schema change unaffected: 0 courses/modules/lessons/quizzes/questions created — fully preserved.
- **`prisma db seed` (roles/permissions) re-run**: 8 roles, **20 permissions** (18 pre-existing + 2 new: `learning_path:create`, `learning_path:publish`), 48 role-permission grants — clean, no errors, confirms the new permission keys integrate correctly with the existing catalog.
- **Direct database verification after both seeds**: 3 learning paths, 6 course memberships, 6 projects — exact expected counts, zero duplicates.

## 11. Regression Results

**Zero regressions.** 209 pre-existing backend tests still pass unchanged. Frontend build unaffected (no frontend files touched). No existing controller, service, repository, or DTO was modified — every change this phase is a new file, a new schema addition, or an additive entry in `app.module.ts`/`seed.ts`'s existing arrays. Pre-existing data (41 courses, 31 modules, 47 lessons, 6 quizzes, 30 questions, 1 enrollment, 1 certificate) confirmed byte-for-byte present after migration.

## 12. Remaining Limitations

- **No frontend UI** — by design this phase; see Section 8's documented integration points.
- **No automated project evaluation** — by explicit instruction; `ProjectEvaluation.method` exists only as future-proofing, always written `"manual"`.
- **`Module`/`Lesson` still have no unique constraint beyond `id`** (a pre-existing gap Phase 25 already flagged, unchanged by this phase — out of this phase's scope, since it doesn't block the new architecture).
- **A learning path's "projects" are computed by union of member courses' projects, not stored/cached** — correct and consistent by construction, but means listing a path's full project set requires querying every member course; acceptable at current scale (small paths, few courses), worth revisiting only if paths grow much larger.
- **No dispute/re-evaluation workflow implemented** — `ProjectEvaluation.status`'s `"disputed"` value is reserved, not yet reachable by any endpoint.

## 13. Phase 27 Recommendation

Two reasonable next steps, not chosen here (a product/priority decision, not an architecture one):

1. **Minimal frontend integration** — the lowest-risk win is a read-only "Projects" section on the existing course-detail page (`GET /courses/:courseId/projects`), genuinely small per Section 8's own assessment, without yet building the submission/grading UI.
2. **Continue Phase 25's content-production track** (`docs/content-library/content-roadmap.md` Phase C1) — now that the architecture exists, newly-authored projects can be created as real `Project` rows directly (not lesson-sourced), proving the non-linked creation path this phase built but didn't yet exercise with real content.

---

**Stopped. Not beginning Phase 27. Awaiting approval.**
