# Launch Automation Package

**Created:** Phase 21 (Production Smoke Test & Launch Automation), 2026-08-06 · Goal is not "one-click deployment" — it's minimal human error: every step below is either a real, runnable script or an explicit, documented manual step, in a fixed order, so a deployment operator makes as few judgment calls as possible.

## What's new this phase

| Script | Purpose |
|---|---|
| `../04-Smoke-Test/production-smoke-test.js` (requires the full Phoenix repository beside this package — see this document's Prerequisites) | Standalone Node script (no dependencies beyond built-in `fetch`), run against any environment via `API_BASE_URL`/`WEB_BASE_URL`. Read-only by default; `--deep` (with `SMOKE_TEST_EMAIL`/`SMOKE_TEST_PASSWORD`) additionally exercises login/session/refresh/logout and guarded endpoints using a real fixture account, without ever placing a real order, calling a real AI provider, or generating fake results. Every check reports PASS/FAIL/WARN with a human-readable explanation. See its own `--help` output for full usage. |
| `../04-Smoke-Test/verify-deployment-readiness.js` (requires the full Phoenix repository beside this package) | Orchestrates the full pre/post-deploy sequence in order: build → environment-variable presence check → database validation → health check → smoke test → summary. Reuses existing project scripts rather than reimplementing them (see below) — it does not duplicate any build/test logic itself. |

## What's reused, not duplicated

Per this phase's explicit instruction, nothing below was rebuilt — the automation package calls these directly:

| Existing capability | Where it already lives | How the automation package uses it |
|---|---|---|
| Build both apps | `npm run build` (root `package.json`, Turbo) | Step 1 of `verify-deployment-readiness.js` |
| Backend unit tests (209 tests) | `npm test` in `apps/api` (Jest) | Run separately as part of regression verification (see this phase's Validation section) — not wrapped into the deploy-time script since it's a pre-merge gate, not a deploy-time check |
| Schema validation | `npm run prisma:validate` (`apps/api/package.json`) | Step 3a of `verify-deployment-readiness.js` |
| Migration status | `npx prisma migrate status` (Prisma CLI, no project-specific wrapper existed) | Step 3b of `verify-deployment-readiness.js`, run only when `DATABASE_URL` is present in the shell |
| Role-authenticated dashboard checks | `apps/web/tests/e2e/{user,instructor,admin}/workspace.spec.ts` (Playwright, existing since Phase 11) | Explicitly referenced (not reimplemented) by `production-smoke-test.js`'s Frontend category — a plain HTTP script cannot exercise a real authenticated browser session the way Playwright already does |
| CI quality gate | `.github/workflows/ci.yml` (lint/type-check/test/build, Phase 14.3/16) | Unchanged — this package is a deploy-time/post-deploy tool, complementary to CI's pre-merge gate, not a replacement for it |

## The full sequence, in order

1. **Build verification** — `npm run build` at the repo root (builds both `apps/api` and `apps/web` via Turbo).
2. **Environment validation** — `verify-deployment-readiness.js` checks presence (not validity) of every required production variable from `../06-Environment-Variables/production-secrets-checklist.md`.
3. **Database validation** — `prisma validate` (schema correctness) + `prisma migrate status` (pending-migration check) against `DATABASE_URL`.
4. **Health check** — `GET {API_BASE_URL}/api/v1/health`.
5. **Smoke test execution** — `production-smoke-test.js`, standard mode locally/pre-deploy, `--deep` mode immediately after a real deployment (with real fixture credentials the operator supplies, never invented by this tooling).
6. **Final deployment verification** — the orchestrator's own summary, plus manually completing `../04-Smoke-Test/production-verification-report-template.md` for the record.

## Running it

**Both commands below must be run from the root of a full Phoenix repository checkout** — they call `npm run build`, the Prisma CLI, and Turbo, none of which exist inside this standalone package. The copies at `production-smoke-test.js` and `verify-deployment-readiness.js` in this same folder are provided for reading/reference only; the ones that actually execute live at the repository's own `scripts/` folder.

```
# Run from the root of your Phoenix repository checkout:
# Local, pre-deploy (build + schema + smoke test against localhost)
node scripts/verify-deployment-readiness.js

# Immediately after a real deployment, against production
API_BASE_URL=https://api.yourdomain.tld WEB_BASE_URL=https://yourdomain.tld \
DATABASE_URL=<production-url> \
SMOKE_TEST_EMAIL=<a-real-account> SMOKE_TEST_PASSWORD=<its-password> \
node scripts/verify-deployment-readiness.js --deep
```

Neither script deploys anything. Both are safe to run repeatedly, in any environment, without side effects beyond what `--deep` explicitly documents (a real login/logout cycle and guard-behavior checks — no orders, no AI calls, no real file writes).
