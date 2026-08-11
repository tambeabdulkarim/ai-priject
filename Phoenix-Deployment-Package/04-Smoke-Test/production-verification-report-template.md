# Production Verification Report — Template

**Instructions:** copy this file's structure for each real deployment/verification run (e.g. save it as `production-verification-report-2026-XX-XX.md` in this same folder), fill in the real results, and keep it as the record that verification actually happened. **Never fill in a PASS without the smoke test having actually run** — this document exists specifically to prevent claiming a deployment succeeded without evidence.

---

## Run metadata

- **Date/time:**
- **Environment:** (production / staging / local)
- **API_BASE_URL:**
- **WEB_BASE_URL:**
- **Run mode:** (standard / `--deep`)
- **Executed by:**
- **Deployed commit SHA (backend):**
- **Deployed commit SHA (frontend):**

## Per-area results

| Area | Status | Notes |
|---|---|---|
| Frontend healthy | ⬜ PASS / ⬜ WARN / ⬜ FAIL | |
| Backend healthy | ⬜ PASS / ⬜ WARN / ⬜ FAIL | |
| Database healthy | ⬜ PASS / ⬜ WARN / ⬜ FAIL | |
| Storage healthy | ⬜ PASS / ⬜ WARN / ⬜ FAIL | |
| Email healthy | ⬜ PASS / ⬜ WARN / ⬜ FAIL | |
| Authentication healthy | ⬜ PASS / ⬜ WARN / ⬜ FAIL | |
| Payments healthy | ⬜ PASS / ⬜ WARN / ⬜ FAIL | |
| Notifications healthy | ⬜ PASS / ⬜ WARN / ⬜ FAIL | |
| Certificates healthy | ⬜ PASS / ⬜ WARN / ⬜ FAIL | |
| AI healthy | ⬜ PASS / ⬜ WARN / ⬜ FAIL | |

## Overall deployment status

⬜ **PASS** — zero FAIL, zero WARN.
⬜ **PASS WITH WARNINGS** — zero FAIL, one or more WARN (list each WARN and why it's acceptable).
⬜ **FAIL** — one or more FAIL (list each, and do not proceed/declare launch complete until resolved).

## Full smoke test output

*(paste the complete console output of running `production-smoke-test.js` here, unedited — run from the root of a full Phoenix repository checkout, see this folder's `launch-automation-package.md` for why)*

## Follow-up actions required

*(anything a WARN or FAIL implies needs doing, with an owner and rough timeframe)*

---

## Worked example — local environment validation, Phase 21 (2026-08-06)

**This is a local pre-deployment validation run, performed to confirm the smoke-test tooling itself works correctly. It is not a production deployment and must not be read as one — no production infrastructure exists yet (see `../08-Deployment-Order-And-Rollback/phase21-launch-preparation.md`).**

- **Date/time:** 2026-08-06
- **Environment:** local (backend: `http://localhost:4000`, frontend: a real `next build` + `next start` production-mode build served locally)
- **Run mode:** standard (read-only)

| Area | Status | Notes |
|---|---|---|
| Frontend healthy | ✅ PASS | Homepage (307 redirect to locale root), login page, register page all correct. **Finding during this run:** the first attempt, against a long-running `next dev` instance, showed the homepage returning HTTP 500. Investigated rather than accepted at face value (matching this project's established discipline, e.g. Phase 18's E2E investigation) — root-caused to a `next dev`-only artifact (a stale, long-running watch-mode dev server from earlier in this session), not a real defect: a fresh `next build` + `next start` (the actual production runtime) correctly returns 307. Recorded here so the distinction isn't lost. |
| Backend healthy | ✅ PASS | `GET /api/v1/health` reachable, HTTP 200. |
| Database healthy | ⚠️ WARN → ✅ PASS on retry | First check reported `database: false` (a Neon cold-start delay, a previously-documented, known behavior — see the main Phoenix repository's `docs/phase16-production-validation-report.md`); reconnected and reported `true` seconds later. Not a defect. |
| Storage healthy | ✅ PASS | Configuration present (`STORAGE_ENDPOINT`/`STORAGE_BUCKET` both set in this local `.env`). |
| Email healthy | ⚠️ WARN | Postmark not configured in this local environment (expected — no real credentials exist locally either, by design). Will be a real requirement in actual production. |
| Authentication healthy | ✅ PASS (guard checks) / ⚠️ WARN (functional login/logout/refresh) | Every protected endpoint correctly returned 401 without a token. Functional login/refresh/logout were not exercised in this run (standard mode, not `--deep`) — by design, to avoid requiring real fixture credentials for a tooling-validation run. |
| Payments healthy | ✅ PASS | Stripe configured (test key, local); webhook endpoint correctly rejected an unsigned payload with HTTP 400, confirming signature verification is active. |
| Notifications healthy | ⬜ Not exercised in standard mode | Requires `--deep` + fixture login. |
| Certificates healthy | ⬜ Not exercised in standard mode | Requires `--deep` + fixture login. |
| AI healthy | ⬜ Not exercised in standard mode | Requires `--deep` + fixture login; the request-creation endpoint is intentionally never exercised by this tooling regardless of mode, to avoid real provider cost. |

**Overall deployment status: PASS WITH WARNINGS** (17 PASS, 7 WARN, 0 FAIL on the final run — see this phase's restore point for the complete console output).

**Follow-up actions required:** none from this run specifically — every WARN was either expected-by-design (categories requiring `--deep`) or already a known, disclosed gap (email not configured locally, by design). This run's purpose was to validate the tooling works correctly against a real environment, which it did.
