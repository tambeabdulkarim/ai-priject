# Restore Point — Phase 43 (Deployment Readiness & Staging Setup)

**Date:** 2026-08-12 · **Type:** Deployment infrastructure. **Result: COMPLETE. Phoenix is live on a real, externally reachable Staging environment — both frontend and backend deployed, connected, and verified working end-to-end via real HTTP calls (registration, login, JWT auth, course catalog, enrollment, RBAC all confirmed live).**

**Live URLs:**
- Frontend (Staging): https://ai-priject-ex8pzy2ao-phoenix-project.vercel.app
- Backend (Staging API): https://api-seven-alpha-63.vercel.app

## What this phase was

Infrastructure, not content or audit. Goal: move Phoenix from local-only dev to a real, externally reachable Staging/Beta environment the owner and a partner in Turkey can open from their own devices. Also committed the entire accumulated session (Phases 25–43 — 430 files across 4 commits) to git for the first time since 2026-08-03, on a new non-production `staging` branch. `master` was never touched.

## What was built (code)

1. `apps/api/src/create-app.ts` — shared Nest bootstrap extracted from `main.ts`, reused by both the traditional entrypoint and the new serverless one.
2. `apps/api/api/index.ts` + `apps/api/vercel.json` — Vercel Node.js serverless entrypoint for the backend.
3. `apps/api/package.json` — `express` as an explicit dependency, `postinstall: prisma generate`, and an `overrides` block pinning `jsdom` to `25.0.1` (fixes a real Vercel-serverless-only crash — see below).
4. Homepage Final Polish (`apps/web`) — a separate, already-completed sub-task within this same session (Feature Cards/Roadmap/Stats/Footer ordering fixes, Hero pill-row restructure, real News category badges) — committed as `c6f33ed`.

## What was built (infrastructure)

- New Vercel project **"api"** (`prj_f0MaWqq8n3e00QTW9nP4dSr8Zw82`), git-connected to this repo, Root Directory `apps/api`, deploying from `staging`.
- Existing Vercel project **"ai-priject"** (frontend) reconfigured: Root Directory corrected from `Auto` (repo root — wrong) to `apps/web` (a real, previously-latent bug this phase surfaced and fixed).
- Backend secrets configured directly by the owner (I generated the non-account-tied ones locally without ever printing them; the owner uploaded all values via `vercel env add`, and provided the real `DATABASE_URL` themselves): `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `PASSWORD_PEPPER`, `MFA_ENCRYPTION_KEY`, `DATABASE_URL`.
- `NEXT_PUBLIC_API_URL` (frontend, Preview scope) and `NEXT_PUBLIC_SITE_URL` (backend) both set to the real, live counterpart URLs — confirmed via a real CORS test.
- Vercel SSO/Authentication protection disabled on both projects, with the owner's explicit approval, so external testers (no Vercel account needed) can open the links.

## Real bugs found and fixed this phase

1. **Backend crashed on every request** (`ERR_REQUIRE_ESM`, `isomorphic-dompurify` → `jsdom@28` → an ESM-only transitive package Vercel's Node runtime can't `require()`). Root-caused via real runtime logs across 3 separate crash points, not guessed. Fixed with a scoped `jsdom` version pin (community-confirmed workaround for the same widely-reported upstream issue), zero application code changed. Verified no security regression: real, unmocked `DOMPurify.sanitize()` re-tested against 6 XSS payloads, all still correctly stripped.
2. **Frontend Vercel project's Root Directory was wrong** (`Auto` resolving to repo root instead of `apps/web`) — a real, previously-latent misconfiguration that only surfaced once the earlier `NEXT_PUBLIC_API_URL`-missing blocker was cleared and the build could get far enough to hit it.

## What was verified live (not simulated)

Direct HTTP calls against the real deployed URLs: registration, login (real RS256 JWT issued with the newly generated staging key), authenticated `GET /users/me` (200), public Learning Paths + Courses catalogs (real seeded content confirmed), course detail with all 5 real modules, a real enrollment (`POST /enrollments`, 201, real DB row), and RBAC (`403 Forbidden` for an authenticated learner hitting two different admin-only endpoints — not just 401-for-anonymous). Full local test matrix: backend 242/242 tests + tsc/lint/build clean, frontend tsc/lint/build clean.

## Discipline maintained

No secret value was ever read, printed, or transmitted by me at any point — the owner generated/entered every real credential themselves, guided step by step. `master` was never modified. No destructive database operation was run; the real, existing Neon database (8 Learning Paths, 46 courses, and all other real content) was confirmed intact and untouched throughout. Two genuinely security-relevant changes (disabling SSO protection, and touching Root Directory on the pre-existing frontend project) were both done only after explicit, direct approval — not assumed under "routine configuration."

## What was not independently verified

External-network reachability could not be tested by me directly (no browser, no external device) — verified via `curl` from this same machine only. The owner's and the Turkey-based partner's own attempts to open the links are the real, final confirmation.

## How to resume

Staging is live and stable. Any future session should read `docs/phase43-deployment-readiness-report.md`'s "UPDATE" section first for the current, accurate state. Recommended next steps (not started, awaiting direction): partner testing feedback collection, then a decision on whether/when to pursue a real Production deployment using the same now-proven architecture. **Explicitly not starting Phase 44 or any new work** — per this phase's own closing instruction.
