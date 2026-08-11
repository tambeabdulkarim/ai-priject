# Phase 29 — Fix Quiz-Lesson Completion & Certificate Eligibility: Final Report

**Date:** 2026-08-09 · Fixes the one limitation Phase 28 explicitly documented rather than bypassed (`docs/known-issues.md`, "Quiz-Type Lessons Never Marked Complete").

## What Was Fixed

A course containing a quiz-type lesson could never reach 100% completion, and therefore could never trigger new certificate issuance — because passing a quiz never marked its lesson complete anywhere in the codebase. This is now fixed: a passed quiz attempt marks its lesson complete through the same mechanism any other lesson uses, course completion recalculates correctly, and certificate eligibility (already correctly implemented, untouched) can now actually be reached.

## Root Cause

Two independent, correct-in-isolation pieces of code that never connected:

1. `updateLessonProgress` (`PUT /progress/lessons/:lessonId`) marks a lesson complete by upserting `LessonProgress.completedAt`, recomputing `Enrollment.completionPercent`, and — on the transition into 100% — notifying the learner and calling `certificatesService.issueForEnrollment`.
2. `submitQuizAttempt` (`POST /progress/quizzes/:quizId/attempts`) scores a quiz and records a `QuizAttempt`, but never called anything from (1).

The frontend correctly never shows a "mark complete" button for quiz-type lessons (viewing ≠ passing), so nothing else in the system ever completed a quiz lesson's `LessonProgress` row either. `certificatesService.issueForEnrollment` was never the problem — it already independently re-validates every quiz in the course has a passing `QuizAttempt` before issuing (found and confirmed correct during Phase 28's investigation); it simply was never being reached because `completionPercent` could never hit 100.

## Architectural Fix

Extracted the shared completion flow out of `updateLessonProgress` into one private method on `ProgressService`:

```
upsertProgressAndHandleCompletion(userId, enrollment, lessonId, courseId, courseTitle, data)
  → progressRepository.upsertProgressAndRecomputeCompletion(...)   [existing, unchanged]
  → if this write crossed into 100% completion:
      → notificationsService.create({ type: 'course.completed', ... })   [existing, unchanged]
      → certificatesService.issueForEnrollment(updatedEnrollment)        [existing, unchanged]
```

`updateLessonProgress` now calls this method (behavior-preserving — same calls, same order, same arguments as before). `submitQuizAttempt` now calls the identical method, with `progressPercent: 100`, whenever the attempt's `passed` flag is `true`. A failed attempt calls nothing.

No second completion mechanism was created. No certificate rule was touched. No schema change was needed — `LessonProgress`, `Enrollment.completionPercent`, and `Certificate` all already modeled exactly what was needed; only the missing call was added.

## Files Changed

- `apps/api/src/modules/progress/progress.repository.ts` — `findQuizWithQuestions`'s `include` extended from `lesson.module` to `lesson.module.course`, so the quiz's lesson ID and course title are available for the completion call. Purely additive; `getQuizForLearner`'s existing field access unaffected.
- `apps/api/src/modules/progress/progress.service.ts` — extracted `upsertProgressAndHandleCompletion` (private); `updateLessonProgress` refactored to call it (no behavior change); `submitQuizAttempt` now calls it on `passed`.
- `apps/api/src/modules/progress/progress.service.spec.ts` — updated the shared `quiz` test fixture; added 4 new regression tests.
- `docs/16-API-CONTRACT.md` — documented the new side effect on the quiz-attempt endpoint.

## Tests Before/After

Before this phase: 237/237 backend tests (234 + the 3 Phase 28 scoring-fix regression tests). After: **241/241** — the 4 new tests below, zero regressions anywhere else.

1. A passing attempt marks the lesson complete — asserts `upsertProgressAndRecomputeCompletion` is called with the exact `(enrollmentId, lessonId, courseId, {progressPercent:100})`.
2. A failing attempt does not — asserts the same method is called zero times.
3. Idempotency across repeated passing attempts — two passing submissions call the completion upsert twice with identical arguments each time (the same enrollment+lesson target both times, which is what makes the underlying Prisma `upsert` idempotent rather than duplicate-creating — proven at the repository level, not re-derived here).
4. A passing attempt that crosses into 100% completion triggers the notification + certificate-issuance calls, exactly mirroring the already-existing, already-tested `updateLessonProgress` assertion for the same transition.

## Backend Verification

`tsc --noEmit`: clean. `eslint`: clean (0 warnings). `nest build`: clean. Full test suite: 241/241.

## Frontend Verification

No frontend code was changed this phase. Verified anyway per Step 5: `tsc --noEmit` clean, `eslint` clean, and — notably — the full `next build` completed cleanly this time, which also retroactively confirms the one Phase 28 CSS-only edit (`flexWrap` on the lesson prev/next nav) that couldn't be build-verified last session due to a tool-execution disruption is in fact fine.

## Real Learner Journey Verification

Against the real running API and the same real seeded course Phase 28 found capped at 92%:

1. Confirmed starting state: 92% (23/25 lessons), unchanged from Phase 28.
2. Fetched Module 3's real quiz via `GET /progress/quizzes/:quizId`.
3. Submitted deliberately wrong answers — real backend score 0%, `passed: false`. Completion re-checked: still 92%. **Confirms a failed attempt has no completion side effect.**
4. Submitted the real correct answers (matching the seed data's `correctAnswer` values) — real backend score 80%, `passed: true` (passing threshold 75%). Completion re-checked: **96% (24/25)** — the lesson was marked complete through the real quiz-submission flow, no direct database writes.
5. Fetched Module 4's real quiz, submitted its real correct answers — score 80%, `passed: true`. Completion re-checked: **100% (25/25)**.
6. Checked `GET /certificates/me` for this course: returned the certificate that already existed for this enrollment (issued before Phase 27's content additions, per Phase 28's report) — confirming `issueForEnrollment`'s idempotent existing-certificate path fired correctly on this genuine 100%-completion transition, without creating a duplicate.

## Course Completion Percentage

**Before this phase: 92% (23/25 lessons), capped — could not reach 100% via any existing flow (Phase 28 finding).**
**After this phase: 100% (25/25 lessons), reached legitimately through two real, correctly-scored quiz submissions.**

## Certificate Eligibility Result

Confirmed reachable and functioning: the 100%-completion transition correctly invoked `certificatesService.issueForEnrollment`, which correctly found this enrollment already had a certificate (from before this course's content grew to include quiz lessons) and returned it idempotently rather than duplicating it. The from-zero "brand-new certificate never issued before" path was not separately exercised against a different course this phase (this course already had one); that specific code path is unchanged by this fix and is covered by this codebase's pre-existing Phase 13/25 tests, so it is not considered an open question — noted here only for completeness, not as a functional gap.

## Remaining Issues

- No frontend change was needed or made — the existing `QuizRunner` component already surfaces `attempt.passed`/`scorePercent` from the real backend response; the newly-correct completion behavior is transparent to it.
- `useUpdateLessonProgress`'s pre-existing silent-error mutation bug (documented in the Phase 28 report) remains unfixed — unrelated to this phase's scope.
- No aggregate "all my courses' submissions" endpoint for a multi-course instructor — unchanged, unrelated.
- `GET /courses/:slug` still doesn't expose learning-path membership — unchanged, unrelated.

## Exact Next Recommended Phase

With the quiz-completion gap closed, the two Phase 28-identified content-production items remain the clearest next scope: UI/UX Design Foundations and DevOps Foundations are both still partially authored (2 of their planned modules each, per Phase 27). No other architectural gaps are currently known and documented as open.

**Explicitly stopped. Not beginning Phase 30.**
