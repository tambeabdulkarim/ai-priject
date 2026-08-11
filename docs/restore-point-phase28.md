# Restore Point — Phase 28 (Educational Frontend Experience)

**Date:** 2026-08-09 · **Type:** Learner/instructor-facing frontend built on the Phase 26 architecture + Phase 27 real content. One approved, minimal backend addition (quiz-read endpoint + `quizId` field) and one approved backend bug fix (quiz scoring), both found via genuine live verification, not planned in advance. Backend tests: 237/237 (234 prior + 3 new regression tests for the scoring fix), zero regressions. No schema changes.

## What this phase was

The first complete learner-facing UI over the Phase 26/27 educational backend: Learning Paths → Course → Lesson → Quiz → Project → Instructor Evaluation → Certificate, plus the instructor-side project evaluation queue. Built almost entirely by reusing existing routes, components, hooks, and the established design system; one new backend endpoint was added after being explicitly approved (see below).

## What's new

- **Frontend:** Learning Paths list/detail pages, extended course detail page (progress bar + projects link), course projects list + project detail/submission page, instructor project queue + evaluation page, a real `QuizRunner` component wired into the lesson page (replacing a documented "blocked" placeholder), prev/next lesson navigation.
- **Shared packages:** `learning-paths` and `projects` types + API-client resources; corresponding React Query hooks (`useLearningPaths`, `useProjects`, `useQuiz`).
- **Backend (approved additions):** `GET /progress/quizzes/:quizId` (strips `correctAnswer`, requires active enrollment); `quizId` field added to `GET /lessons/:id` response (was previously undiscoverable).
- **Backend (approved bug fix):** `quiz-scoring.ts`'s `single`-type comparison now unwraps a one-element array on either side before comparing. Regression tests added.

## The bug found and fixed

Live verification of a real quiz submission surfaced a real, pre-existing defect: `correctAnswer` for every `single`-type question in the seeded content (`seed-phase27-content.ts`) is stored as a one-element array (e.g. `["True"]`), but the scoring function compared it via strict `JSON.stringify` against the frontend's bare-string submission — so no learner could ever pass a single-choice question, in any course, before this fix. Confirmed directly via Prisma (pattern is consistent across all seeded quizzes, not a typo) and via three live before/after attempts against the real API (0% before the fix with exact-text answers; 60% after the fix with the same payload; a second attempt with fully-correct answers to confirm a passing path is reachable). Fixed in `quiz-scoring.ts`, not in the seed data — approved by the project owner via `AskUserQuestion` before implementation.

## The gap found and documented (not fixed)

Passing a quiz never marks its underlying lesson `LessonProgress.completedAt` anywhere in the codebase, and the frontend never shows a "mark complete" control for quiz-type lessons. Confirmed live: after marking every non-quiz lesson in a real course complete, `completionPercent` capped at 92% (23/25 lessons) — 100% completion, and therefore new certificate issuance, is currently unreachable for any course containing a quiz-type lesson. Per this phase's own instruction ("do not redesign the certificate system, document limitations rather than bypass them"), this was **not** fixed this phase — it is recorded here and in `docs/known-issues.md` as an open, pre-existing limitation.

## Validated, not assumed

- Backend: `tsc`, `eslint`, full test suite (237/237) all clean after the scoring fix.
- Frontend: `tsc --noEmit` and `eslint` both clean. The final full `next build` re-run (after a late CSS-only responsive fix) could not be completed in this session due to a tool-execution disruption unrelated to the code itself — see Known Limitations in the full report. `tsc`/lint passing on the frontend is the evidence available for this specific late change; the pre-existing full build (before that last edit) was already confirmed clean earlier in the phase.
- **Live, real, end-to-end learner + instructor journey**, driven via direct HTTP calls against the same endpoints the real pages call (no browser-automation tool is available in this session): login → list real learning paths → open a real path → open its course → open a real lesson (confirmed the new `quizId` field) → load a real quiz via the new endpoint (confirmed no `correctAnswer` leaked) → submit a real attempt (caught the scoring bug) → submit again post-fix (confirmed correct scoring) → hit the real `maxAttempts` limit (confirmed `CONFLICT`) → list real projects → submit a real project → confirm a learner is blocked (403) from self-evaluating → log in as the real owning instructor → open the real submission → evaluate it for real → confirm the evaluation persisted when re-fetched as the learner → attempt to reach 100% completion (capped at 92%, gap documented above).
- Responsive: no browser/device rendering tool is available this session. Verified instead that every new page reuses already-responsive, previously-shipped CSS primitives (`.ph-grid`'s `auto-fill minmax(260px,1fr)`, `.ph-form-card`, `.ph-page`) rather than introducing new fixed-width layout, and fixed one real risk found by inspection (the new lesson prev/next nav lacked `flexWrap`, mirroring a bug class this codebase hit before — see `globals.css:1454`).

## Known limitations carried forward

- Quiz-lesson completion gap (above) — blocks 100% completion/new certificates for any course with a quiz-type lesson.
- `useUpdateLessonProgress` has the same un-unwrapped-error mutation pattern that `useSubmitQuizAttempt` had before this phase's fix; left untouched as out of scope (pre-existing, not something this phase's requirements depend on).
- No aggregate "all my courses' submissions" endpoint for a multi-course instructor — the instructor queue is scoped to one owned course at a time, disclosed in-page.
- `GET /courses/:slug` still doesn't expose learning-path membership (a course doesn't know which paths contain it) — accepted, Phase-26-consistent limitation.
- Full frontend production build not re-confirmed after the very last CSS-only edit (see above) due to a session tool-execution disruption, not a code issue.

## How to resume

Read `docs/phase28-educational-frontend-report.md` in full for the complete verification trail, exact files changed, and Phase 29 recommendation. **Explicitly stopped: not beginning Phase 29, awaiting approval.**
