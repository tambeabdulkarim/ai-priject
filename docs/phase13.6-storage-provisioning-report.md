# Phase 13.6 — Object Storage Infrastructure Provisioning

Infrastructure-only changes, per instructions. No Media business logic, upload flow, or API contract was modified. No credentials were hardcoded into source control (all real values live only in the git-ignored `apps/api/.env`, matching the project's existing convention for `DATABASE_URL`/Redis/etc.), no security control was weakened, and no storage service was faked — every result below reflects a real attempt against a real (if, in one dimension, currently unreachable) S3-compatible service.

## Task 1 — Provider Comparison and Recommendation

| Provider | Dev simplicity | Production readiness | Cost | Performance | Compatibility | Scalability |
|---|---|---|---|---|---|---|
| **MinIO** | Excellent — one Docker container, zero account/billing setup, works fully offline | Requires self-hosting and operating (patching, HA, backups) — real ops burden if used *as* production, not just dev | Free (self-hosted; you pay only for the compute/disk it runs on) | Good locally; production performance is entirely dependent on the host you run it on | Fully S3 API-compatible (this project's `StorageService` already targets it with zero code changes) | Scales only as far as the operator scales the cluster themselves — no managed elasticity |
| **Cloudflare R2** | Simple — create a bucket, generate an S3-compatible API token, done; no infra to run | High — managed, SLA-backed, used in production by many S3-compatible workloads | **Zero egress fees** (R2's signature feature) + low storage cost; for a media platform that serves constant signed-URL playback traffic, this is the single biggest cost differentiator of the four | Backed by Cloudflare's global network; low-latency reads from anywhere | S3-compatible API (same `StorageService` code path, zero changes) | Fully managed, scales automatically |
| **AWS S3** | Moderate — requires an AWS account, IAM setup, and region/bucket decisions | Highest — the reference implementation every other provider imitates, deepest tooling/ecosystem | Storage is cheap, but **egress fees are real and add up quickly** for a video/media-heavy platform where every preview and playback is a signed-URL fetch | Excellent, especially paired with CloudFront | Native — this is the API every other provider imitates | Effectively unlimited, fully managed |
| **DigitalOcean Spaces** | Simple — flat, predictable pricing, easy setup | Moderate — solid for small/medium production workloads, smaller ecosystem than S3/R2 | Flat-rate ($5/mo baseline includes storage + transfer) — predictable but less favorable at scale than R2's per-use zero-egress model | Adequate; single-region, not globally distributed like R2 | S3-compatible | Limited compared to S3/R2 — fewer regions, less built for large-scale elasticity |

**Recommendation: Cloudflare R2 for production, MinIO for local development.** For Phoenix specifically — a platform whose core Media feature is signed-URL video/image playback served repeatedly to end users — egress cost is the dominant real-world factor, and R2's zero-egress pricing is a direct, material win over S3 or Spaces at any meaningful traffic volume, while remaining just as S3-API-compatible as the others (no code change required either way, since `StorageService` already targets the S3 API generically). MinIO is recommended for local development specifically because it requires no account, no billing, and no network dependency — consistent with this project's existing pattern of an optional local Docker fallback for Postgres/Redis/Meilisearch (`infra/docker/docker-compose.yml`).

This recommendation does not require choosing between them: the same `STORAGE_ENDPOINT`-driven code works with both, so local dev uses MinIO and a real deployment would point the same four/five variables at R2 instead.

## Task 2 — MinIO Local Development Setup

Added to `infra/docker/docker-compose.yml` (existing `postgres`/`redis`/`meilisearch` services untouched):

- **`minio`** — `minio/minio:RELEASE.2024-10-13T13-34-11Z`, S3 API on port `9000`, web console on port `9001`, `MINIO_ROOT_USER=phoenix` / `MINIO_ROOT_PASSWORD=phoenix_dev_password` (matching the existing `postgres: phoenix/phoenix` local-dev-only credential convention already in this same file), persistent volume `phoenix_minio_data`, healthcheck against `/minio/health/live`.
- **`minio-init`** — a one-shot `minio/mc` container that waits for `minio`'s healthcheck to pass, then creates the `phoenix-media` bucket (`mc mb --ignore-existing`) and exits. MinIO does not auto-create buckets, so this is the standard, documented pattern for bootstrapping one in Compose.

Both services are additive; nothing existing was removed or reconfigured.

## Task 3 — Backend Configuration

- `apps/api/src/config/configuration.ts`: added `storage.region` to the typed `AppConfig` interface, read from `process.env.STORAGE_REGION`, defaulting to `'auto'` (correct for R2/MinIO/path-style providers; a real AWS S3 deployment should set a real region string here).
- `apps/api/src/storage/storage.service.ts`: `S3Client` now uses `storageConfig.region` instead of a hardcoded `'auto'` literal, so `STORAGE_REGION` actually takes effect.
- `apps/api/.env` (git-ignored, not committed) updated to point at the local MinIO service: `STORAGE_ENDPOINT=http://localhost:9000`, `STORAGE_BUCKET=phoenix-media`, `STORAGE_ACCESS_KEY_ID=phoenix`, `STORAGE_SECRET_ACCESS_KEY=phoenix_dev_password`, `STORAGE_REGION=auto` — the exact same values wired into the `minio` Compose service above, so the two are ready to work together the moment the container can actually run.
- `apps/api/.env.example` updated with a documented local-dev-fallback block (matching the existing style used for `DATABASE_URL`/Redis) and a new `STORAGE_REGION=` line, without inventing a "real" production value.

**No `.env` values were invented for a production provider** — only the local, self-hosted MinIO credentials defined in the same Compose file above, consistent with this project's existing convention (the `postgres`/`redis` services follow the identical pattern already).

## Task 4 — Startup Verification

The backend was rebuilt and restarted against the new configuration (a stale `apps/api/tsconfig.tsbuildinfo` incremental-build cache had to be cleared first — the same known issue already flagged in this project's `next-session.md` history — after which `nest build` produced a clean `dist/`).

Real startup log line, confirming the configuration is read correctly and logged clearly (not silently):

```
[StorageService] Storage configured: endpoint=http://localhost:9000 bucket=phoenix-media region=auto
```

Added: `StorageService`'s constructor now logs a clear `LOG` line when configured and a clear `WARN` line when not (previously, the unconfigured state was only discoverable on first *use*, via a thrown error deep in a request — now it's visible at boot, satisfying "never silently continue").

**Connecting to real, bad, or unreachable credentials — tested live, not simulated:**

- A live `POST /files/upload-url` succeeded (`201`) and returned a genuine AWS SigV4 presigned URL, because presigning is a pure local cryptographic operation — no network call to storage is required to produce one, in any S3-compatible SDK. This is expected, correct behavior, not a false positive.
- A direct `PUT`/`curl` to that presigned URL against `http://localhost:9000` **failed with a real, clean `Connection refused`** (curl exit code 7) — because, per Task 2's finding below, no MinIO container is actually running in this environment yet. This is exactly the "fail clearly, never silently continue" behavior the task requires: no silent success, no hang, no fake `200`.
- `POST /files/:uploadId/complete` (which reads the first bytes back from storage for magic-byte MIME detection) surfaced the same real connectivity failure in the backend log — `[StorageService] ERROR Failed to read object prefix... AggregateError` (the real Node.js network error) — and returned a `400 VALIDATION_ERROR` to the client. **Verified no orphan `File` row was created** by this failed attempt (queried directly by `storageKey`; none found), because `completeUpload`'s DB write only happens after the MIME-detection step succeeds.

**One real, minor, pre-existing finding surfaced by this live test** (not a Phase 13.6 defect, and explicitly out of scope to fix here per "Do NOT modify business logic"): `readObjectPrefix`'s `catch` block returns `null` on any storage error — including a genuine connectivity failure, not just "this isn't a recognized magic-byte signature" — and `FilesService.completeUpload` treats a `null` prefix as "unrecognized file type," surfacing a `400` to the client instead of a distinct `503`/`500` "storage unavailable." The real error *is* logged clearly server-side (confirmed above), so this isn't a silent failure — it's a client-facing error-message precision gap, worth a follow-up ticket, not a blocker.

## Task 5 — Real Verification (Upload → ... → Expired URL)

**Partially completed; blocked partway through by a newly-discovered, distinct infrastructure gap: Docker itself is not operational in this environment.**

Investigated directly:
- `docker version` / `docker ps` / `docker compose up` all fail — the CLI resolves correctly (`docker context ls` shows `desktop-linux`), but every request to the Docker Desktop Linux VM engine (`npipe:////./pipe/dockerDesktopLinuxEngine`) returns `500 Internal Server Error`, and `docker compose up -d minio minio-init` hangs and times out rather than starting anything.
- `wsl -l -v` reports **"The Windows Subsystem for Linux is not installed"** — Docker Desktop's `desktop-linux` context requires a working WSL2 (or Hyper-V) backend VM to run any container at all, and that backend is absent here.
- Checking Hyper-V/WSL Windows feature state directly (`Get-WindowsOptionalFeature`) requires administrator elevation, which is not available in this session — and installing WSL2 (`wsl --install`) requires a system reboot, a system-level, hard-to-reverse action this phase's "infrastructure changes only, do not redesign" scope does not extend to performing unilaterally.
- This is not a surprise specific to this session — `infra/docker/docker-compose.yml`'s own pre-existing top comment already anticipated exactly this: *"This is not guaranteed: some managed/IT-policy devices block the virtualization Docker Desktop requires."* This environment is one of those devices.

Given that, the full chain requested could not be run against a real, running MinIO container. What **was** genuinely exercised, live, against the real backend (no mocks, no simulation) — using the code paths that don't require an actual reachable object store:

| Step | Result |
|---|---|
| Upload (presigned URL request) | ✅ Real `201`, real SigV4-signed URL returned |
| → Storage (actual PUT of bytes) | ❌ Blocked — `Connection refused`, real error, real evidence (Docker unavailable) |
| Complete Upload | ❌ Correctly rejected (`400`) once the real magic-byte read failed; **no orphan row created** — verified |
| Media creation | Not reached — depends on Complete Upload succeeding |
| Signed URL (read path) | ✅ Real `200`, real signed `GET` URL returned for a directly-seeded `File` row, with a real, live-observed `X-Amz-Expires=300` (5 min) in the URL string, matching `DOWNLOAD_URL_TTL_SECONDS` |
| Preview / Playback | Not reachable — same root blocker |
| Delete / Soft Delete / Unauthorized access | Unaffected by storage availability — already fully verified live in Phase 13.4/13.5 using the same, unchanged code paths; not re-run here since nothing relevant changed |
| Expired URL | Not verifiable — no real object exists to fetch before/after expiry |

## Task 6 — Performance

Measured live against the real, running backend (not synthetic):

| Metric | Result |
|---|---|
| Signed URL generation (`POST /files/upload-url`, sequential) | 1364–2501ms per call across 5 real requests |
| Signed URL generation (5 parallel requests) | 3747ms total for all 5 |
| Upload time, preview loading, large uploads | Not measurable — require a real reachable object store (Task 5) |

**Note on the signed-URL timing:** presigning itself is a local, sub-millisecond cryptographic operation — the 1.3–2.5s observed is not S3/storage latency at all. Per `docs/media-architecture-report.md` §2, `POST /files/upload-url` also stashes the claimed filename/content-type in Redis (Upstash REST API, a real network round trip to a cloud service) before returning — that round trip is almost certainly the dominant cost here, not storage. This is a genuine, real measurement, but it reflects Redis/Upstash latency, not the object-storage layer this phase is scoped to; flagged for visibility, not something to fix in an infrastructure-only phase.

## Task 7 — Security

| Check | Result |
|---|---|
| Private bucket | **Not verifiable** — no real bucket is currently reachable to inspect an ACL/policy on (Task 5's blocker). The `minio-init` service does not set any public-read policy, and MinIO buckets are private by default unless explicitly configured otherwise — correct by configuration, unconfirmed live. |
| Signed URLs only | **Verified live in this phase** — both `POST /files/upload-url` and `GET /files/:id` returned real SigV4 presigned URLs; no raw/permanent storage URL was returned by any endpoint exercised. |
| URL expiration | **Verified live in this phase** — the real signed download URL's own query string carries `X-Amz-Expires=300` (5 min), matching `DOWNLOAD_URL_TTL_SECONDS` in code; the real signed upload URL carries `X-Amz-Expires=900` (15 min), matching `UPLOAD_URL_TTL_SECONDS`. Whether the storage backend actually *enforces* that expiry (i.e., rejects a stale URL) could not be tested live — that requires a reachable backend (Task 5). |
| Ownership | Unaffected by this phase, already verified live in Phase 13.4/13.5 (unchanged code path). |
| Deleted objects inaccessible | Unaffected by this phase, already verified live in Phase 13.4/13.5 (soft-delete gate happens before ever reaching `StorageService`, unchanged). |

No security regressions introduced. No security control was weakened, bypassed, or worked around to compensate for Docker's unavailability.

## Files Modified

- `infra/docker/docker-compose.yml` — added `minio`/`minio-init` services, `phoenix_minio_data` volume, and an explanatory top-of-file comment addition.
- `apps/api/src/config/configuration.ts` — added `storage.region` to `AppConfig`, read from `STORAGE_REGION` (defaults `'auto'`).
- `apps/api/src/storage/storage.service.ts` — `S3Client` now uses the configured region; added clear startup-time `LOG`/`WARN` logging of the storage configuration state.
- `apps/api/.env` (git-ignored) — populated `STORAGE_*` with local MinIO dev values, added `STORAGE_REGION`.
- `apps/api/.env.example` — documented the local-dev MinIO fallback block, added `STORAGE_REGION=`.
- Documentation: `docs/project-status.md`, `docs/known-issues.md`, `docs/next-session.md`, `docs/documentation-index.md` updated; this report and `docs/restore-point-phase13.6.md` created.

No Media business logic, upload-flow design, or API contract was changed — confirmed by scope: every code edit above is either infrastructure config or a config-reading addition (`STORAGE_REGION`) explicitly requested by Task 3, plus non-behavioral startup logging.

## Verification Performed

Real, live checks against the real running backend (no mocks): presigned-URL generation for both upload and download, real connection-refused failure on an actual PUT attempt, real magic-byte-read failure surfaced and logged, real absence of an orphan `File` row after a failed `completeUpload`, real signed-URL TTL values read directly out of live-generated URLs, real backend startup log confirming configuration state. Docker/MinIO container startup was attempted for real (not skipped) and failed for a real, fully diagnosed reason.

## Regression Results

None — no Media business logic or API surface was touched. The one code change beyond pure infrastructure config (`STORAGE_REGION` support) is additive and backward-compatible (defaults to the previous hardcoded `'auto'` behavior when unset).

## Remaining Blockers (priority order)

1. **Docker cannot run containers in this environment.** `desktop-linux` Docker context's backend VM is unreachable (`500` on every engine call), root-caused to WSL2 not being installed, with no path to fix it available in this session (requires administrator elevation and a system reboot — outside this phase's "infrastructure changes only" scope to perform unilaterally). This blocks starting the newly-added `minio`/`minio-init` services, which are otherwise fully configured and ready.
2. **No real, reachable object storage exists as a result of #1** — the actual `Upload → Storage → ... → Expired URL` chain remains only partially verified (Task 5), for the same reason Phase 13.4 and 13.5 could not complete it, but now with a precisely identified *second*, independent cause layered on top of the original "no credentials" gap (which is now itself resolved at the configuration level — real, matching local-dev MinIO credentials exist and are wired in).
3. Real bucket-privacy ACL and real signed-URL-expiration *enforcement* (not just the TTL value in the URL, which is confirmed) remain unverified live, blocked by #1/#2.
4. Real storage performance (actual upload/download throughput) remains unmeasured, blocked by #1/#2.
5. A minor, pre-existing error-message precision gap: `completeUpload` reports a generic "unrecognized file type" `400` when the real cause is a storage connectivity failure, rather than distinguishing the two. Logged clearly server-side either way; not a silent failure, just an imprecise client-facing message. Out of scope to fix in this infrastructure-only phase.
6. No malware-scanning engine exists (`File.scanStatus` never leaves `pending`) — separate, pre-existing, platform-wide, unrelated to object storage.

## Final Recommendation

**OPTION B — remaining blockers listed above, ordered by priority. Not proceeding to Phase 14 automatically.**

Real, meaningful progress was made this phase: the storage layer is now fully configured (including the previously-unmodeled `STORAGE_REGION`), a complete, real, production-grade local MinIO development setup exists and is committed to the repo, startup-time logging now makes the configuration state visible rather than discoverable only on first failure, and multiple pieces of the real upload/signed-URL flow were genuinely exercised and confirmed correct (presigned-URL generation, TTL values, clean connection-refused failure handling, no orphan rows). What remains blocked is not a Phoenix code or configuration problem — it's that this specific sandboxed environment cannot run Docker containers at all, a distinct, precisely-diagnosed, non-code blocker layered on top of (and now largely superseding) the original "no credentials" gap from Phase 13.4/13.5. The moment this MinIO stack can actually run — either in an environment where Docker's virtualization backend works, or by pointing the same `STORAGE_*` variables at a real hosted provider (Cloudflare R2, per Task 1's recommendation) instead of local MinIO — the remaining verification (Task 5's storage leg, Task 6's real performance numbers, Task 7's live bucket-ACL check) is a short, mechanical follow-up pass, not new engineering work.
