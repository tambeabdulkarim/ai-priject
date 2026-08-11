# Media Architecture Report — Phase 13.1

Architecture design only. No code written. Grounded in direct inspection of the real, current implementation: `apps/api/prisma/schema.prisma` (`File`, `Upload`, `Media`, `Version` models), `apps/api/src/modules/files/**`, `apps/api/src/modules/media/**`, `apps/api/src/storage/storage.service.ts`, and the frontend client layer (`packages/api-client/src/resources/{files,media}.ts`, `packages/types/src/{files,media}.ts`, `apps/web/src/hooks/useMedia.ts`).

## Framing: this is a completion, not a rewrite

A real, well-designed foundation already exists and must not be discarded or duplicated:

- **`File`** — the generic, universal record for every uploaded blob (images, videos, audio, documents, course/marketplace assets, avatars). Already has `storageKey`, `mimeType` (server-detected via magic bytes, never trusted from the client), `sizeBytes`, `scanStatus` (`pending | clean | quarantined`), `visibility` (`private | public`), and relations to every consumer that currently exists: `User`/`Author` avatars, `LibraryItem`, `Product`, `LessonFile`, `Certificate`.
- **`Upload`** — the ephemeral presigned-upload-URL tracking record (`pending | completed | expired | failed`), 1:1 with a `File` once finalized.
- **`Media`** — an optional, specialized 1:1 extension of `File` for the subset that needs transcoding (`mediaType: video | image | audio`, `durationSeconds`, `transcodingStatus: pending | processing | ready | failed`, `hlsManifestKey`).
- **`Version`** — file version/replacement history, already modeled.
- **`StorageService`** — already S3-compatible (AWS SDK v3, `forcePathStyle`, any S3-compatible endpoint via `STORAGE_ENDPOINT` — works with S3, R2, MinIO, etc.), already presigned-URL-based, already never buffers full file content server-side.
- **Entitlement logic** (`FilesService.isEntitled`, `MediaService.isEntitledThroughAnyLesson`) — already real, already covers owner / avatar-is-public / lesson-preview / active-enrollment / library-paid-download / product-paid-order / certificate-owner. This is the platform's actual access-control source of truth for media and must be extended, never bypassed or reimplemented in parallel.

**The confirmed gap** (identified in Phase 13's roadmap, now confirmed at the exact code level): nothing ever creates a `Media` row. `POST /admin/media/:id/reprocess` only resets `transcodingStatus` on an **existing** `Media` record — there is no path from "a video `File` finished uploading" to "a `Media` row exists for it." This is the single missing link this architecture closes.

---

## 1. Media Entity

No new top-level entity is proposed. `File` remains the universal record; `Media` remains its optional transcoding extension. This preserves every existing relation and every line of existing entitlement code unchanged.

**`File` (existing, unchanged fields; usage clarified):**

| Field | Purpose |
|---|---|
| `id` | UUIDv7 primary key |
| `uploadedById` → `User` | Owner; always entitled |
| `storageKey` | Unique object-storage key |
| `originalFilename`, `mimeType`, `sizeBytes` | Server-detected metadata (mime never client-trusted) |
| `scanStatus` | `pending \| clean \| quarantined` — malware scan gate |
| `visibility` | `private \| public` — avatars and public marketplace/course imagery use `public`; everything else defaults `private` |
| `createdAt`/`updatedAt` | Standard audit timestamps |

**Relations (existing, and how each category maps):**

| Asset category (from the objective) | How it's modeled today |
|---|---|
| Images (general) | `File` alone, `visibility: public` for display images |
| Videos | `File` + `Media` (`mediaType: video`) |
| Audio | `File` + `Media` (`mediaType: audio`) |
| Documents | `File` alone (no transcoding needed) |
| Course Assets | `File` via `LessonFile` (attachments) or `Media` (lesson video) |
| Marketplace Assets | `File` via `Product` relation |
| User Avatars | `File` via `User`/`Author` avatar relation, `visibility: public` |
| AI Assets | **Not yet modeled** — no relation exists because the AI feature itself is undocumented/blocked (`501`, per the Phase 13 roadmap). Deliberately deferred, see §7. |
| Future CDN | Not a schema concern — a serving-layer decision (§6/§7), `storageKey` is already CDN-path-compatible as-is |

**Indexes (existing):** `File.uploadedById`, `File.scanStatus`, `Upload.userId`, `Upload.status`, `Media.transcodingStatus`. **New index proposed:** `Media.mediaType` — the reprocess/admin/monitoring queries this design adds (§3) will filter by type, which currently has no index.

**Lifecycle (existing state machine, unchanged):**

```
Upload:  pending → completed → (File created)
                 ↘ expired (metadata TTL lapsed before completion)
                 ↘ failed (magic-byte detection rejected content)

File:    scanStatus: pending → clean → (servable)
                             ↘ quarantined → (permanently blocked, never servable)

Media:   transcodingStatus: pending → processing → ready → (servable)
                                                  ↘ failed → (reprocess re-enters pending)
```

**New lifecycle step this architecture adds** (not a new entity — a new *transition*): `File` (video/image/audio, `scanStatus: clean`) → **Media record creation** → `transcodingStatus: pending`. This is the missing edge in the existing graph, not a new graph.

---

## 2. Storage Flow

The upload/validate/store steps below are **already built and already correct** — described here for completeness and to show exactly where the new work attaches, not as new design.

1. **Upload (existing):** Client requests `POST /files/upload-url` → `FilesService` checks a role-based size quota, creates a `pending` `Upload` row, stashes claimed filename/content-type in Redis (15 min TTL, matching the presigned URL's own lifetime), returns a presigned S3-compatible PUT URL. Client uploads the bytes directly to storage — the API server never touches file content at this step.
2. **Validation (existing):** Client calls `POST /files/:uploadId/complete`. Server reads only the first 16 bytes via an HTTP Range request (never buffers the full object) and runs magic-byte detection (`detectMimeTypeFromMagicBytes`) — the client-declared content-type is never trusted. If detection fails, the `Upload` is marked `failed` and no `File` is created.
3. **Virus Scan (existing placeholder, by design):** `File.scanStatus` is created as `pending` and disclosed in code as "no scanning engine integrated in this pass." This architecture does not change that placeholder's contract — it stays a placeholder until real antivirus infrastructure is scoped as its own decision (see Risk Analysis, §9). What this architecture requires: **the new Media-creation step must run only after `scanStatus` reaches `clean`**, never before — closing a potential race where a not-yet-scanned file gets transcoded.
4. **Storage (existing):** Object lands at `uploads/{uploadId}` in the configured S3-compatible bucket. No new storage layout is required for this phase.
5. **Media Record Creation (NEW — this is the gap being closed):** When a `File` both (a) has a `mimeType` recognized as video/image/audio requiring transcoding, and (b) reaches `scanStatus: clean`, a `Media` row is created (`transcodingStatus: pending`) and a transcoding job is enqueued (§7 — background processing). This is the one new orchestration step; everything upstream of it is unchanged.
6. **Serving (existing, unchanged contract):** `GET /files/:id` and `GET /media/:id` both re-check entitlement on every request and return a short-lived presigned download URL (5 min TTL) — never a permanent public URL, never a direct storage-origin URL. `GET /media/:id` additionally gates on `transcodingStatus: ready`, returning `425` while processing.
7. **Deletion (not yet implemented — real gap, scoped as new work, §3):** No delete endpoint exists today for `File` or `Media`. This is required for a genuine "single source of truth" system (orphaned/unwanted uploads must be removable) and is included in this design as net-new, not a completion of hidden existing code.

---

## 3. Backend Architecture

Extends the existing `files` and `media` modules; does not introduce a third module, to avoid splitting ownership of one storage domain across three services.

**Controllers (existing endpoints unchanged; new endpoints proposed):**
- `FilesController` — unchanged (`POST /files/upload-url`, `POST /files/:uploadId/complete`, `GET /files/:id`).
- **New:** `DELETE /files/:id` — owner or admin-capable role only; soft-delete (see below), never a hard delete of a `clean`, referenced file.
- `MediaController` — unchanged (`GET /media/:id`, `POST /admin/media/:id/reprocess`).
- **New:** `GET /media` (paginated list, scoped to the caller's own uploads or, for admin-capable roles, all — see §6 Performance) — needed for the frontend Media Library (§4).
- **New:** internal-only worker entry point (not a public HTTP route) that consumes the transcoding queue (§7) and calls the same `MediaService` methods a real admin reprocess call would.

**Services:**
- `FilesService` gains one new responsibility: after `completeUpload` successfully sets `scanStatus` (once real scanning exists, §9) to `clean`, it calls a new `MediaService.createFromFileIfApplicable(file)` — a single, explicit hand-off point, not an event bus (see Migration Strategy, §8, for why this pattern is deliberately chosen).
- `MediaService.createFromFileIfApplicable(file)` (new): decides transcoding-eligibility from `file.mimeType` (a static, testable mapping — no magic strings duplicated across layers), creates the `Media` row, and enqueues the processing job.
- `MediaService.delete` (new): marks a `Media`/`File` pair deleted (soft) and enqueues storage-object cleanup (§7).

**Repositories:** `FilesRepository`/`MediaRepository` gain straightforward new methods (`softDeleteFile`, `createMediaForFile`, `findManyForOwner`) — no change to existing methods' signatures or behavior, so nothing that currently calls them needs to change.

**DTOs:** `CreateMediaFromFileDto` is internal (service-to-service, not client-facing — clients never directly create a `Media` row, it's always derived from a `File`). `ListMediaQueryDto` (new, client-facing) follows the exact cursor-pagination shape every other list endpoint in this codebase already uses (`docs/16-API-CONTRACT.md`'s platform-wide standard) — no new pagination convention introduced.

**Validation:** Reuses the existing magic-byte detection and role-based size-quota checks unchanged. New: an explicit, centrally-defined `TRANSCODABLE_MIME_TYPES` allowlist (video/image/audio subset) — deciding transcoding eligibility from an allowlist, not a denylist, so an unrecognized future mime type fails safe (stored as a plain `File`, never silently mis-transcoded).

**Permissions:** Reuses the existing `media:reprocess` permission for admin actions. New permission key `media:read:all` (admin-capable roles only) gates the "list everyone's media" mode of the new `GET /media` endpoint; a caller without it only ever sees their own uploads — the default, unprivileged case requires no new permission at all.

---

## 4. Frontend Architecture

Today, media handling is ad hoc — the Course Editor calls `apiClient.files.uploadFile(...)` directly with no shared upload UI. This section proposes the reusable layer that should have existed from the start, without changing how the Course Editor's existing, working upload button behaves from a user's perspective.

- **Upload component (new, shared):** a single `<MediaUploader>` used everywhere a file is attached (course lessons, product images, avatars) — wraps the existing `apiClient.files` upload-url → PUT → complete sequence, exposes progress and error state via props/callbacks instead of each page reimplementing it.
- **Media Picker (new):** a modal/inline component for choosing an *existing* already-uploaded media asset (e.g., reusing a product image across listings) — reads from the new `GET /media`/`GET /files` list endpoints. Does not exist today; every current flow only supports fresh upload, never reuse.
- **Media Library (new):** a dedicated page (likely under `/instructor/media` and an admin equivalent) listing a user's own uploads with status (scanning/ready/failed), built on the same new list endpoint as the Picker — the Picker is a constrained embed of the Library, not a separate data source.
- **Preview (new):** type-aware rendering — `<img>` for images, an HLS-aware `<video>` element for `ready` video Media, a generic icon+filename for documents, a disabled/pending state for anything not yet `clean`/`ready`.
- **Progress (new, generalized from existing single-use logic):** the Course Editor already has an inline `uploadingLessonId` pattern; this becomes the shared component's built-in state, driven by the S3 PUT request's own progress events (native `XMLHttpRequest`/`fetch` upload progress, no new backend support needed).
- **Error handling (new, generalized):** three distinct, already-real backend states must map to distinct UI messages, not one generic "upload failed": (1) quota-exceeded (`403` from `upload-url`), (2) content-type rejected by magic-byte detection (`400` from `complete`), (3) quarantined after scan (`403` from `GET /files/:id`). Today only the video-upload flow surfaces any error at all, generically.

---

## 5. Security

- **Authorization:** unchanged principle — every read re-checks entitlement on every request (no caching of "is entitled" across requests); every write requires ownership or an explicit permission key. This design adds no new bypass and widens no existing rule.
- **Ownership:** unchanged — `File.uploadedById` remains the root of the ownership chain; `Media` has no separate owner, it inherits its parent `File`'s.
- **Access control:** unchanged entitlement matrix (§ framing above); the new `GET /media` list endpoint is the only new read surface, and it defaults to owner-only, matching every other list endpoint's default scoping in this codebase.
- **Private/Public media:** unchanged `File.visibility` field — this design does not introduce a second visibility concept. Public assets (avatars, published course/marketplace imagery) already use `visibility: public` and skip the entitlement check via the existing `isAvatar`-style short-circuits; this pattern extends naturally to product/course display images without new fields.
- **Signed URLs (future):** already implemented today for both upload and download (5–15 min TTL). No change proposed for this phase. Documented here as already-satisfied rather than deferred, since the objective lists it under "future" but it already exists.

---

## 6. Performance

- **Pagination:** the new `GET /media` (and equivalent `GET /files` listing, if added later) uses the platform's existing cursor-pagination standard — no new pattern.
- **Lazy loading:** Media Library/Picker load thumbnails on-demand (intersection-observer-driven) rather than eagerly fetching every signed URL on page load — signed URLs are short-lived and cheap to mint on demand, so pre-fetching them all would be wasted work and a needless entitlement-check burst.
- **Thumbnail strategy:** deferred to the transcoding pipeline (§7) — a real thumbnail requires decoding the source, which belongs in the same background worker doing transcoding, not the request path. Until that pipeline exists, the Library/Picker fall back to a type icon, never a fabricated placeholder image.
- **Streaming strategy:** video serving already returns an HLS manifest URL (`hlsManifestKey`) rather than a single large file — adaptive bitrate streaming is already the intended design, contingent only on the transcoding pipeline (§7) actually producing HLS output, which is the real gap.
- **Caching:** presigned URLs are deliberately short-lived and must not be cached beyond their TTL; what *can* be cached safely is the entitlement decision's negative/positive result for the lifetime of a single request (already implicit) — no cross-request entitlement cache is proposed, since that would reintroduce the exact class of bug the `GET /files/:id` code comment describes having previously fixed (a stale "yes" surviving a revoked entitlement).

---

## 7. Future Scalability

- **CDN:** the existing presigned-URL model is CDN-compatible without schema change — a CDN would sit in front of the storage endpoint (or proxy presigned URLs), which is an infrastructure/deployment decision, not an application-architecture one. Nothing in this design blocks it.
- **S3 compatibility:** already satisfied (`StorageService` is S3-compatible today).
- **Object storage:** already satisfied — same point.
- **Background processing:** the one real infrastructure gap. No queue/worker system exists anywhere in this codebase (`apps/workers` is an empty scaffold, confirmed in earlier phases). This design's Media-creation step and the transcoding job it enqueues both *require* a real queue to be production-correct — until one exists, the enqueue step must degrade to a synchronous, best-effort inline call (see Migration Strategy, §8) rather than blocking on infrastructure that doesn't exist yet.
- **Transcoding:** genuinely new capability, no existing code to build on. Scoped as its own, clearly-bounded worker responsibility (consume queue → fetch source → transcode → produce HLS output + thumbnail → update `Media.transcodingStatus`/`hlsManifestKey`) — deliberately kept out of the request/response path entirely.
- **AI Assets (from the objective's category list):** correctly *not* designed in detail here — the AI feature itself is undocumented and blocked (`501`, per the Phase 13 roadmap). The `File` model's genericity means adding an `aiRequestId`-style relation later, once AI ships, is a small additive migration, not a redesign — this is called out so a future AI phase doesn't need to revisit Media architecture at all, only add one relation.

---

## 8. Migration Strategy

This can be added with **zero breaking changes**, because every existing endpoint, DTO, and entitlement rule is left untouched:

1. **Schema:** one additive index (`Media.mediaType`) and no column changes — a zero-downtime, backward-compatible migration.
2. **New endpoints are additive:** `DELETE /files/:id`, `GET /media`, and the internal worker entry point are all new routes; nothing existing changes shape or behavior.
3. **The one behavioral change — `FilesService.completeUpload` now also triggers Media creation for eligible types — is the only place existing code is touched, and it's additive within that method (one new call at the end, after the existing `File` row is already created and returned). If the new call fails, it must not roll back or fail the original `completeUpload` response** (the user's upload still succeeds even if Media-creation has a transient problem) — logged and retryable, not user-facing.
4. **No queue infrastructure exists yet**, so the initial rollout (Phase 13.2) implements the enqueue step as a direct, synchronous call to a stub transcoding function (documents its own limits honestly, mirrors the existing "real code path, nothing to talk to yet" pattern already used by `StorageService.assertConfigured`) rather than blocking Media-record-creation on a queue system that would itself be new, unreviewed infrastructure. Swapping the stub call for a real queue publish later is a one-function change, not a schema or API change.
5. **Frontend rollout is additive:** the new shared `<MediaUploader>` component is introduced without first modifying the Course Editor's existing working upload button — the Course Editor migrates to the shared component in Phase 13.3/13.4 as a deliberate, testable, reversible swap, not a simultaneous rewrite.
6. **Rollback:** every step above can be reverted independently (drop the new index, remove the new routes, remove the one new call in `completeUpload`) without touching data created by the pre-existing system, since no existing row shape changes.

---

## 9. Risk Analysis

| Risk | Likelihood | Impact | Mitigation posture |
|---|---|---|---|
| **No queue infrastructure** means the initial synchronous transcoding stub could block the upload-completion request if not carefully isolated | Medium | Medium | Explicitly scoped as fire-and-forget with a hard timeout in Phase 13.2; real async queue is a named follow-up, not silently deferred forever |
| **No malware-scanning engine** means `scanStatus` can never actually leave `pending` today — Media creation gated on `clean` means, without real scanning being separately built, no Media will ever be created in a fully-correct deployment | High (already true today) | High if unaddressed | This is a **pre-existing** gap, not one this design introduces — flagged explicitly rather than worked around by weakening the "must be clean" rule, which would be a real security regression |
| **Thumbnail strategy deferred** could mean the Media Library ships with a poor visual experience (icons only) until transcoding lands | High | Low | Acceptable, explicit tradeoff — sequenced correctly in the Implementation Plan so it's a known, communicated limitation, not a surprise |
| **`GET /media` "list all" mode** (admin) could become a performance/privacy concern if not paginated and permission-gated correctly from day one | Low (mitigated by design) | Medium | Cursor pagination and the new `media:read:all` permission are specified in this architecture, not left as a TODO |
| **Synchronous stub-to-queue swap gets postponed indefinitely** (a common failure mode — "temporary" infra debt becomes permanent) | Medium | Medium | Named explicitly in the Implementation Plan as a tracked follow-up item with its own acceptance criterion, not folded silently into "done" |
| **AI Assets category left unmodeled** could be seen as incomplete against the original objective | Low | Low | Deliberate and justified — building a relation for a feature that doesn't exist yet (`501`) would be speculative schema, which this project's own standing principle ("boring technology, proven patterns, no speculative complexity ahead of need" — `09-PLATFORM-ARCHITECTURE.md`) argues against |
| **Existing entitlement logic complexity** (`FilesService.isEntitled`) grows one more case (Media list ownership) — risk of the method becoming harder to reason about over time | Low | Medium | New logic is additive and independently testable, not interleaved into the existing per-content-type branches |

---

## Summary

This is a completion of an already sound, already partially-built system — not a new one. The database schema, storage abstraction, and entitlement model are production-grade today. The one real, concrete gap (File → Media creation) is small, well-isolated, and closable without touching any currently-working code path. The genuinely new capability (transcoding, thumbnails, real malware scanning) requires infrastructure (a queue, a scan engine) this project doesn't have yet — this design is explicit about that boundary rather than papering over it with a fake synchronous implementation presented as "done."
