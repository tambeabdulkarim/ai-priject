# Phase 43 — Deployment Readiness & Staging Setup

**Date:** 2026-08-12 · **Type:** Deployment infrastructure — move from local-only dev toward a real, externally reachable Staging/Beta environment.

## UPDATE 2026-08-12 (later same day) — STAGING IS LIVE

The section below this point is the original report, written when the phase paused waiting on two manual owner-side Vercel actions. Those actions were completed (with the owner's live, hands-on help via guided PowerShell steps for the secret-bearing parts — I never saw any secret value), and the phase continued autonomously from there. **Both apps are now genuinely deployed, live, and verified working end-to-end.**

**Real, live URLs:**
- **Frontend (Staging):** https://ai-priject-ex8pzy2ao-phoenix-project.vercel.app
- **Backend (Staging API):** https://api-seven-alpha-63.vercel.app

**What was done after the original pause:**
1. **Vercel CLI authenticated** via the real device-authorization OAuth flow (owner opened the URL and approved it in their browser — I never handled a token or password).
2. **New Vercel project "api" created** (`prj_f0MaWqq8n3e00QTW9nP4dSr8Zw82`, team `phoenix project`), linked to `apps/api`, git-connected to `tambeabdulkarim/ai-priject`, Root Directory set to `apps/api`.
3. **Backend secrets configured** (names only, values never seen by me):
   - `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `PASSWORD_PEPPER`, `MFA_ENCRYPTION_KEY` — generated locally (staging-only, not shared with any other environment) by the owner directly, via a script I wrote that never printed the values, and uploaded by the owner directly via `vercel env add` piped from local files.
   - `DATABASE_URL` — the real, existing Neon connection string, extracted and uploaded by the owner directly from their own `.env` file; I never read or saw it.
   - `NEXT_PUBLIC_SITE_URL` — set by me once the real frontend URL existed (see below); not a secret.
4. **A real deployment-blocking bug was found and fixed**: the backend crashed on every request with `Error [ERR_REQUIRE_ESM]` — `isomorphic-dompurify`'s `jsdom@28` dependency (used for server-side HTML sanitization, `apps/api/src/common/utils/sanitize-html.ts`) adopted an ESM-only package (`@exodus/bytes`) internally, which Vercel's Node.js serverless runtime cannot `require()`. Root-caused across 3 separate crash points (via `html-encoding-sniffer`, `whatwg-url`, and jsdom's own top-level entry file) using real runtime logs, not guesswork. Fixed via a scoped `npm overrides` pin (`jsdom: 25.0.1`, matching a community-confirmed working workaround for the same widely-reported upstream issue) in `apps/api/package.json` — zero application code changed. **Verified no security regression**: ran the real, unmocked `DOMPurify.sanitize()` against 6 real XSS/injection test cases (script tags, `onerror`/`onclick` handlers, `javascript:` hrefs, disallowed tags) — all correctly stripped, identical to pre-fix behavior. 242/242 backend tests still pass. Committed as `6118e48`.
5. **Frontend Root Directory was misconfigured** on the existing "ai-priject" Vercel project (`Auto` → resolved to the repo root, but the Next.js app lives in `apps/web`) — a real, previously-latent bug that only surfaced once the `NEXT_PUBLIC_API_URL` blocker (documented below) was cleared and the build could actually get far enough to fail on this next step. Fixed by explicitly setting Root Directory to `apps/web`.
6. **`NEXT_PUBLIC_API_URL`** set on the frontend project's Preview scope to the real backend URL; **`NEXT_PUBLIC_SITE_URL`** set on the backend to the real frontend URL once it existed — confirmed live via a direct CORS test (`Access-Control-Allow-Origin` header exactly matches the real frontend origin).
7. **Vercel SSO/Authentication protection was disabled on both projects**, with the owner's explicit approval (asked directly, since disabling an access-control wall is a real security-relevant change) — without this, no one without a Vercel account (including the Turkey-based partner) could open either URL.
8. **Live validation performed via real HTTP calls against the live URLs** (no browser-automation tool available, consistent with this entire project's disclosed limitation): registered a fresh test account (`POST /auth/register`), logged in and received a real RS256 JWT signed with the newly generated staging key (`POST /auth/login`), fetched `GET /users/me` authenticated (200), fetched the real public Learning Paths and Courses catalogs (confirmed real seeded content — e.g. "Data Scientist" path, "Data Science Foundations" course with all 5 real modules), enrolled in a real course (`POST /enrollments`, 201, real DB row created), and confirmed RBAC live: the same authenticated learner correctly got `403 Forbidden` on `GET /admin/settings` and `GET /users` (admin-only endpoints) — not just 401-for-unauthenticated, but real role-based denial for an authenticated non-admin.
9. **Full test matrix**: backend 242/242 tests, tsc clean, lint clean, build clean; frontend tsc clean, lint clean, build clean (all confirmed via actual command runs, output read).
10. **Git**: 2 new commits pushed to `staging` after the original report (`6118e48` the jsdom fix, `6e0260a` a `.gitignore` addition for `apps/web/.vercel/`) — `master` untouched throughout. No secret value ever appeared in any commit (scanned).

**What was NOT independently verified**: I cannot personally open a browser from an external network — the URLs above were tested via `curl`/HTTP only, from this same machine. The owner and the Turkey-based partner opening the links themselves is the real, final confirmation of true external reachability.

---

## ORIGINAL REPORT (superseded by the update above — kept for the historical record, per this project's documentation policy of never rewriting history)

**Original result statement (no longer current): code is fully deployment-ready and committed; a live Staging URL does NOT yet exist, blocked on two manual, secret-bearing Vercel dashboard steps that no available tool can perform.**

## 1. What was inspected

- **Frontend:** `apps/web`, Next.js 14 App Router, npm workspace member `@phoenix/web`, framework auto-detected by Vercel.
- **Backend:** `apps/api`, NestJS 10, npm workspace member `@phoenix/api`. Confirmed to declare **zero** `@phoenix/*` workspace dependencies — fully self-contained, standalone-deployable.
- **Database:** Neon serverless PostgreSQL (pooler endpoint `ep-wild-wind-ay6pccyj-pooler.c-5.us-east-2.aws.neon.tech`), accessed via Prisma 5. One real, live database — no separate staging database exists or was created (per this phase's explicit prohibition on creating new paid/data-risk resources without approval).
- **Storage:** S3-compatible object storage (Backblaze, per prior phases), configured via `STORAGE_*` env vars — presigned-URL upload flow, no files proxy through the API.
- **Auth:** RS256 JWT (`JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`), httpOnly refresh-token cookie.
- **Stripe:** live integration (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`), webhook signature verification requires raw request body (already handled by `rawBody: true` in the Nest app factory).
- **Existing deployment infrastructure found:** a real Vercel team ("phoenix project", `team_54DZ4aDwllG9ZFdfWyEVh3I8`) with two projects — "ai-productivity-platform" (unrelated pre-Phoenix scaffold, not touched) and **"ai-priject"** (`prj_dfEiTLBtgkbY6gnp8Nm80dYHKGoZ`, framework `nextjs`), already git-linked to this exact repository (`github.com/tambeabdulkarim/ai-priject.git`, confirmed by matching remote), with a working `master`-branch production deployment history.
- **Git state at phase start:** 424 uncommitted files; the last real commit (`e874dc7`, 2026-08-03) predated the entire Phases 25–42 session. Confirmed `.env`/`.env.local`/`.env.production` (all apps) correctly gitignored; grepped every changed path for anything secret-shaped — nothing found beyond expected `.env.example` placeholders and local-dev-only fallback credentials.
- **No backend hosting config existed** (no `vercel.json`, no serverless entrypoint) before this phase.

## 2. Architecture decision

**Frontend:** deploy via the existing, already git-linked "ai-priject" Vercel project by pushing a new, non-production `staging` git branch. Chosen over every alternative because it requires zero manual file assembly, zero new cost, and zero risk to `master`/production — it uses Vercel's own standard GitHub-branch-deployment mechanism.

**Backend:** the only available tool (`deploy_to_vercel` MCP) takes a raw, manually-assembled `files` array with no git-integration path and no environment-variable-setting capability. `apps/api` has 231 real source files and needs 10+ real secret env vars — manually reconstructing that file tree, and separately finding any way to inject real secrets without ever seeing their values, was judged impractical and inappropriate. **Decision: prepare the backend to be genuinely deployable (serverless entrypoint + config, fully tested), but the actual "create project → connect this repo → set secrets → deploy" step must be done once, manually, by the project owner via the Vercel dashboard — because it requires entering real secret values, which I must never see or transmit.**

## 3. Backend deployment preparation (code, not infrastructure)

- **`apps/api/src/create-app.ts`** (new): the exact bootstrap logic previously inline in `main.ts` (helmet CSP, `Permissions-Policy` header, CORS keyed off `NEXT_PUBLIC_SITE_URL`, cookie-parser, global prefix `api/v1`, strict `ValidationPipe`, `LoggingInterceptor`, the `BigInt.toJSON` patch) extracted into one shared, reusable `createApp()` function — accepts an optional `AbstractHttpAdapter` so it can build either a normal Nest app or one wrapped around an injected Express instance.
- **`apps/api/src/main.ts`** (refactored, not rewritten): now only reads the configured port and calls `app.listen()` — the traditional, long-running-process entrypoint, unchanged in behavior.
- **`apps/api/api/index.ts`** (new): the Vercel Node.js serverless entrypoint. Builds a Nest app around an `ExpressAdapter`-wrapped Express instance on first invocation, caches it (`cachedExpressApp`) across warm invocations of the same function instance, and dispatches every request into it.
- **`apps/api/vercel.json`** (new): routes every request to `api/index.ts` via `@vercel/node`.
- **`apps/api/package.json`**: added `express` as an explicit direct dependency (previously only transitive via `@nestjs/platform-express`, but now imported directly) and a `postinstall: "prisma generate"` script so the Prisma client is generated automatically on any fresh `npm install` (required for a from-scratch Vercel build container).
- **No business logic, validation, or CORS policy was changed** — the CORS origin is already read from `NEXT_PUBLIC_SITE_URL`, meaning the code already supports pointing at a different frontend origin per environment without any code change.

## 4. Database safety (Part 5)

Directly queried the real, live database (not assumed from memory or prior-phase reports) immediately before and used as the safety baseline for everything else in this phase:

| | |
|---|---|
| Learning Paths | 8 (`backend-engineer`, `cloud-engineer`, `cyber-security-analyst`, `data-scientist`, `devops-engineer`, `frontend-web`, `full-stack-engineer`, `prompt-engineer`) |
| Courses | 46 |
| Modules | 74 |
| Lessons | 213 |
| Quizzes | 49 |
| Quiz Questions | 245 |
| Projects | 33 |
| Certificates | 23 |
| Enrollments | 24 |

No reset, no destructive command, no seed run against this database this phase. No new database was created. This is the one and only real Phoenix database — there is no separate staging database, by design (per this phase's explicit "use the free/simplest option, don't create new cost/resources" instruction) — the staging *deployment* points at the same real data, same as any standard staging-environment pattern for a pre-launch product.

## 5. Git and deployment attempt

- Committed the full accumulated session (Phases 25–43, 427 files) to a new `staging` branch — **not** `master`. Verified before committing that no `.env`/secret-shaped file was staged (only `.env.example` placeholders).
- Pushed `staging` to `origin` (`github.com/tambeabdulkarim/ai-priject.git`). This is the one real, visible action this phase took against shared infrastructure — confirmed with the user before pushing.
- Vercel's GitHub integration automatically started a deployment from the new branch (`dpl_7d4crW9AxmzwY9VHoZT2nnJDHXTk`) against the existing "ai-priject" project.
- **That deployment failed at build time** (`state: ERROR`). Build logs show the real, root cause clearly:
  ```
  Error: Invalid environment configuration:
    - NEXT_PUBLIC_API_URL: Required
  ```
  This is `apps/web/src/config/env.ts`'s own deliberate fail-fast validation (a `zod` schema, documented as intentional: "Fails the build/dev-server startup loudly rather than letting a misconfigured deploy silently call the wrong API origin"). It is **not a bug** — it is correct, existing behavior encountering a real, expected gap: this Vercel project's `NEXT_PUBLIC_API_URL` is evidently only configured for the **Production** environment scope (which is why every prior `master`-branch deployment succeeded), not for **Preview** (the scope a new non-`master` branch deployment uses).
- **Confirmed this is purely a Vercel environment-variable-scoping gap, not a code defect**, by running a full local production build (`next build`) with the local `.env.local` (which already has `NEXT_PUBLIC_API_URL` set) — it succeeded cleanly, producing all 60 routes with no errors.

## 6. Why this phase stops here

Two real, sequential, secret-bearing manual actions are required before a live Staging URL can exist, and **no available tool can perform either one**:

1. **Create and connect a new Vercel project for the backend** (`apps/api` as its root directory), and enter the real secret env var values (see §7 for names only) into that new project's settings, then deploy it — to get a real backend URL.
2. **Add `NEXT_PUBLIC_API_URL`** (pointing at that new backend URL) **and `NEXT_PUBLIC_SITE_URL`** as environment variables scoped to the Preview environment (or specifically the `staging` branch) on the existing "ai-priject" project, then trigger a rebuild — e.g. by pushing any new commit to `staging`, or using the dashboard's "Redeploy" action.

Both require entering real secret/credential values into a form I do not have access to and must never see or transmit — this is exactly this phase's own explicitly listed stop condition ("needing external login/secret input"). Everything else in this phase's scope that did **not** require that has been completed: code is written, tested, committed, and pushed; the database is confirmed safe and untouched; the one deployment attempt that could be triggered automatically was triggered, and its real failure was diagnosed to its true, non-code root cause rather than guessed at or worked around with a hack.

## 7. Backend environment variables needed (NAMES ONLY — values never seen or requested)

`PORT`, `DATABASE_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `MEILISEARCH_HOST`, `MEILISEARCH_API_KEY`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `JWT_ACCESS_TOKEN_TTL`, `JWT_ISSUER`, `PASSWORD_PEPPER`, `MFA_ENCRYPTION_KEY`, `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `STORAGE_REGION`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `AI_PROVIDER_OPENAI_API_KEY`, `AI_PROVIDER_ANTHROPIC_API_KEY`, `POSTMARK_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`.

Frontend (Preview/staging scope): `NEXT_PUBLIC_API_URL` (the new backend's URL), `NEXT_PUBLIC_SITE_URL` (this Vercel deployment's own URL, e.g. `https://ai-priject-git-staging-phoenix-project.vercel.app`).

## 8. Test matrix (Part 12) — all actually run, output read

| Check | Result |
|---|---|
| Backend `tsc --noEmit` (including `api/index.ts` via a temporary verification tsconfig, since the normal build config's `include` is scoped to `src/**`) | Clean |
| Backend `nest build` | Clean, `dist/main.js` emitted |
| Backend fresh-instance boot test (isolated port, avoided the long-running dev server on 4000) | `Bootstrap] Phoenix API listening on port 4099`, real `200` response from `/api/v1/settings/public` |
| Backend Jest suite | **242/242 passed**, 28/28 suites |
| Backend `eslint` (`src` and the new `api` directory) | Clean |
| Frontend `tsc --noEmit` | Clean |
| Frontend `eslint` | Clean |
| Frontend `next build` (local, with local env) | Clean, all 60 routes built |

No regression from the bootstrap refactor — confirmed via the identical 242/242 test count before and after, plus a live boot-and-request test of the refactored entrypoint specifically.

## 9. What was and wasn't verified

**Verified (real, direct):** database content integrity before/after; local backend and frontend builds; the refactored bootstrap's behavioral equivalence; the staging branch existing on GitHub with the correct commit; the real Vercel deployment attempt and its exact failure cause; no secret committed to git.

**Not verified, and cannot be, without the two manual steps above:** any live Staging URL (none exists yet); external-network reachability; the 16-item live smoke test (Part 7); RBAC on a live deployment (Part 9's live-specific check); partner (Turkey) accessibility. These all require a real, running deployment, which does not yet exist.

## 10. Recommended next step

Once the project owner completes the two manual Vercel dashboard steps in §6, resume with: trigger a new `staging` deployment (a push or manual redeploy), then run the full Part 7 live smoke test, Part 8 external-access assessment, Part 9 live security check, and Part 10 partner-testing instructions — all already scoped and ready to execute the moment a real URL exists. No new phase number is needed for this — it is the direct continuation of Phase 43, not new scope.
