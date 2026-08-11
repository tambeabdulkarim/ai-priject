# Phase 28 — Educational Frontend Experience: Final Report

**Date:** 2026-08-09 · Builds on Phase 26 (LearningPath/Project architecture) and Phase 27 (real educational content). See `docs/phase28-frontend-education-plan.md` for the pre-implementation inspection/plan document required by Part 1.

## 1. Objective

Build the first complete learner-facing UI for the real educational backend: Learning Paths → Courses → Modules → Lessons → Quizzes → Projects → Certificates, plus an instructor-facing project evaluation UI — reusing existing APIs, RBAC, DB models, components, and the established design system, with no fabricated content and no weakened permissions.

## 2. Existing Architecture Inspected

Confirmed via `docs/16-API-CONTRACT.md`, `docs/13-DATABASE-BLUEPRINT.md`, and direct code inspection before writing any frontend code: the Phase 26 `LearningPath`/`LearningPathCourse`/`Project`/`ProjectSubmission`/`ProjectEvaluation` models and their controllers/services; the existing `courses`, `lessons`, `progress`, `enrollments`, `certificates` modules; the existing `ph-*` CSS design system and its reusable components (`Navigation`, `Footer`, `StatusBadge`, `EmptyState`, `Loading.tsx`); the `RequireAuth`/`RequireRole` guard pattern; the `queryKeys` factory and resource-factory API-client pattern. Full detail in `docs/phase28-frontend-education-plan.md`.

## 3. Frontend Routes Created/Modified

**New:** `/[lang]/learning-paths`, `/[lang]/learning-paths/[slug]`, `/[lang]/courses/[slug]/projects`, `/[lang]/courses/[slug]/projects/[projectId]`, `/[lang]/instructor/projects`, `/[lang]/instructor/projects/submissions/[id]`.

**Modified:** `/[lang]/courses/[slug]` (progress bar + projects link), `/[lang]/courses/[slug]/learn/[lessonId]` (real `QuizRunner` replacing the prior documented-blocked placeholder; prev/next lesson navigation).

New routes were deliberately nested under `/courses/[slug]/projects/...` and `/instructor/projects/...` rather than a bare `/projects` path — an existing, unrelated portfolio/kanban `ProjectsBoard` feature already occupies `/[lang]/projects`. Verified after the frontend build that route's bundle size was unchanged, confirming no collision.

## 4. Components Created/Modified

- `apps/web/src/components/education/QuizRunner.tsx` (new) — real quiz-taking UI; never computes a score client-side.
- `apps/web/src/components/ui/StatusBadge.tsx` — extended with `submitted`/`evaluated` statuses (a one-line extension point the component's own comment sanctions).
- New hooks: `useLearningPaths.ts`, `useProjects.ts`; extended `useProgress.ts` with `useQuiz`.
- New shared types/resources: `packages/types/src/learning-paths.ts`, `packages/types/src/projects.ts`; `packages/api-client/src/resources/learning-paths.ts`, `.../projects.ts`.

## 5. APIs Reused (No Changes)

`GET /learning-paths`, `GET /learning-paths/:slug`, `GET /courses/:slug`, `GET /lessons/:id`, `GET /courses/:courseId/projects`, `GET /projects/:id`, `POST /projects/:id/submissions`, `GET /projects/submissions/me`, `GET /courses/:courseId/projects/submissions`, `GET /projects/submissions/:id`, `POST /projects/submissions/:id/evaluate`, `GET /progress/courses/:courseId`, `PUT /progress/lessons/:lessonId`, `POST /progress/quizzes/:quizId/attempts`, `GET /certificates/me`.

## 6. Backend Changes (Approved)

Two changes, both approved in advance via `AskUserQuestion` before implementation, per Part 13:

1. **`GET /progress/quizzes/:quizId`** (new) — the only way to build a real quiz-taking UI; no such endpoint existed. Reuses the existing active-enrollment entitlement rule; strips `correctAnswer` server-side. Documented in `docs/16-API-CONTRACT.md` §7.
2. **`quizId` field added to `GET /lessons/:id`** — necessary completion of change #1 (a quiz-type lesson's quiz ID was otherwise undiscoverable). `lessons.repository.ts` now selects `quizzes: { select: { id: true } }` (id only); `lessons.service.ts` shapes the response to `quizId: quizzes[0]?.id ?? null`.

A third change was made mid-verification, also approved via `AskUserQuestion` — see Section 9.

## 7. Real Learner Journey Verification

Driven via direct HTTP calls against the exact endpoints the real pages call (no browser-automation tool is available in this session — disclosed methodology, consistent with Phases 25-27):

1. Login as `e2e.learner@phoenix.test` — 200.
2. `GET /learning-paths` — 3 real paths returned (`devops-engineer`, `frontend-web`, `prompt-engineer`).
3. Opened `prompt-engineer` — 2 real ordered courses.
4. Opened `prompt-engineering-mastering-llms` — all 4 real modules present, correctly ordered.
5-7. Opened a real lesson ("Zero-Shot vs. Few-Shot Prompting") — real body content (2,165 chars), `quizId` field present (`null`, correctly, since this lesson isn't the quiz lesson).
8. Opened the module's real quiz lesson ("Module Review & Final Assessment") — real, non-null `quizId`; `GET /progress/quizzes/:quizId` returned 5 real questions, confirmed no `correctAnswer` field present.
9-10. Submitted a real attempt — this is where the scoring bug was found (0% despite exact-match answers). See Section 9. After the fix: re-submitted the identical payload — 60%, with the 3 single-choice questions now correctly scored `true`. Submitted a second, fully-correct attempt to confirm a passing path is reachable. A fourth attempt correctly hit `maxAttempts` and returned `CONFLICT`.
11. `GET /courses/:courseId/projects` — 4 real published projects, including one with full `instructions` text and two with a linked `sourceLesson`.
12. `POST /projects/:id/submissions` — real submission created (`status: submitted`, `attemptNumber: 2`).
13. `GET /projects/submissions/me` — confirmed the new submission and its real state alongside prior real submissions.
14. Attempted self-evaluation as the learner — real `403 FORBIDDEN`, confirming server-side ownership-OR-editorial enforcement (not a client-side guess).
15. Logged in as `e2e.instructor@phoenix.test` (the real owning instructor for this course).
16. `GET /projects/submissions/:id` as instructor — 200, full submission content visible.
17. `POST /projects/submissions/:id/evaluate` — real evaluation created (`scorePercent: 88`, `passed: true`, `method: manual`, `status: completed`).
18. Re-fetched the submission as the learner — `status: evaluated`, evaluation object present with the exact persisted values. Confirms real persistence, not a client-side echo.
19. Completion/certificate: see Section 10 — a real, concrete limitation was found and documented rather than bypassed.

## 8. Instructor Verification

Covered in steps 15-18 above: the instructor queue page (`instructor/projects`) reuses `useMyOwnedCourses` (same disclosed client-side-filter gap as the existing Instructor Dashboard) and `useCourseSubmissions`; the evaluation page reuses `useSubmission`/`useEvaluateSubmission`. Both exercised against the real owning instructor account with real, non-fabricated results.

## 9. Quiz Verification — The Bug Found and Fixed

Live submission of a real quiz attempt (step 9-10 above) returned `scorePercent: 0` despite submitting the exact seeded correct-answer text for 3 of 5 questions. Investigated via direct Prisma inspection (not guessed): `quiz-scoring.ts`'s `single` case did `JSON.stringify(submittedAnswer) === JSON.stringify(correctAnswer)`, but every `single`-type question's seeded `correctAnswer` (`prisma/seed-phase27-content.ts`) is stored as a one-element array (e.g. `["True"]`), while the frontend submits a bare string. Confirmed this is a systemic pattern across all seeded quizzes, not a one-off typo, by grepping the full seed file.

Presented to the project owner via `AskUserQuestion` with three options (fix the scoring function, fix the seed data, or leave it documented); **"Fix quiz-scoring.ts" was selected**. Implemented as the smallest change: `normalizeSingle()` unwraps a one-element array on either side before comparing, mirroring how `multiple` already normalizes via `asArray()`. Added 3 regression tests to `quiz-scoring.spec.ts`. Re-ran the full backend suite (237/237, up from 234) and re-verified live: the identical original payload now scores 60% with the correct per-question breakdown, and a fully-correct payload confirms a passing path exists.

## 10. Project Submission/Evaluation Verification

Fully covered in Section 7, steps 11-18. Real submission → real learner-blocked-from-self-eval (403) → real instructor evaluation → real persisted result, all against the live database with no mocked responses at any step.

## 11. Certificate Verification — Gap Found, Documented Not Bypassed

Attempted to drive a real enrollment to 100% completion to observe certificate issuance. Starting completion was 52% (13/25 lessons). Marked all 21 non-quiz lessons in the course complete via the real `PUT /progress/lessons/:lessonId` endpoint. Resulting completion capped at **92% (23/25 lessons)** — it could not reach 100%.

Root cause, confirmed by code inspection: `submitQuizAttempt` in `progress.service.ts` never touches `LessonProgress`, and the frontend never shows a "mark complete" control for quiz-type lessons (by design, since completion should reflect passing the quiz, not just viewing it — but nothing currently makes that connection). **No course containing a quiz-type lesson can reach 100% completion, and therefore no new certificate can be issued for one, via any existing flow.**

An existing certificate for this course was found (`GET /certificates/me`), issued 2026-08-09T07:02, predating this discovery — almost certainly issued when the course had fewer lessons/no quiz lessons yet, before Phase 27 content was added; it does not indicate the current course structure can reach 100%.

Per this phase's own explicit instruction ("do not redesign the certificate system... if certificate behavior has limitations, document them rather than bypassing them"), **this was not fixed**. It is recorded here, in the restore point, and in `docs/known-issues.md`.

## 12. Responsive Verification

No browser/device-rendering tool is available in this session. Verified instead by inspection: every new page reuses already-shipped, already-responsive CSS primitives (`.ph-grid`'s `grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))`, `.ph-form-card`, `.ph-page`, `.ph-catalogue-card`) rather than introducing new fixed-width layout. One real risk was found and fixed: the new lesson prev/next navigation used a flex row with no wrap, which is exactly the bug class documented at `globals.css:1454` (`.ph-nav-actions` previously overflowed narrow viewports for the same reason). Added `flexWrap: 'wrap'`. This is disclosed as CSS-based verification, not actual rendered-device confirmation.

## 13. Tests

Backend: 237/237 passing (234 pre-existing + 3 new regression tests for the scoring fix). **The 230/230 baseline from the end of Phase 27 remains fully intact** — 234 was the count after this phase's approved quiz-endpoint addition (4 new tests for `getQuizForLearner`), and 237 is after the scoring-fix regression tests (3 more). Zero regressions among the original 230 at any point. No frontend test suite exists in this repo (consistent with all prior phases).

## 14. Build Results

Backend: `tsc --noEmit` clean, `eslint` clean, `nest build` clean, both before and after the scoring fix. Frontend: `tsc --noEmit` clean, `eslint` clean (both re-run after the final responsive fix). The frontend's full `next build` was confirmed clean earlier in the phase (used to verify no `/projects` route collision); a final re-run after the last CSS-only `flexWrap` edit could not be completed in this session due to a tool-execution disruption unrelated to the code (see Section 16). The change is a single inline-style property addition with no type or logic surface, so this is a low-risk, disclosed gap rather than a silent claim of success.

## 15. Security/RBAC Verification

No new authorization logic was written anywhere this phase — every guard (`RequireAuth`, `RequireRole`) is UI-convenience only, and every real boundary is the existing server-side check, exercised for real: a learner got a genuine 403 attempting to self-evaluate their own project submission (step 14); the new quiz endpoint reuses the existing active-enrollment rule and strips `correctAnswer` server-side, confirmed absent in the live response before any frontend code consumed it.

## 16. Known Limitations

- **Quiz-lesson completion gap** (Section 11) — the most significant open item; blocks 100% completion and new certificate issuance for any course with a quiz-type lesson.
- `useUpdateLessonProgress` has the same silent-error mutation bug that `useSubmitQuizAttempt` had before this phase's fix (Section 9's fix pattern was not applied there — pre-existing, out of this phase's explicit scope).
- No aggregate "all my courses' submissions" endpoint — the instructor queue is scoped to one owned course, disclosed in-page copy.
- `GET /courses/:slug` still doesn't expose learning-path membership (pre-existing, Phase-26-consistent, accepted).
- A late tool-execution disruption in this session (unrelated to the codebase — see Section 6 of the restore point) prevented a final confirmatory `next build` run after the last CSS-only edit; `tsc`/lint for that same change are clean.
- Full seed-idempotency re-run (`npm run seed` twice, diffing record counts) was not repeated this phase — it was deliberately skipped to avoid disturbing the real submission/evaluation/attempt records just created during live verification (Sections 7/9/10 depend on that exact data existing). Seed idempotency was directly verified in Phase 27 and no seed file was touched this phase.

## 17. Screens/Routes Inventory

See Section 3 for the full route list. All 8 routes (6 new, 2 modified) were confirmed to return HTTP 200 with no server crash during live verification, in addition to the deeper API-level verification in Section 7.

## 18. Exact Files Changed

**Backend:** `apps/api/src/modules/progress/progress.service.ts`, `progress.controller.ts`, `progress.service.spec.ts`, `quiz-scoring.ts`, `quiz-scoring.spec.ts`; `apps/api/src/modules/lessons/lessons.repository.ts`, `lessons.service.ts`; `docs/16-API-CONTRACT.md`.

**Shared packages:** `packages/types/src/learning-paths.ts` (new), `packages/types/src/projects.ts` (new), `packages/types/index.ts`, `packages/types/src/progress.ts`, `packages/types/src/lessons.ts`; `packages/api-client/src/resources/learning-paths.ts` (new), `.../projects.ts` (new), `.../progress.ts`, `packages/api-client/index.ts`.

**Frontend:** `apps/web/src/hooks/queryKeys.ts`, `useLearningPaths.ts` (new), `useProjects.ts` (new), `useProgress.ts`; `apps/web/src/components/ui/StatusBadge.tsx`; `apps/web/src/components/education/QuizRunner.tsx` (new); `apps/web/src/constants/routes.ts`; `apps/web/src/app/[lang]/learning-paths/page.tsx` (new), `[slug]/page.tsx` (new); `apps/web/src/app/[lang]/courses/[slug]/page.tsx`, `projects/page.tsx` (new), `projects/[projectId]/page.tsx` (new), `learn/[lessonId]/page.tsx`; `apps/web/src/app/[lang]/instructor/projects/page.tsx` (new), `submissions/[id]/page.tsx` (new).

**Docs:** `docs/phase28-frontend-education-plan.md` (new, pre-implementation), `docs/phase28-educational-frontend-report.md` (this file), `docs/restore-point-phase28.md`, `docs/project-status.md`, `docs/known-issues.md`, `docs/next-session.md`, `docs/documentation-index.md`.

## 19. Regression Assessment

Zero regressions in existing behavior. The 230 pre-existing backend tests all still pass unchanged. The one behavioral change to previously-shipped code (`quiz-scoring.ts`'s `single` case) is strictly additive-correcting: it only changes the outcome for the case that was previously always wrong (array-wrapped `correctAnswer` vs. bare-string submission); every previously-passing case (bare-string vs. bare-string, which the original unit tests already covered) is unchanged, confirmed by the original 2 tests in that describe block still passing.

## 20. Recommendation for Phase 29

Two candidate directions, not yet chosen:

1. **Close the quiz-completion gap** (Section 11) — the clearest, most concrete remaining blocker to a fully working learner journey. Likely requires deciding, with explicit approval, whether passing a quiz should mark its lesson's `LessonProgress.completedAt`, and under what condition (any attempt vs. a passing attempt) — a real product/architecture decision, not a bug fix, and squarely a Part 13 STOP case for whichever phase takes it on.
2. **Content/coverage expansion** — per Phase 27's own Section 19, several courses remain partially authored (UI/UX Design Foundations, DevOps Foundations at 2 of their planned modules). Phase 28 didn't touch content production.

No Phase 29 work has begun. Awaiting explicit approval before starting either direction.
