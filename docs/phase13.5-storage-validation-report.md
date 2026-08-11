# Phase 13.5 — Storage Infrastructure Validation & Production Readiness

Verification and documentation only, per instructions. No credentials were invented, no storage service was faked, no security control was bypassed or weakened, and no workaround was substituted for the missing infrastructure — per this phase's explicit rules.

## Task 1 — Storage Configuration Inspection

Read directly from `apps/api/.env`, `apps/api/.env.example`, `apps/api/src/config/configuration.ts`, and `apps/api/src/storage/storage.service.ts`.

| Field | Value |
|---|---|
| **Provider** | **Unselected.** The code is deliberately provider-agnostic — `StorageService` uses the AWS SDK v3 `S3Client` with `forcePathStyle: true` against a configurable `endpoint`, which works against AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces, or any other S3-compatible API. No specific provider has ever been chosen or provisioned for this environment. |
| **Endpoint** | Empty (`STORAGE_ENDPOINT=` in `.env`, 0 characters) |
| **Bucket** | Empty (`STORAGE_BUCKET=`, 0 characters) |
| **Region** | Not read from environment at all — `StorageService`'s constructor hardcodes `region: 'auto'` unconditionally (`apps/api/src/storage/storage.service.ts:36`). There is no `STORAGE_REGION` variable in `configuration.ts`'s `AppConfig` interface or anywhere in `.env`/`.env.example`. `'auto'` is the correct value for R2 and most path-style S3-compatible providers, but would need to become a real AWS region string (e.g. `us-east-1`) if the eventual provider is genuine AWS S3. |
| **Credential source** | Plain environment variables only. `configuration.ts` reads `process.env.STORAGE_ACCESS_KEY_ID` / `process.env.STORAGE_SECRET_ACCESS_KEY` directly (both default to `''` if absent). No secrets-manager SDK, vault client, or KMS integration exists anywhere in the codebase (confirmed by search — no `aws-sdk/client-secrets-manager`, no Vault/Doppler/1Password-style import in any `apps/api` source file). |
| **Environment variables** | `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY` — all four exist as *keys* in both `apps/api/.env` and `apps/api/.env.example`, each with an empty string value. |

**Classification: Provider = Other / Unconfigured.** This is not AWS S3, not Cloudflare R2, not MinIO, not DigitalOcean Spaces — it is none of them, because nothing has been provisioned yet. The application is *ready* to speak to any of the four via the same code path; none has been selected.

## Task 2 — Root Cause of Missing STORAGE_* Values

Classification: **A — Missing configuration.**

Evidence ruling out the other options:

- **Not B (.env not loaded):** `apps/api/.env` is confirmed loaded — `ConfigModule.forRoot(...)` is wired in `apps/api/src/app.module.ts`, and other variables from the exact same file (`DATABASE_URL`, `JWT_PRIVATE_KEY`, etc.) are demonstrably working right now: the API is live on port 4000, real logins succeed, and Phase 13.4's live Prisma/API tests ran against the real Neon database defined by this same `.env`. If the file weren't loading, none of that would work either.
- **Not C (Docker configuration issue):** `infra/docker/docker-compose.yml` was inspected in full. It defines `postgres`, `redis`, and `meilisearch` only — **no object-storage service (e.g. MinIO) is defined at all.** There is nothing broken to fix in Docker; object storage was simply never included in the local infrastructure stack, containerized or otherwise. (Separately, this session's `docker ps` returned a Docker Desktop engine error, but that's moot — even a working Docker Desktop wouldn't produce storage credentials, since no such service exists in the compose file.)
- **Not D (secrets manager):** No secrets-manager client exists in the dependency tree or source code. There is nothing to "wire up" — the intended read path is a plain environment variable, and that path works correctly; it's just empty.
- **Partially E (intentional placeholder), but that doesn't change the actionable classification:** `.env.example`'s comment (`# --- Object storage (docs/09-PLATFORM-ARCHITECTURE.md §9) ---`) followed by four blank assignments does look like a deliberate template placeholder, consistent with "fill this in per-environment." But a template placeholder that was never subsequently filled in for *this* environment is, in effect, **A: missing configuration** — the real, current, actionable state is that no one has ever supplied real values here, in any environment file this project has (confirmed identical empty state in Phase 11, 13.2, 13.3, 13.4, and again now in 13.5).

**Real root cause, in one sentence:** object storage credentials were never provisioned for this environment — not a loading bug, not a Docker misconfiguration, not a secrets-manager gap — the `.env` mechanism works correctly and is simply waiting for real values that have never been supplied.

## Task 3 — Wiring or Documentation

Configuration does **not** exist (confirmed above), so per the task's explicit instruction, values are **not invented**. Documenting what's required instead:

### Required variables

| Variable | Purpose |
|---|---|
| `STORAGE_ENDPOINT` | The S3-compatible API base URL for the chosen provider (e.g. `https://<accountid>.r2.cloudflarestorage.com` for R2, `https://s3.<region>.amazonaws.com` for AWS S3, `http://localhost:9000` for a local MinIO instance, `https://<region>.digitaloceanspaces.com` for Spaces). |
| `STORAGE_BUCKET` | The bucket/container name that will hold Phoenix's uploaded objects. Must already exist on the provider — `StorageService` never creates a bucket, it only reads/writes objects inside one. |
| `STORAGE_ACCESS_KEY_ID` | Access key ID for a credential scoped to that bucket only (least privilege — see Task 5's security requirements: this credential should be able to `PutObject`/`GetObject` on this bucket alone, not account-wide). |
| `STORAGE_SECRET_ACCESS_KEY` | Matching secret key for the above. |

### Not currently modeled, but should be added alongside real provisioning

- `STORAGE_REGION` — currently hardcoded to `'auto'` in `storage.service.ts`; should become a real env var if the chosen provider is genuine AWS S3 (which requires a real region string, not `'auto'`). For R2/MinIO/Spaces, `'auto'`/a placeholder region is normal and the hardcoded value is fine as-is.
- A bucket **visibility/ACL** setting is not read from env at all today — the bucket's private-by-default posture (Task 5) must be configured directly on the provider side (bucket policy / ACL), since nothing in this codebase provisions or enforces it via API calls.

### Expected format

Plain, unquoted key=value pairs, one per line, matching every other variable already in the file — e.g.:

```
STORAGE_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
STORAGE_BUCKET=phoenix-media-production
STORAGE_ACCESS_KEY_ID=<real access key>
STORAGE_SECRET_ACCESS_KEY=<real secret key>
```

### Correct location

`apps/api/.env` (git-ignored, per-environment — confirmed `.env` is not tracked; only `.env.example` is). This is the only file `ConfigModule.forRoot()` reads for `apps/api` in this project; there is no separate storage-specific config file.

### Loading mechanism

`@nestjs/config`'s `ConfigModule.forRoot()` (wired in `apps/api/src/app.module.ts`) loads `apps/api/.env` at process start via `dotenv` semantics, populates `process.env`, and `apps/api/src/config/configuration.ts`'s factory function reads the four `STORAGE_*` keys into the typed `AppConfig.storage` object that `StorageService` consumes through `ConfigService.get('storage', { infer: true })`. No restart-without-rebuild trick exists for this — since `apps/api` (like `apps/web`) needs a full process restart to pick up `.env` changes (env vars are read once at boot).

**No wiring changes were made** — the read path is already correct and complete; it has nothing to do until real values are supplied.

## Task 4 — Real Validation (Upload → ... → Expired URL)

**Blocked — cannot be performed.** Every step in this chain (`Upload → Storage → Complete Upload → Media Record → Signed URL → Preview → Playback → Delete → Soft Delete → Access Denied → Expired URL`) requires a live, credentialed connection to real object storage. Per Task 2, that credential does not exist in this environment. Attempting to simulate it (fake storage service, hardcoded credentials, mocked S3 responses) is explicitly forbidden by this phase's rules ("Do NOT fake storage services," "Do NOT hardcode credentials").

What **was** already verified in Phase 13.4, and remains valid without re-verification here (unchanged since then): every step *downstream* of a `File`/`Media` row existing — Media Record → Media Library → Media Picker → Lesson attach → Preview's graceful-degradation path → Soft Delete → Access Denied (401/403/404) — using a directly-seeded row standing in for a real completed upload. See `docs/phase13.4-integration-report.md`. Nothing in Phase 13.5 changes or invalidates that result.

The steps that remain genuinely unverified, unchanged from Phase 13.4: **Upload → Storage** (the literal PUT to a real bucket), **real Signed URL** generation/fetch/**Expired URL** behavior, and **Playback** of a real object. All four require the same missing credential.

## Task 5 — Security Validation

**Partially verifiable without real storage; partially blocked.**

| Check | Result |
|---|---|
| Private bucket | **Not verifiable** — no real bucket exists to inspect an ACL/policy on. |
| Signed URLs only | **Verified by code inspection, not live storage.** `StorageService` exposes exactly two storage-facing methods, `createPresignedUploadUrl` and `createPresignedDownloadUrl`, both calling `getSignedUrl(...)` from `@aws-sdk/s3-request-presigner`; there is no method anywhere in the class, or called anywhere in `files`/`media` modules, that returns a raw/permanent storage URL. `Files`/`Media` read endpoints (`GET /files/:id`, `GET /media/:id`) always route through `createPresignedDownloadUrl` — confirmed by reading `files.service.ts`/`media.service.ts` call sites. |
| URL expiration | **Verified by code inspection only.** `UPLOAD_URL_TTL_SECONDS = 15 * 60` (15 min), `DOWNLOAD_URL_TTL_SECONDS = 5 * 60` (5 min), both passed as `expiresIn` to `getSignedUrl`. The actual expiry *behavior* (does a URL genuinely stop working after that TTL) cannot be live-tested without a real signed URL. |
| Ownership enforcement | **Verified live, unchanged from Phase 13.4** — `GET /files/:id`/`GET /media/:id` re-check entitlement before ever calling `createPresignedDownloadUrl`; confirmed 403 for a non-owner, 401 for no token, using real fixture accounts. |
| Deleted media inaccessible | **Verified live, unchanged from Phase 13.4** — soft-deleted files return 404 from both endpoints, including to their own owner. |
| No public exposure | **Verified by code inspection.** No route in `apps/api` returns `storageKey`, a constructed public URL, or any field that would let a client derive a direct-to-storage URL without going through the signed-URL endpoints (checked `files.controller.ts`, `media.controller.ts`, and the DTOs they return). |

No security issues found in what's verifiable today. The two checks that are not verifiable (real private-bucket ACL, real expiration behavior) are blocked by the same Task 1/2 root cause — not new gaps, not something this phase can close.

## Task 6 — Performance Validation

**Blocked — cannot be measured.** Upload time, signed-URL generation latency, large-upload behavior, and parallel-upload behavior all require a real storage backend to produce real timings against. Fabricating numbers against a nonexistent backend would be dishonest and explicitly against this phase's spirit ("Prefer production-grade engineering over temporary fixes... document it precisely instead of working around it").

What *is* still valid, carried over from Phase 13.4 (unaffected by storage availability, since it doesn't touch storage): `GET /media/me` (Media Library listing) measured 175–733ms, typically ~350–400ms, from real backend logs; lazy-loading via `IntersectionObserver` confirmed not eagerly firing signed-URL requests. No bottleneck identified in what's measurable.

## Task 7 — Failure Recovery

Verified what's verifiable without live storage; the rest is blocked for the same reason as Tasks 4/6.

| Check | Result |
|---|---|
| Storage unavailable | **Verified live** (this is, in effect, the permanent current state of this environment) — every storage-dependent call fails fast via `StorageService.assertConfigured()` throwing a clear, real error (`500`) rather than hanging, silently succeeding, or corrupting state. Confirmed in both Phase 13.4 and this phase's re-check. |
| No orphan `File` rows on failed upload-URL request | **Verified by code inspection.** `FilesService`'s upload-URL flow calls `assertConfigured()` (via `StorageService.createPresignedUploadUrl`) *before* creating any `File`/`Upload` row — confirmed by reading the call order in `files.service.ts`. A failed `assertConfigured()` throws before any DB write, so no orphan row is created by this specific, currently-reachable failure path. |
| Interrupted upload (bytes partially sent to storage, `completeUpload` never called) | **Not verifiable live** — this requires a real upload to interrupt. By design (per `docs/media-architecture-report.md` §2), the `Upload` row is created as `pending` with a 15-minute TTL tracked in Redis matching the presigned URL's own lifetime; an interrupted upload simply expires and is never promoted to a `File`/`Media` record. This is a design property, confirmed by reading the code, not a live-tested one. |
| Network interruption mid-request | Not verifiable live (same root cause). |
| Bucket unavailable (real bucket exists but is unreachable) | Not verifiable — no real bucket exists to make unavailable. Distinct from "storage unavailable" above, which tests the *unconfigured* path, not a *configured-but-unreachable* one. |
| Expired signed URL | Not verifiable live (Task 4/5). |
| Retry behavior | No client-side or server-side retry logic exists for storage calls today (confirmed by reading `storage.service.ts` — no retry wrapper, relying only on the AWS SDK's own default retry policy for transient errors). Not tested live. |
| No orphan `Media` rows | **Verified by code inspection.** `MediaService.createFromFile` is only ever invoked from `FilesService.completeUpload`, which itself is only reachable after a real object already exists in storage (the client calls `completeUpload` after successfully PUTting bytes) — so there is no code path today that creates a `Media` row without a corresponding real upload having occurred first. This logical guarantee holds regardless of storage availability; it was not newly introduced or changed in this phase. |

## Task 8 — Production Readiness Review

| Dimension | Assessment |
|---|---|
| **Code** | Production-quality. Presigned-URL pattern, magic-byte MIME detection, soft delete, ownership/entitlement checks, fail-fast on missing config — all correct, all verified live where verifiable (Phase 13.4) or by direct code inspection (this phase). No defects found. |
| **Architecture** | Sound and provider-agnostic by design (`docs/media-architecture-report.md`) — supports S3/R2/MinIO/Spaces interchangeably via one `STORAGE_ENDPOINT` value, no refactor needed to select a provider. |
| **Infrastructure** | **Not production ready.** No object storage has ever been provisioned for this project, in any environment, at any phase. This is the single blocking gap. |
| **Security** | Verified correct wherever testable (ownership, soft delete, no public URL exposure, signed-URL-only code paths). Two checks (real bucket privacy, real URL expiration) are unverifiable without infrastructure but are not expected to be a problem — the code paths driving them are correct by inspection. |
| **Scalability** | Direct-to-storage upload/download (never proxied through the app server) is the correct, scalable pattern already in place. No scaling concern identified in the code. |
| **Performance** | Cannot be measured for storage-dependent operations (Task 6). Non-storage Media operations (listing) perform well (~350–400ms). |
| **Documentation** | Now complete and precise for this gap specifically: required variables, format, location, and loading mechanism are documented above (Task 3) for whoever provisions real credentials next. |
| **Testing** | Every code path that can be exercised without real storage has been (Phase 13.4 live tests + this phase's code-inspection checks). The remaining untested surface is narrow and precisely bounded: real upload PUT, real signed-URL fetch/expiry, real playback, real bucket ACL. |

## Files Modified

**None (code).** This phase, like 13.4, is verification/documentation-only — no source files were changed. Documentation updated: `docs/project-status.md`, `docs/known-issues.md`, `docs/next-session.md`, `docs/documentation-index.md`. Created: this report and `docs/restore-point-phase13.5.md`.

## Remaining Blockers (priority order)

1. **No object storage has ever been provisioned for this project.** No provider has been chosen (S3, R2, MinIO, or Spaces are all equally supported by the code — none has been selected), no bucket exists, and no credentials exist. This is the root blocker behind every other item below. Resolution requires an operator to: pick a provider, create a bucket, create a least-privilege (bucket-scoped) access key, and populate the four `STORAGE_*` variables in `apps/api/.env` per the format documented in Task 3.
2. **Real upload/signed-URL/playback flow is unverified end-to-end**, blocked entirely by #1. Once #1 is resolved, this requires only a verification pass (re-running Task 4's chain), not code changes.
3. **Real bucket-privacy and real signed-URL-expiration behavior are unverified**, blocked entirely by #1. Code-level correctness is already confirmed (Task 5); this needs a live check once real storage exists.
4. **Performance under real storage (upload time, large/parallel uploads) is unmeasured**, blocked entirely by #1.
5. **No malware-scanning engine exists** (`File.scanStatus` never leaves `pending`) — a separate, pre-existing, disclosed platform-wide limitation, unrelated to object storage provisioning, carried forward unchanged from Phase 11/13.2/13.4.

## Final Recommendation

**OPTION B — remaining blockers listed above, ordered by priority. Not proceeding to Phase 14 automatically.**

The Media system's application code, architecture, and security model are production-grade and fully verified wherever verification is possible without real infrastructure. The sole blocker is that object storage has never been provisioned in this project's history — not a Phase 13.5 regression, not a configuration bug, not a Docker or secrets-manager problem, but a genuine, still-open infrastructure gap. Per this phase's explicit rules, no workaround was substituted for it. Resolving blocker #1 (provisioning real credentials) is an operator action outside this session's authority; once done, blockers #2–4 close via a short verification pass, not new engineering work.
