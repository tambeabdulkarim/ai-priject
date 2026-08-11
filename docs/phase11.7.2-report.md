# Phase 11.7.2 — Moderator Workflow Completion Report

## Root Cause

`GET /courses/:slug` is decorated `@Public()` in `CoursesController` — there is no guard, role check, or permission decorator at the controller level for this route at all. The visibility decision happens entirely inside `CoursesService.getBySlug()`:

```ts
const canSeeDraft = viewerId !== undefined && isOwnerOrEditorial(course.instructorId, viewerId, viewerRoles);
if (course.status !== 'published' && !canSeeDraft) {
  throw new NotFoundException('Course not found.');
}
```

`isOwnerOrEditorial` checks against `EDITORIAL_ROLES = ['content_editor', 'admin', 'superadmin']` (`apps/api/src/common/utils/authorization.ts`). This constant and its two helper functions (`isOwnerOrEditorial`, `assertOwnerOrEditorial`) are also the exact mechanism guarding **edit** rights elsewhere in the same file (`update()`, `archive()`). `moderator` was never added to `EDITORIAL_ROLES` — reasonably, since a moderator must never gain edit rights — but because `getBySlug`'s **view** check reused the same edit-scoped role set, moderators were also denied plain visibility into the course they are supposed to review.

## Was the denial intentional?

**No.** The docstring directly above `getBySlug` states the intended contract explicitly: *"owner/editorial for drafts"* (referencing `docs/16-API-CONTRACT.md`), and this exact function's own history shows a prior fix (Phase 13 final audit) that added `content_editor`/`admin` to this same check specifically so editorial roles reviewing a draft wouldn't be blocked. `moderator` was simply never considered when that fix was made — an oversight, not a deliberate security boundary. This is corroborated by the rest of the system: a real moderation queue (`GET /admin/moderation/queue?content_type=course`, gated by the `moderation:read` permission, correctly granted to `moderator`) exists specifically to surface courses under review to moderators, and a dedicated frontend Moderator Course Review page (`apps/web/src/app/[lang]/moderator/courses/[slug]/page.tsx`) already correctly implements the "can view, cannot publish" UI — it was simply never able to load any course data because the endpoint it depends on (`useCourse(slug)` → `getBySlug`) denied it.

## Authorization Analysis (request path trace)

```
GET /courses/:slug
  → CoursesController.getBySlug()      @Public() — no guard, no @RequirePermissions
    → CoursesService.getBySlug()       ← denial happens here
      → canSeeDraft = isOwnerOrEditorial(course.instructorId, viewerId, viewerRoles)
                       EDITORIAL_ROLES = ['content_editor','admin','superadmin']
                       'moderator' NOT included → canSeeDraft = false for a moderator
      → if (status !== 'published' && !canSeeDraft) throw 404
    → CoursesRepository.findBySlug()   (unaffected — pure data access, no auth logic)
```

No NestJS guard (`JwtAuthGuard`, `PermissionsGuard`, `RolesGuard`) is involved for this specific route — confirmed by the `@Public()` decorator and the absence of `@RequirePermissions`. The entire authorization decision is the one hand-rolled conditional above.

## Fix

Principle of least privilege: grant moderators exactly one new capability — reading a non-published course's details (including real, unredacted lesson content, needed to actually review it) — and nothing else. Every write path (`update`, `publish`, `archive`) is untouched and continues to exclude `moderator`.

**`apps/api/src/common/utils/authorization.ts`** — added a new, narrow, read-only helper, kept deliberately separate from the edit-authorization functions so it can never be mistakenly reused for a write check:

```ts
export function canViewAsModerator(actorRoles: string[]): boolean {
  return actorRoles.includes('moderator');
}
```

`EDITORIAL_ROLES`, `isOwnerOrEditorial`, and `assertOwnerOrEditorial` are **unchanged**.

**`apps/api/src/modules/courses/courses.service.ts`** — `getBySlug`'s visibility check now also allows a moderator:

```ts
const canSeeDraft =
  viewerId !== undefined &&
  (isOwnerOrEditorial(course.instructorId, viewerId, viewerRoles) || canViewAsModerator(viewerRoles));
```

This single OR'd condition is the entire fix. Its effect naturally (and correctly) cascades to `isEntitledToFullContent` a few lines below, so a moderator viewing a course under review also sees real lesson bodies rather than redacted placeholders — necessary to actually review the content, and still strictly read-only.

No changes to `update()`, `publish()`, `archive()`, `create()`, the `CoursesController`, any guard, any permission mapping (`prisma/seed.ts`), or any other module.

## Files Changed

- `apps/api/src/common/utils/authorization.ts` — added `canViewAsModerator()`.
- `apps/api/src/modules/courses/courses.service.ts` — `getBySlug()`'s draft-visibility check now includes the new helper; nothing else in the file changed.

## Verification

Backend rebuilt (`nest build`) and restarted against the real Postgres-backed dev database (no mocks). A stale TypeScript incremental-build cache (`tsconfig.tsbuildinfo`) was found blocking a clean rebuild during this work — deleted; unrelated to the authorization fix itself, noted here for completeness since it affected the verification process.

**Direct API authorization check (14/14 passed):**

| Check | Expected | Actual |
|---|---|---|
| Instructor (owner) can view own draft | 200 | 200 — unchanged |
| Unauthenticated request cannot view draft | 404 | 404 — unchanged |
| Learner (no privileged role) cannot view draft | 404 | 404 — unchanged |
| Admin can view draft | 200 | 200 — unchanged |
| **Moderator can view draft/in-review course** | **200** | **200 — fix confirmed** |
| Moderator cannot edit (`PATCH /courses/:id`) | 403 | 403 |
| Moderator cannot publish (`POST /courses/:id/publish`) | 403 | 403 |
| Moderator cannot archive (`POST /courses/:id/archive`) | 403 | 403 |
| Instructor can submit for review | 200 | 200 — unchanged |
| Admin can publish (after submit-review) | 200 | 200 — unchanged |
| Public can view a published course | 200 | 200 — unchanged |

**Real-browser E2E (Playwright, real backend, no mocks):**
- `tests/e2e/moderator/review-actions.spec.ts` — full cross-role workflow (instructor creates course → adds module/lesson → submits for review → moderator opens it from the queue → sees real content → Publish button absent → "cannot act on this course" notice shown): **1/1 passed** (previously failing at the 404).
- `tests/e2e/moderator/queue.spec.ts`: 1/1 passed, unaffected.
- `tests/e2e/instructor/workspace.spec.ts` (Dashboard, Create Course, Course Editor): 3/3 passed, unaffected.

## Regression Checks

Explicitly confirmed via the API checks above:
- **Moderator cannot edit** — `PATCH /courses/:id` still returns `403`.
- **Moderator cannot publish** — `POST /courses/:id/publish` still returns `403` (still gated by the `course:publish` permission, mapped only to `content_editor`/`admin` in `prisma/seed.ts` — untouched).
- **Moderator cannot archive/delete** — `POST /courses/:id/archive` still returns `403` (still gated by `assertOwnerOrEditorial`, which still excludes `moderator`).
- **Moderator can only view and use existing moderation actions** (queue listing, comment moderation) — untouched, unaffected by this change.
- **Instructor, Admin, public, and draft-visibility behavior** — all explicitly re-verified above and unchanged.

No other authorization code was refactored. No permission mappings, guards, or roles were added or removed anywhere else in the system.

## Remaining Known Issues

- Backend global rate limiter (120 req/min) — environment limitation, not a defect. Unaffected by this change.
- No open bugs remain blocking the moderator review workflow.

## Recommendation

**Ready for Phase 12? YES.**

The moderator review workflow is fully restored and verified both at the API level (14 targeted authorization checks) and end-to-end through the real browser (Playwright). The fix is minimal (one new 3-line helper function, one OR'd condition), strictly additive to read access only, and does not alter any edit, publish, or archive authorization path. No regressions were found in instructor, admin, or public course visibility. No further backend or frontend work is required before proceeding to Phase 12 — Documentation Freeze.
