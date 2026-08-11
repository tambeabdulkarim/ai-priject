# Restore Point

**Version:** Phase 13.4

**Status:** Verified, but not closed — one blocking issue remains (Verdict B)

**Date:** 2026-08-04

## Current Project State

Phase 13 (Media system: architecture design, backend implementation, frontend implementation, and full integration verification) is functionally complete. Phase 13.4's full live verification pass against the real, unmodified backend and frontend found the entire Media system's application logic, security, and integration to be correct and complete — with one real, disclosed infrastructure gap preventing full sign-off.

- Media backend (`Media` Prisma model, `MediaService`, magic-byte MIME detection, `BigInt` JSON shim) implemented in Phase 13.2.
- Media frontend (`MediaPreview`, `MediaUploader`, `MediaPicker`, Media Library page, Course Editor integration) implemented in Phase 13.3, along with `File.deletedAt` soft delete and owner-or-admin-capable delete authorization.
- Phase 13.3 discovered and fixed a real bug: video lessons were never actually creatable via the real UI (backend requires `videoMediaId` at creation; the old create-lesson form never collected one). Fixed by requiring media selection via `MediaPicker` at creation time.
- Phase 13.4 performed a full, live, no-mocks verification pass: every downstream step of the Media flow (File→Media, Media Library, Media Picker, Course Editor attach, Preview degradation, soft delete, authorization, entitlement) verified correct against the real backend/frontend, using directly-seeded `File`/`Media` rows to stand in for the one step that requires real object storage. Full regression suite re-run live: nothing regressed; video-lesson creation confirmed fully working end-to-end for the first time with a real selectable media item.
- No code was modified in Phase 13.4 — it was verification-only.

## Resolved Issues (cumulative, Phase 13)

- Video lesson creation was fully blocked at the UI level (backend rule not matched by frontend form). Fixed in Phase 13.3 by requiring `MediaPicker` selection at lesson-creation time; fully verified working end-to-end in Phase 13.4 with a real, selected media item.
- Soft delete consistency (backend/frontend) verified with zero divergence — the frontend has no independent filtering logic, so it inherits the backend's exclusion of deleted files automatically.
- Authorization/ownership/access control across all Media endpoints (view, delete, signed-URL request) verified correct: 401 no token, 403 non-owner, 404 deleted/invalid, owner passes entitlement.

## Remaining Limitations (deferred, not blocking Media's code correctness, but blocking Media's production sign-off)

- **`STORAGE_ENDPOINT`/`STORAGE_BUCKET`/`STORAGE_ACCESS_KEY_ID`/`STORAGE_SECRET_ACCESS_KEY` are all empty** in this environment (confirmed via direct read of `apps/api/.env` and `apps/api/src/config/configuration.ts`). This blocks real verification of: the upload-to-storage leg, real signed-URL generation/expiration, and real media playback. Not a code defect — an infrastructure/operations gap, first disclosed in Phase 11, reconfirmed in Phase 13.2/13.3, precisely documented in Phase 13.4. See `docs/known-issues.md` and `docs/phase13.4-integration-report.md`.
- No malware-scanning engine is integrated (`File.scanStatus` never leaves `'pending'`), so the real `425` "still scanning" gate is permanently active for any real file today. Pre-existing, platform-wide, not specific to Media.
- Backend global rate limiter (120 req/min) — unchanged, pre-existing environment characteristic, not a Phase 13 concern.
- Image lesson content type does not exist in this schema (lessons are video/text/quiz only) — not a gap, a correct non-feature, confirmed and reported as such rather than invented.
- Marketplace and user-avatar image upload have no Media system integration anywhere in the frontend — confirmed by search; nothing to regress, nothing implemented.

## Safe Resume Point

**Do not proceed to Phase 14.** Per Phase 13.4's explicit instructions, a real technical blocker was discovered (missing storage credentials), so the phase stops here rather than continuing. The only action required to resume is an infrastructure one: provision real S3-compatible object storage credentials (`STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`) for this environment. Once provisioned, re-run the storage-dependent checks described in `docs/phase13.4-integration-report.md` (Task 2's real upload leg and playback; Task 4's real signed-URL mint/fetch/expire) to close Phase 13 completely, then proceed to Phase 14.

No code changes are pending or required to resolve this blocker.

## Restorability

**Recommended starting point:** `docs/documentation-index.md` — project status, restore points, architecture, API, frontend, backend, testing, deployment, reports, known issues, next session, historical reports, and archive, all in one place.

**Guaranteed minimum fallback** — if only the following four files survive, this project's Phase 13 state (including the exact blocker and how to clear it) can still be fully reconstructed, with no dependency on conversation history, by reading them in this order:

1. `docs/project-status.md` — what phase, what's done, current result, next candidate.
2. `docs/known-issues.md` — what's still open and why, including the Object Storage Not Configured and No Malware Scanning entries added in Phase 13.4.
3. `docs/next-session.md` — what to read first, the one pending decision (provision storage credentials), and what to do once it's resolved.
4. `docs/restore-point-phase13.4.md` (this file) — the authoritative snapshot and pointer to `docs/phase13.4-integration-report.md` for the full verification detail.
