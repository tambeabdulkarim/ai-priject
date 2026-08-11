# Restore Point

**Version:** Phase 13.6

**Status:** Storage configuration provisioned; runtime verification blocked by a distinct, newly-diagnosed environment limitation (Option B)

**Date:** 2026-08-04

## Current Project State

Phase 13 (Media system: architecture, backend, frontend, integration verification, storage-infrastructure validation, and now provisioning) is functionally complete. Phase 13.6 provisioned a real, complete local-development object storage stack and resolved the original "missing credentials" gap at the configuration level — but discovered, while trying to actually start it, that this environment's Docker Desktop cannot run containers at all, a new and distinct blocker.

- **Provider comparison completed:** MinIO, Cloudflare R2, AWS S3, and DigitalOcean Spaces compared across dev simplicity, production readiness, cost, performance, compatibility, and scalability. **Recommendation: Cloudflare R2 for production** (zero egress fees — the dominant cost factor for Phoenix's signed-URL-heavy media playback), **MinIO for local development** (matches the project's existing optional-Docker-fallback pattern for Postgres/Redis/Meilisearch).
- **MinIO local-dev stack added** to `infra/docker/docker-compose.yml`: `minio` service (S3 API + console, healthcheck, persistent volume) and `minio-init` (one-shot bucket creation via `mc`). Existing services untouched.
- **Backend configuration completed:** `STORAGE_REGION` added to `AppConfig`/`configuration.ts` (previously hardcoded `'auto'` in `storage.service.ts`, now genuinely configurable, defaulting to `'auto'`). Real, matching local-dev MinIO credentials wired into `apps/api/.env` (git-ignored) and documented in `.env.example`. `StorageService` now logs its configuration state clearly at startup (`LOG` when configured, `WARN` when not) — previously only discoverable on first use.
- **Backend rebuilt and live-verified:** cleared a stale `tsconfig.tsbuildinfo` incremental-build cache (the same known issue class flagged elsewhere in this project's history), rebuilt cleanly, restarted, and confirmed via a real startup log line that the new configuration loads and logs correctly.
- **New blocker discovered and fully diagnosed:** `docker ps`/`docker compose up` fail — Docker Desktop's Linux VM engine returns `500` on every call and `docker compose up` hangs/times out. Root cause: `wsl -l -v` confirms WSL2 is not installed; Docker Desktop's `desktop-linux` context requires it (or Hyper-V) to run any container. Fixing this needs administrator elevation and a system reboot — outside this phase's "infrastructure changes only" scope to perform unilaterally. The project's own `infra/docker/docker-compose.yml` comment already anticipated this exact class of environment.
- **Real (non-mocked) verification performed against what was reachable:** presigned-URL generation for both upload (`201`, real SigV4 URL) and download (`200`, real SigV4 URL with `X-Amz-Expires=300` visible in the live-generated URL string, matching code); a genuine `PUT` attempt against the unreachable endpoint failed with a real `Connection refused` (not a hang, not a silent success); `completeUpload` correctly rejected the resulting unreadable object (`400`) with the real underlying error logged clearly server-side; confirmed **no orphan `File` row** was created by the failed attempt.
- No Media business logic, upload-flow design, or API contract was changed. All code changes are infrastructure config plus the explicitly-requested `STORAGE_REGION` wiring and non-behavioral startup logging.

## Resolved Issues (cumulative, Phase 13)

- Video lesson creation (Phase 13.3, verified Phase 13.4) — unaffected, unchanged.
- Soft delete and authorization/ownership consistency (Phase 13.4/13.5) — unaffected, unchanged.
- Root cause of missing storage credentials (Phase 13.5: classified as missing configuration) — **now further resolved (Phase 13.6): real local-dev configuration exists and is verified to load correctly.** What remains is a distinct, separately-diagnosed problem (Docker unavailability), not the original credentials gap.

## Remaining Limitations (deferred, not blocking Media's code correctness, but blocking Media's production sign-off)

1. **Docker cannot run containers in this environment** (Linux VM backend unreachable, WSL2 not installed) — blocks starting the now-fully-configured `minio`/`minio-init` services. Requires administrator elevation + reboot to fix, or bypassing local Docker by pointing `STORAGE_*` at a real hosted provider (R2 recommended) instead.
2. Real upload → signed-URL → playback chain remains unverified end-to-end, blocked by #1.
3. Real bucket-privacy ACL and real signed-URL-expiration *enforcement* (the TTL *values* are already confirmed correct in real generated URLs) remain unverified live, blocked by #1.
4. Real storage performance (actual upload/download throughput) remains unmeasured, blocked by #1.
5. Minor, cosmetic: `completeUpload` reports a generic "unrecognized file type" `400` for storage-connectivity failures too, instead of a distinct error. Real cause is always logged clearly server-side regardless — not a silent failure, just an imprecise client message. Out of scope for an infrastructure-only phase (business-logic change).
6. No malware-scanning engine exists (`File.scanStatus` never leaves `'pending'`) — pre-existing, platform-wide, unrelated to object storage.
7. Backend global rate limiter (120 req/min) — unchanged, pre-existing environment characteristic, not a Phase 13 concern.

## Safe Resume Point

**Do not proceed to Phase 14.** A real, precisely-diagnosed blocker remains (Docker unavailability), so the phase stops here (Option B). To resume: either (a) fix Docker Desktop on this machine (`wsl --install`, needs admin + reboot) and run `docker compose -f infra/docker/docker-compose.yml up -d minio minio-init`, or (b) skip local Docker and point `apps/api/.env`'s `STORAGE_*` variables at a real hosted provider (Cloudflare R2 recommended). Either path is immediately followed by re-running the verification chain in `docs/phase13.6-storage-provisioning-report.md` Task 5 to close Phase 13 completely, then proceeding to Phase 14.

No further code changes are pending — the configuration and code are both ready; only the runtime environment (or the choice of a hosted provider instead) needs to change.

## Restorability

**Recommended starting point:** `docs/documentation-index.md` — project status, restore points, architecture, API, frontend, backend, testing, deployment, reports, known issues, next session, historical reports, and archive, all in one place.

**Guaranteed minimum fallback** — if only the following four files survive, this project's Phase 13 state (including the exact blocker, its precise root cause, and both viable resolution paths) can still be fully reconstructed, with no dependency on conversation history, by reading them in this order:

1. `docs/project-status.md` — what phase, what's done, current result, next candidate (prioritized, two resolution paths).
2. `docs/known-issues.md` — what's still open and why, including the "Docker Cannot Run Containers" entry (new, Phase 13.6), the resolved-but-still-blocked "Object Storage Configuration" entry, and the cosmetic error-message entry.
3. `docs/next-session.md` — what to read first, the pending decision (fix Docker vs. use a hosted provider) in priority order, and what to do once either is resolved.
4. `docs/restore-point-phase13.6.md` (this file) — the authoritative snapshot and pointer to `docs/phase13.6-storage-provisioning-report.md` for the full provisioning and verification detail.
