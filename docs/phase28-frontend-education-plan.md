# Phase 28 — Educational Frontend Experience: Implementation Plan

**Created:** Phase 28, 2026-08-09, **before** any frontend implementation, per this phase's explicit Part 1 requirement. Written after directly inspecting `apps/web/src`, the `learning-paths`/`projects`/`progress`/`lessons`/`courses` backend modules, `docs/16-API-CONTRACT.md`, and the Phase 26/27 reports — not guessed.

---

## Existing Routes/Components Reused (nothing rebuilt)

| Existing asset | Reused for |
|---|---|
| `apps/web/src/app/[lang]/courses/[slug]/page.tsx` (course detail) | Extended, not replaced — same `useCourse` hook, same `ph-*` design-system classes, same locked/preview lesson logic |
| `apps/web/src/app/[lang]/courses/[slug]/learn/[lessonId]/page.tsx` (lesson view) | Extended — same `useLesson`, `useUpdateLessonProgress`, same prior/next-lesson intent (previously absent, added this phase); the file's own existing comment already documented the quiz gap this plan resolves |
| `Navigation`, `Footer` components | Reused unmodified on every new page |
| `RequireAuth` guard | Reused unmodified for every learner-only new page |
| `useAuth().hasAnyRole(...)` | Reused unmodified to gate the new instructor evaluation page — no new permission-checking logic invented client-side (server remains authoritative regardless) |
| `ROUTES` / `withLang` (`constants/routes.ts`) | Extended with new route constants, same pattern as every existing entry |
| `packages/api-client` resource-factory pattern (`createXResource(request)`) | Reused exactly — two new resource files added, following `courses.ts`/`progress.ts` verbatim |
| `packages/types` per-domain type files | Reused pattern — two new type files added |
| `@tanstack/react-query` hook pattern (`useQuery`/`useMutation`, `queryKeys`) | Reused exactly — no new data-fetching library introduced |
| `.ph-page`, `.ph-state`, `.ph-catalogue-card`, `.ph-lesson-row`, `.ph-module`, `.ph-form-*` CSS classes | Reused; **zero new one-off visual styles** unless a genuinely new pattern (e.g. a quiz question card) requires an addition consistent with the existing token system |

## Existing Route Naming Collision Found (real, must avoid)

`apps/web/src/app/[lang]/projects/page.tsx` already exists — an unrelated, pre-existing **portfolio/kanban "ProjectsBoard" feature**, nothing to do with the Phase 26 educational `Project` model. **New educational-project routes must NOT use the bare `/projects` path.** Plan: nest under courses (`/courses/[slug]/projects/[projectId]`) for the learner view and under instructor (`/instructor/projects/submissions/[id]`) for evaluation — consistent with how `instructorCourseEdit` already nests under `/instructor/`.

## APIs Reused (all pre-existing, verified against real controller/DTO source, not guessed)

- `GET /learning-paths`, `GET /learning-paths/:slug` (Phase 26, `docs/16-API-CONTRACT.md` §20)
- `GET /courses/:slug` (existing, extended nowhere — same response shape)
- `GET /lessons/:id` (existing, unchanged)
- `PUT /progress/lessons/:lessonId`, `GET /progress/courses/:courseId` (existing, unchanged)
- `POST /progress/quizzes/:quizId/attempts` (existing, unchanged)
- `GET /courses/:courseId/projects`, `GET /projects/:id`, `POST /projects/:id/submissions`, `GET /projects/submissions/me`, `GET /courses/:courseId/projects/submissions`, `GET /projects/submissions/:id`, `POST /projects/submissions/:id/evaluate` (Phase 26, `docs/16-API-CONTRACT.md` §21)
- `GET /certificates/me`, `GET /certificates/:id` (existing, unchanged)

## One New API Endpoint (approved by the user before implementation, per Part 13)

**`GET /progress/quizzes/:quizId`** — real, confirmed gap: no endpoint existed anywhere to fetch a quiz's questions before submitting (only the submit-attempt endpoint existed). Confirmed by a full grep across every controller (zero `@Get` quiz routes) **and independently corroborated by the existing `apps/web` lesson page's own code comment from an earlier phase**, which already documented this exact block rather than guess at a relation. Implemented as the minimal possible addition: reuses the existing `progressRepository.findQuizWithQuestions` query and the exact same active-enrollment entitlement rule `submitQuizAttempt` already enforces — no new authorization logic, no schema change. `correctAnswer` is stripped server-side before the response is built. Documented in `docs/16-API-CONTRACT.md` §7, tested (4 new unit tests), full suite re-verified at 234/234 (was 230/230).

## New Frontend Routes

| Route | Purpose |
|---|---|
| `/[lang]/learning-paths` | Learning paths listing (Part 2) |
| `/[lang]/learning-paths/[slug]` | Learning path detail — description + ordered courses (Part 2) |
| `/[lang]/courses/[slug]/projects` | Project listing for a course (Part 6) |
| `/[lang]/courses/[slug]/projects/[projectId]` | Project detail + submission UI (Part 6) |
| `/[lang]/instructor/projects` | Instructor's submission queue across their courses (Part 7) |
| `/[lang]/instructor/projects/submissions/[id]` | Instructor submission detail + evaluation form (Part 7) |

## Modified Frontend Routes

- `/[lang]/courses/[slug]` — add a link to the course's Projects (if any exist) and a course-progress summary (via `GET /progress/courses/:courseId`) when the viewer is enrolled.
- `/[lang]/courses/[slug]/learn/[lessonId]` — add previous/next lesson navigation (computed from the already-fetched course's module/lesson ordering — no new endpoint needed), and replace the existing "quiz blocked" state with a real quiz-taking UI now that the endpoint exists.

## New Components

- `LessonNavigation` — prev/next links, computed client-side from the course's already-known lesson ordering (no new query).
- `QuizRunner` — loads `GET /progress/quizzes/:quizId`, renders question-type-appropriate inputs (single/multiple/text), submits via the existing `POST .../attempts`, renders the server's real score — never computes a score client-side.
- `ProjectCard` / `ProjectSubmissionForm` / `ProjectStatusBadge` — small, focused, reusing existing `ph-*` card/badge conventions.
- `SubmissionEvaluationForm` — instructor-only, reused nowhere else.

## Permission Boundaries

- Every learner-only new page wrapped in the existing `RequireAuth` guard — identical to every existing authenticated page.
- The instructor evaluation pages additionally gate rendering behind `useAuth().hasAnyRole(['instructor', 'content_editor', 'admin', 'superadmin'])` **as a UX convenience only** — the real authorization boundary remains entirely server-side (`ProjectsService`'s existing ownership-OR-editorial checks, unchanged, per this phase's explicit "backend RBAC remains authoritative" instruction). A learner who reaches the evaluation page by URL still gets a real 403 from the API on any write attempt; the client-side gate only avoids showing them a form they'd be denied anyway.
- No new permission key requested or required — this phase adds zero backend authorization logic beyond the one already-approved read endpoint above, which reuses an existing rule verbatim.

## Learner Flow (implements Part 11's required journey)

Login → `/learning-paths` → `/learning-paths/prompt-engineer` → click into `prompt-engineering-mastering-llms` → `/courses/prompt-engineering-mastering-llms` (now showing 4 real modules + enrollment progress) → click a lesson → read real content → prev/next through the module → reach the Module 1 quiz lesson → `QuizRunner` loads real questions → submit → real server score/pass-fail shown → back to course → `/courses/.../projects` → open a real project → read real instructions → submit → see real submission status → (separately, as instructor) `/instructor/projects` → open the submission → evaluate → learner's submission page reflects the real evaluation on next load.

## Instructor Flow

Login as `e2e.instructor@phoenix.test` → `/instructor/projects` (server-filtered to courses this instructor owns, via the existing `GET /courses/:courseId/projects/submissions` ownership check — the frontend does not filter client-side, it only calls the endpoint per-course the instructor is confirmed to own) → open a submission → evaluate via the existing endpoint → real, persisted result.

## Genuine Gaps Discovered (documented, not silently worked around)

1. **The one new endpoint above** — resolved with explicit user approval before implementation.
2. **`GET /courses/:slug` does not expose which `LearningPath`(s) a course belongs to** (no such field in `CourseDetail`, confirmed in `courses.repository.ts`'s `findBySlug` query and `packages/types/src/courses.ts`). The course page therefore cannot show "this course is part of the X path" unless the visitor arrived via a path page (in which case the UI carries that context forward via normal link/breadcrumb navigation, not an API call). **Not a blocker** — matches Phase 26's own documented architecture decision not to add a redundant reverse relation. Will be noted as a known limitation in the final report, not silently patched with a new backend field.
3. **`GET /courses/:courseId/projects/submissions` requires a `courseId`** — there is no single "all submissions across all my courses" endpoint for an instructor teaching multiple courses. The instructor queue page will call this endpoint once per course the instructor owns (discovered via the existing `GET /courses?...` listing filtered client-side to courses where `instructorId` matches the logged-in instructor, since no dedicated "my courses" project-submission aggregate endpoint exists). This is a real, minor UX limitation for a hypothetical multi-course instructor — noted, not backend-patched, since the current fixture instructor only owns a small, enumerable set of courses and this remains genuinely optional per Part 13 ("prefer frontend-only").

## Explicitly Out of Scope This Phase

- No homepage changes. No visual-identity changes. No new dependencies. No changes to `apps/web`'s existing `/projects` (portfolio) route. No changes to unrelated modules (payments, marketplace, news, library, admin).
