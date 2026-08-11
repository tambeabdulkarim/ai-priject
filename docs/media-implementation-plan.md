# Media Implementation Plan — Phases 13.2–13.5

Companion to `docs/media-architecture-report.md`. Planning only — no implementation has started. Each phase below lists scope, acceptance criteria, and explicit non-goals, so later phases don't silently expand earlier ones.

---

## Phase 13.2 — Backend

**Scope:**
- Prisma migration: add `Media.mediaType` index (additive, zero-downtime).
- `TRANSCODABLE_MIME_TYPES` allowlist constant (video/image/audio subset).
- `MediaService.createFromFileIfApplicable(file)` — new method, called once from `FilesService.completeUpload` after `scanStatus` reaches `clean`.
- Synchronous transcoding **stub** (explicitly documented as a placeholder, mirrors `StorageService.assertConfigured`'s "real code path, nothing to talk to yet" pattern) — creates the `Media` row and sets `transcodingStatus: pending`; does not perform real transcoding yet.
- `DELETE /files/:id` (owner or admin-capable; soft delete).
- `GET /media` (cursor-paginated; owner-scoped by default; `media:read:all` permission for admin-capable "list all").
- New `media:read:all` permission key, seeded.
- Unit tests for all new service methods (mirroring existing `*.service.spec.ts` patterns already in `files/` and `media/`).

**Acceptance criteria:**
- A video/image/audio `File` reaching `scanStatus: clean` results in a `Media` row within the same request cycle (or logged-and-retryable if the stub call fails — never blocks or fails the original upload-completion response).
- `GET /media` returns only the caller's own uploads unless they hold `media:read:all`.
- `DELETE /files/:id` is rejected for non-owners without the appropriate permission.
- All existing Files/Media endpoints' behavior is unchanged — verified by re-running their existing unit tests unmodified.

**Non-goals (explicitly deferred):** real transcoding, real thumbnails, real malware scanning, any queue infrastructure.

**Dependencies:** none — everything needed already exists (schema, storage, entitlement logic).

**Blocking items:** none.

---

## Phase 13.3 — Frontend

**Correction (Phase 13.2 Final Technical Review):** the two backend endpoints this phase's frontend work depends on — `GET /media` (list) and `DELETE /files/:id` — were confirmed **not** to exist after Phase 13.2 closed (verified directly against `media.controller.ts`/`files.controller.ts`: only `GET /media/:id` and `GET /files/:id`, single-resource fetches, exist). They were in the original architecture report's Phase 13.2 scope but were deliberately excluded from that task's narrower, explicit implementation list. This section previously assumed they were already available to consume — corrected below so Phase 13.3 doesn't start from a false premise.

**Scope:**
- **Backend prerequisite (do this first, small — same pattern as Phase 13.2's other additions):** `GET /media` (cursor-paginated, owner-scoped by default, `media:read:all` permission for admin-capable "list all" — per the architecture report §3) and `DELETE /files/:id` (owner or admin-capable; soft delete). Neither exists yet.
- `<MediaUploader>` shared component (presigned-URL upload sequence, progress, typed error states).
- `<MediaPicker>` component (select an existing asset, built on the new `GET /media`).
- Media Library page (`/instructor/media` first; admin equivalent if scoped in) — list, status, delete action.
- Type-aware `<MediaPreview>` (image/video/document/pending states).
- `packages/api-client`/`packages/types` additions for the new `DELETE /files/:id` and `GET /media` endpoints, following existing resource-file conventions exactly.

**Acceptance criteria:**
- The backend prerequisite above is real, tested, and merged before the frontend components that consume it are considered done (not necessarily before frontend *work starts* — they can be built in parallel against a stubbed response — but the phase isn't complete until both sides are real).
- Every new component is used by at least one real page (no orphaned/unused components).
- Error states from Phase 13.2's three real failure modes (quota, content-type rejection, quarantine) are each distinctly messaged, not collapsed into one generic error.
- No existing page's behavior changes yet (the Course Editor's current upload button is untouched in this phase — see 13.4).

**Non-goals:** migrating any existing page to the new components yet.

**Dependencies:** Phase 13.2 (needs real `GET /media`/`DELETE /files/:id` to build against).

**Blocking items:** none once 13.2 lands.

---

## Phase 13.4 — Integration

**Scope:**
- Migrate the Course Editor's existing inline video-upload logic to `<MediaUploader>` — a deliberate, isolated swap, verified to behave identically from a user's perspective (same button, same states, now shared code).
- Wire the Course Editor's lesson-video attach flow to `<MediaPicker>` as an alternative to fresh upload (reuse an already-uploaded video across lessons — a new capability, not present today).
- Any other page with ad hoc file handling (if found during this phase) migrated the same way.

**Acceptance criteria:**
- Existing E2E coverage for the Course Editor (`instructor/workspace.spec.ts`, `moderator/review-actions.spec.ts`'s lesson-creation step) continues to pass unmodified — this is the regression guard for the swap.
- A real video lesson, once real transcoding exists (13.2's stub is upgraded per the follow-up below), plays back — the actual feature this whole effort exists to unblock.

**Non-goals:** building the real transcoding worker itself (tracked as a named follow-up, not silently absorbed into this phase — see below).

**Dependencies:** Phase 13.3.

**Blocking items:** none for the integration itself; real end-to-end video playback additionally depends on the transcoding-stub-to-real-worker follow-up being scheduled (explicitly not assumed to happen "for free" inside this phase).

---

## Phase 13.5 — Testing

**Scope:**
- New Playwright E2E coverage: upload → complete → Media created → (stub) `transcodingStatus: pending` → Media Library shows it → delete removes it.
- Negative-path E2E: oversized upload rejected, wrong-content-type upload rejected, non-owner cannot delete another user's file.
- Backend unit tests for the new methods (already required as part of 13.2's acceptance criteria — this phase's job is running the *full* suite together and triaging any interaction effects, not authoring net-new backend tests from scratch).
- Update `docs/known-issues.md`/`docs/project-status.md` per `docs/documentation-policy.md` once this phase closes — including explicitly noting the transcoding-stub follow-up as a tracked, open item, not closing it out as if the whole Media system were now feature-complete.

**Acceptance criteria:**
- Full E2E suite (existing 44 tests + new Media tests) passes against a freshly-restarted backend, per this project's established verification pattern (batch execution, clean environment) — not a blind full-suite run.
- `docs/documentation-policy.md`'s end-of-phase checklist is followed: `project-status.md`, `known-issues.md`, `next-session.md` updated, new restore point created, `documentation-index.md` updated.

**Non-goals:** load/performance testing of the transcoding pipeline (there is no real pipeline yet — nothing to load-test).

**Dependencies:** Phase 13.4.

**Blocking items:** none.

---

## Explicit Follow-Up (not part of 13.2–13.5, named so it isn't lost)

**Real transcoding worker + real malware scanning engine.** Both require infrastructure this project doesn't have (a queue, a scan engine) and are correctly out of scope for 13.2–13.5, which close the *architectural* gap (File → Media linkage) without inventing infrastructure as a side effect. This should become its own explicitly-scoped phase once the queue/infra decision is made — flagged here so "Media is done" is never mistakenly assumed to include it.
