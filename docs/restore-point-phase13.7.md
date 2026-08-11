# Restore Point

**Version:** Phase 13.7

**Status:** Object storage blocker resolved — real, live, end-to-end verification passed against a hosted provider (Backblaze B2)

**Date:** 2026-08-05

## Current Project State

Phase 13 (Media system: architecture, backend, frontend, integration verification, storage-infrastructure validation, provisioning, and now live verification) is **complete**. Phase 13.6 left one real, precisely-diagnosed blocker: this environment's Docker Desktop cannot run any container (WSL2 not installed, requires administrator elevation to fix — confirmed again this session via `IsInRole(Administrator)` returning `false`, and no alternate container runtime is installed). Rather than wait on an operator to fix Docker, Phase 13.7 bypassed it by switching to a hosted S3-compatible provider.

- **Storage provider switched:** `apps/api/.env`'s `STORAGE_*` values changed from local MinIO placeholders to real Backblaze B2 credentials — `STORAGE_ENDPOINT=https://s3.us-east-005.backblazeb2.com`, `STORAGE_BUCKET=phoenix-storage`, `STORAGE_REGION=us-east-005`, plus a real access key ID/secret. `.env` remains git-ignored (`git check-ignore -v` re-confirmed before writing).
- **`apps/api/.env.example` updated:** MinIO-specific placeholder comments replaced with generic Backblaze B2 / S3-compatible guidance. No real values in this file.
- **Path-style addressing verified, not re-implemented:** `forcePathStyle: true` was already hardcoded unconditionally in `apps/api/src/storage/storage.service.ts`'s `S3Client` constructor (applies to every provider). No `STORAGE_FORCE_PATH_STYLE` env var exists or was needed — would have been dead configuration.
- **Backend rebuilt:** cleared a stale `tsconfig.tsbuildinfo` incremental-build cache (same recurring issue class as Phase 13.6 and earlier — `"incremental": true` in `packages/config/base.tsconfig.json` combined with `nest build`'s `deleteOutDir` can leave `tsc` believing a build is current when `dist/` doesn't actually exist), then a clean `nest build` produced a working `dist/main.js`.
- **Backend restarted and live-verified:** startup log confirmed `[StorageService] Storage configured: endpoint=https://s3.us-east-005.backblazeb2.com bucket=phoenix-storage region=us-east-005`. All modules (Payments, Orders, Admin, AI, News, Notifications, Certificates, Enrollments, Products, Library, etc.) initialized cleanly; Prisma connected to the real (Neon) database.
- **Full real upload chain executed, zero mocks:**
  1. Registered a real test user via `POST /auth/register` (`201`).
  2. Logged in via `POST /auth/login` (`200`).
  3. Requested a presigned upload URL via `POST /files/upload-url` (`201`, real SigV4 URL).
  4. Performed a real `PUT` of a valid 68-byte PNG (correct magic bytes) directly to the presigned URL against the real B2 endpoint (`200`).
  5. Called `POST /files/:uploadId/complete` (`201`) — the backend read the object back from B2 via `readObjectPrefix`, correctly detected `image/png` via magic-byte sniffing (not trusting the client-claimed type), and created real `File` + `Media` rows.
  6. Independently confirmed the object existed in the bucket via a direct `HeadObjectCommand` (not through the app) — `contentLength: 68`, matching.
  7. Issued a `DeleteObjectCommand` against the same key.
  8. Re-issued `HeadObjectCommand` — returned `NotFound`, confirming the test object was actually removed from the bucket. No leftover test object remains in `phoenix-storage`.
- **No Media business logic, upload-flow design, or API contract was changed.** All code-adjacent changes are the two `.env*` files; no `.ts` source file was modified.

## Resolved Issues (cumulative, Phase 13)

- Video lesson creation (Phase 13.3, verified Phase 13.4) — unaffected, unchanged.
- Soft delete and authorization/ownership consistency (Phase 13.4/13.5) — unaffected, unchanged.
- Missing storage credentials (Phase 13.5: classified as missing configuration; Phase 13.6: local MinIO configuration provisioned but Docker-blocked) — **now fully resolved (Phase 13.7): real, live, end-to-end verification against a real, reachable, hosted bucket, with cleanup confirmed.**

## Remaining Limitations (deferred, not blocking Media, not blocking Phase 13 closure)

1. Docker cannot run containers in this environment (Linux VM backend unreachable, WSL2 not installed, requires administrator elevation) — still true, still unresolved. No longer relevant to Storage (moved to B2); still blocks local MinIO/Meilisearch specifically if either is wanted for other purposes later.
2. Real bucket-privacy ACL and real signed-URL-expiration *enforcement* (the TTL *values* are already confirmed correct, both in Phase 13.6's generated URLs and unchanged in this session's code path) remain unverified live against B2 specifically.
3. Real storage performance (actual upload/download throughput) against B2 remains unmeasured.
4. Minor, cosmetic: `completeUpload` reports a generic "unrecognized file type" `400` for storage-connectivity failures too, instead of a distinct error. Real cause is always logged clearly server-side regardless.
5. No malware-scanning engine exists (`File.scanStatus` never leaves `'pending'`) — pre-existing, platform-wide, unrelated to object storage.
6. Backend global rate limiter (120 req/min) — unchanged, pre-existing.
7. A real test user account and its File/Media/audit-log rows from this phase's live verification remain in the production (Neon) database — intentionally not deleted (no cascade-delete path from `User`; deleting audit-log rows would conflict with this project's audit-log-preservation principle). Harmless.
8. **Larger, more consequential finding (not storage-related):** `docs/phase-14-plan.md` found this doc chain (project-status.md/known-issues.md/next-session.md/restore points) had, prior to this restore point, only ever tracked E2E stabilization and Media — the actual repository contains a much larger already-built platform (Payments, Orders, Admin, AI, News, Notifications, Certificates, Enrollments, Products, Library — 166/166 backend tests passing) that was never reflected here. Partially corrected in this restore point and `project-status.md`/`known-issues.md`/`next-session.md`; full reconciliation is `phase-14-plan.md`'s recommended first task.

## Safe Resume Point

**Phase 13 is closed.** Proceed to Phase 14 per `docs/phase-14-plan.md` — Step 4 recommends documentation reconciliation first (cheap, zero regression risk, corrects the scope gap in item 8 above), then Admin MFA as the first code task (closes a disclosed, self-documented security gap on already-shipping admin functionality).

No further storage-related code changes are pending. `apps/api/.env` and `apps/api/.env.example` are the only files touched this phase.

## Restorability

**Recommended starting point:** `docs/documentation-index.md`, then `docs/phase-14-plan.md` for what to actually do next.

**Guaranteed minimum fallback** — if only the following four files survive, Phase 13's closed state (including how the Docker blocker was bypassed, and the live verification evidence) can be fully reconstructed:

1. `docs/project-status.md` — current phase (13.7, closed), what's done, next candidate (Phase 14, per `phase-14-plan.md`).
2. `docs/known-issues.md` — "Object Storage — RESOLVED (Phase 13.7)" entry with the full verification table; "Docker Cannot Run Containers" entry (still true, no longer blocking).
3. `docs/next-session.md` — what to read first, the decision point (documentation reconciliation → Admin MFA), explicit warnings preserved from prior phases.
4. `docs/restore-point-phase13.7.md` (this file) — the authoritative snapshot.
