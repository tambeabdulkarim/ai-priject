# Bugfix: Text Lesson Creation Fails with "text lessons require body"

**Date:** 2026-08-04
**Status:** Resolved

## Root Cause

Purely a frontend gap — no field renaming, no DTO mismatch, no backend defect.

The Course Editor's "Add lesson" create form (`apps/web/src/app/[lang]/instructor/courses/[id]/edit/page.tsx`) only ever collected a `title` and `contentType`. It never rendered a body input and never included a `body` value in the create-lesson payload, for any content type.

The backend's `LessonsService.create()` (`apps/api/src/modules/lessons/lessons.service.ts`) enforces a deliberate, correct business rule: a lesson with `contentType: 'text'` must have non-empty `body` content, since a text lesson with no text is meaningless. This validation was working exactly as intended — it was correctly rejecting requests that omitted required content, not misconfigured.

The full field-name chain was traced and confirmed consistent end-to-end with no mismatch:

```
CreateLessonRequest (packages/types/src/lessons.ts)   body?: string
  → useCreateLesson (apps/web/src/hooks/useInstructorLessons.ts)   spreads body through unchanged
    → apiClient.lessons.createLesson(...)                          passes body through unchanged
      → POST /courses/:courseId/modules/:moduleId/lessons
        → CreateLessonDto (apps/api/.../dto/create-lesson.dto.ts)  @IsOptional() @IsString() body?: string
          → LessonsService.create()                                requires body when contentType === 'text'
```

The only broken link was one step earlier: the React form itself never gave the user a way to enter a body, so `newLessonBody` never existed and was never sent — for `text` lessons the payload always arrived with `body: undefined`, which correctly failed the backend's own validation every time.

The Edit-lesson form (same file) already had the correct pattern — a conditional `<textarea>` shown only when `contentType === 'text'` — the Create-lesson form simply never got the equivalent field when it was originally built.

## Files Changed

- `apps/web/src/app/[lang]/instructor/courses/[id]/edit/page.tsx`
  - Added `newLessonBody` state.
  - Added a conditional `<textarea>` to the create-lesson form, shown only when `newLessonContentType === 'text'`, mirroring the existing edit-lesson form's pattern.
  - `handleAddLesson` now includes `body: newLessonContentType === 'text' ? newLessonBody : undefined` in the mutation payload, guards against submitting a text lesson with an empty body client-side (matching the real backend rule), and resets `newLessonBody` on success.

No backend files changed. No DTO, service, or validation logic changed — the backend was correct.

## Why It Happened

The create-lesson form was built without a body field, likely because content-type-conditional fields were only added to the edit-lesson form. The gap went unnoticed until Phase 11.6 E2E stabilization work exercised the real create-lesson flow end-to-end for the first time and surfaced the real `400` from the real backend.

## How It Was Fixed

Added the missing body textarea to the create-lesson form and wired it into the create payload, conditioned on `contentType === 'text'` — the same conditional pattern already proven correct in the edit-lesson form. No workaround, no test modification, no backend change.

## Verification Results

Verified against the real, running frontend (rebuilt via `npm run build` + `npm run start`, since it runs in production mode) and real backend — a Playwright script drove the actual UI:

- **Text lesson creation:** `POST .../lessons` → `201 Created`. Lesson appears in the module immediately. ✅ (previously `400`)
- **Quiz lesson creation (regression):** `POST .../lessons` → `201 Created`, unaffected by this change. ✅
- **Video lesson creation (regression):** `POST .../lessons` → `400 "video lessons require videoMediaId."` — unchanged, pre-existing, documented, unrelated backend gap (no endpoint creates a real Media record; called out explicitly in this same file's header comment). Not a regression from this fix. ✅
- **Module editing (regression):** succeeded, unaffected. ✅
- **Course details editing (regression):** succeeded, unaffected. ✅

`npx tsc --noEmit` passes clean on `apps/web`.

## Remaining Risks

- This fix was verified with a targeted script against the real running app, not a full E2E suite run (per the prior session's finding that blind full-suite re-runs conflate real results with the shared dev backend's rate-limiter state). The suite's own `moderator/review-actions.spec.ts` test, which creates a text lesson as part of its flow, should now be expected to pass on its next clean run but has not been re-verified via the Playwright suite itself.
- No new tests were added for this fix (not requested); coverage relies on the existing `moderator/review-actions.spec.ts` E2E test and the manual verification above.
