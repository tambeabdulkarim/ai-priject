# Phase 11.7.1 — Post-Bugfix Verification & Documentation Update Report

## 1. Files changed in this phase

Code:
- `apps/web/tests/e2e/moderator/review-actions.spec.ts` — updated to fill the new required lesson-body textarea (the test was written against the old, buggy form and needed to match the real, fixed UI). No application code changed in this phase; the lesson-creation fix itself was already applied and verified in the prior session (Phase 11.7).

Documentation:
- `docs/project-status.md` — updated
- `docs/known-issues.md` — resolved text-lesson issue removed; new moderator-visibility bug added
- `docs/restore-point-phase11.6.md` — updated (marked superseded)
- `docs/next-session.md` — updated
- `docs/phase-11.7-review-report.md` — addendum added
- `docs/restore-point-phase11.7.md` — new
- `docs/phase11.7.1-verification-report.md` — this file

No backend logic changed. No throttling changed. No unrelated code refactored.

## 2. Tests executed

Targeted only, per instruction — no full-suite run:

- `tests/e2e/instructor/workspace.spec.ts` (3 tests: Dashboard, Create Course, Course Editor/module management)
- `tests/e2e/moderator/review-actions.spec.ts` (1 test: cross-role course submission + review)

Plus a standalone Playwright verification script driving the real, rebuilt (`npm run build && npm run start`, since the frontend runs in production mode and does not hot-reload) UI and real backend directly, to confirm the fix and check regressions beyond what the two spec files exercise:
- Text lesson creation
- Quiz lesson creation (regression)
- Video lesson creation (regression)
- Module editing (regression)
- Course details editing (regression)

## 3. Results

| Check | Result |
|---|---|
| Instructor Dashboard | Pass |
| Instructor Create Course | Pass |
| Instructor Course Editor (module management) | Pass |
| Text Lesson creation (real UI, real backend) | **Pass — `201 Created`, lesson visible in UI** (previously `400`) |
| Quiz Lesson creation | Pass — `201 Created`, unaffected |
| Video Lesson creation | Pass (expected) — `400 "video lessons require videoMediaId"`, unchanged pre-existing behavior (no Media-creation endpoint exists anywhere in the app; unrelated to this fix) |
| Module editing | Pass |
| Course details editing | Pass |
| Moderator Review Actions (full spec) | **Fail** — see §4 |

`npx tsc --noEmit` on `apps/web`: clean.

## 4. Regressions found

**None caused by this fix.** The frontend change was scoped to the create-lesson form only (added state + a conditional textarea + one field in the mutation payload). It does not touch:
- Course creation/editing code paths (`handleSaveDetails`, `useUpdateCourse`) — unchanged, verified working.
- Lesson editing (`handleSaveLesson`, `useUpdateLesson`) — unchanged, uses its own pre-existing body textarea, not touched.
- Module creation/editing (`handleAddModule`, `handleSaveModule`) — unchanged, verified working.
- Module or lesson ordering — no module-reorder UI exists in this app (a separate, pre-existing, documented backend gap — "No module-reorder endpoint," per this file's own header comment); no drag-and-drop lesson-reorder UI is wired up either, so neither was touched or is at risk.
- API payloads/validation for any other endpoint — no backend files were changed in this fix or this phase.

**One pre-existing bug was newly exposed, not introduced.** `moderator/review-actions.spec.ts` still fails, but at a *different, later* point than before: lesson creation now succeeds and the course is successfully submitted for review, but when the moderator navigates to review it, `GET /courses/:slug` returns a real `404`. Root cause: `apps/api/src/common/utils/authorization.ts`'s `EDITORIAL_ROLES = ['content_editor', 'admin', 'superadmin']` does not include `moderator`, so `CoursesService.getBySlug()` (`apps/api/src/modules/courses/courses.service.ts`) refuses to return a non-published course to a moderator. This logic was never exercised by this test before, because the lesson-creation bug always failed the test first. It is documented in `docs/known-issues.md` and was **not** fixed here (backend logic change, explicitly out of scope for this phase).

## 5. Remaining risks

- The full 44-test E2E suite has not been re-run in this phase (by instruction). The last full-suite numbers (30 passed / 14 failed) predate this fix and are stale for the lesson-creation item specifically; they have not been refreshed end-to-end.
- The newly-discovered moderator-visibility bug will continue to fail `moderator/review-actions.spec.ts` in any future full-suite run until it is fixed. This is expected and documented, not a surprise for the next session.
- No new automated test was added specifically asserting the `201 Created` / lesson-visible outcome beyond the existing E2E test and the manual verification script (which is not part of the committed test suite).

## 6. Recommendation

**Ready for Phase 12? NO — not without a decision first.**

The originally-scoped bug (text lesson creation) is fully resolved and verified with no regressions. However, verifying it surfaced a second real, user-facing bug (moderators cannot open non-published courses to review them) that blocks the same core workflow this phase was checking. Recommend one of:

- **Option A:** Fix the moderator-visibility bug now (add `'moderator'` to `EDITORIAL_ROLES`, or a narrower moderator-specific check) as a small, well-isolated backend change, then re-verify `moderator/review-actions.spec.ts`, then proceed to Phase 12.
- **Option B:** Defer it as a documented known issue (already recorded in `docs/known-issues.md` and `docs/restore-point-phase11.7.md`) and proceed to Phase 12 Documentation Freeze as-is, with this bug explicitly called out as a pre-existing gap the freeze does not resolve.

No further action taken in this phase pending that decision, per instructions not to start Phase 12 yet.
