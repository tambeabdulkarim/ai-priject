# Restore Point

**Version:** Phase 11.7.2

**Status:** Stable

**Date:** 2026-08-04

## Current Project State

- E2E test harness (worker-scoped role fixtures, batch execution strategy) from Phase 11.6 remains in place and unchanged.
- Text-lesson-creation bug fixed in the frontend Course Editor and verified (Phase 11.7.1).
- Moderator course-visibility bug fixed in the backend authorization layer and verified (Phase 11.7.2). The full Moderator Review workflow now works end-to-end, confirmed via a real-browser E2E run and a 14-point direct API authorization check.
- No open bugs remain blocking the moderation workflow.

## Resolved Issues

- Text Lesson Creation (`POST /courses/:id/modules/:id/lessons` → `400 "text lessons require body"`). Root cause: frontend create-lesson form never collected a body value. Fixed and verified. See `docs/bugfix-text-lesson-body.md`.
- Moderator Course Visibility (`GET /courses/:slug` → `404` for moderators viewing non-published courses). Root cause: `CoursesService.getBySlug()` reused the edit-authorization role set (`EDITORIAL_ROLES`) to also gate read access; `moderator` was correctly excluded from edit rights but was incorrectly excluded from view rights too. Fixed with a new, narrow, read-only `canViewAsModerator()` check (`apps/api/src/common/utils/authorization.ts`), used only in `getBySlug`. `EDITORIAL_ROLES`, `isOwnerOrEditorial`, and `assertOwnerOrEditorial` — the functions guarding edit/publish/archive — were not touched. See `docs/phase11.7.2-report.md`.

## Remaining Limitations

- Backend global rate limiter (120 req/min) — known environment limitation, not a code defect. See `docs/known-issues.md`.

## Safe Resume Point

Phase 12 — Documentation Freeze. No open decision blocking it.
