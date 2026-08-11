# Restore Point — Phase 29 (Fix Quiz-Lesson Completion & Certificate Eligibility)

**Date:** 2026-08-09 · **Type:** Backend architectural fix closing the Phase 28-documented completion gap. No schema changes. Backend tests: 241/241 (237 prior + 4 new), zero regressions. No frontend code changed — verified anyway.

## What this phase was

Fixed the one open limitation Phase 28 deliberately documented rather than bypassed: a passed quiz never marked its lesson complete, so no course containing a quiz-type lesson could reach 100% completion or issue a new certificate.

## Root cause and fix

`submitQuizAttempt` scored a quiz and recorded a `QuizAttempt`, but never touched `LessonProgress` — only `updateLessonProgress` (the plain "mark lesson complete" endpoint) did that. Extracted the shared "upsert lesson progress → recompute `Enrollment.completionPercent` → on the transition into 100%, notify + attempt certificate issuance" flow out of `updateLessonProgress` into one private method, `upsertProgressAndHandleCompletion`, and call it from `submitQuizAttempt` whenever `passed === true`. A failed attempt calls nothing. No second completion mechanism was created; `certificatesService.issueForEnrollment`'s existing independent quiz-passing re-validation (via `QuizAttempt`, unrelated to `LessonProgress`) was untouched — it was already correct and is exactly why a certificate could still be trusted once completion legitimately reaches 100%.

## Files changed

- `apps/api/src/modules/progress/progress.repository.ts` — `findQuizWithQuestions` now includes `lesson.module.course` (was `lesson.module` only), needed to get the quiz's lesson ID and course title for the completion call. Purely additive; `getQuizForLearner`'s existing field access is unaffected.
- `apps/api/src/modules/progress/progress.service.ts` — extracted `upsertProgressAndHandleCompletion` (private); `updateLessonProgress` now calls it (behavior-preserving refactor); `submitQuizAttempt` now calls it when `passed`.
- `apps/api/src/modules/progress/progress.service.spec.ts` — updated the `quiz` test fixture (added `lesson.id`, `lesson.module.course`) and a default `upsertProgressAndRecomputeCompletion` mock resolution; added a new `describe('lesson completion on quiz pass/fail (Phase 29)')` block with 4 tests.
- `docs/16-API-CONTRACT.md` — documented the new side effect on `POST /progress/quizzes/:quizId/attempts`.

## Validated, not assumed

- Unit: 4 new regression tests — a passing attempt calls the completion upsert with the exact `(enrollmentId, lessonId, courseId, {progressPercent:100})`; a failing attempt calls it zero times; two passing attempts in a row call it twice with identical arguments (idempotent by construction, same upsert target both times); a passing attempt that pushes completion to 100% triggers the notify + `issueForEnrollment` calls, matching `updateLessonProgress`'s already-tested pattern exactly.
- Backend: `tsc --noEmit` clean, `eslint` clean, `nest build` clean, full suite 241/241 (237 prior + 4 new, zero regressions in the original 230+).
- Frontend: `tsc --noEmit` clean, `eslint` clean, full `next build` clean (no frontend code changed this phase — this also retroactively confirms the one late Phase 28 CSS edit that couldn't be build-verified last time is fine).
- **Live, real verification against the actual seeded course** (the same one Phase 28 found capped at 92%): confirmed still 92% (23/25) at the start of this phase. Submitted a deliberately wrong answer set to Module 3's quiz — scored 0%, `passed: false`, completion stayed at 92% (no lesson-completion side effect from a failure, confirmed). Submitted the real correct answers — scored 80%, `passed: true`, completion rose to 96% (24/25). Submitted Module 4's quiz with correct answers — scored 80%, `passed: true`, **completion reached 100% (25/25)**, reached entirely through the real quiz-submission flow, no direct database writes. Certificate check: `GET /certificates/me` returned the same certificate that already existed for this course (pre-dating this fix) — confirming `issueForEnrollment`'s idempotent "return existing, don't duplicate" path fired correctly on this genuine 100%-completion transition. A from-zero new-certificate-issuance case (a course with no pre-existing certificate) was not separately exercised this phase — noted as a minor residual verification gap, not a functional doubt (the code path is identical either way and is exercised by this codebase's own existing tests).

## Known limitations carried forward from Phase 28 (unaffected by this phase)

- `useUpdateLessonProgress` frontend hook still has the pre-existing silent-error mutation bug (unrelated to this fix).
- No aggregate "all my courses' submissions" endpoint for a multi-course instructor.
- `GET /courses/:slug` still doesn't expose learning-path membership.

## How to resume

Read `docs/phase29-completion-fix-report.md` in full. **Explicitly stopped: not beginning Phase 30, awaiting approval.**
