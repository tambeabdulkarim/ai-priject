# Deployment Checklist

**Created:** Phase 21 (Production Infrastructure Preparation), 2026-08-06 · Preparation only — this checklist is meant to be executed at actual deployment time, not during this phase. Cross-references: `../06-Environment-Variables/production-secrets-checklist.md` (what each variable is), `.env.production.example` / `.env.server.production.example` (the templates these fill in), the main Phoenix repository's `docs/phase19-execution-readiness-report.md` (the original Owner Action List this checklist formalizes into a printable form).

## Pre-Deployment

- [ ] Confirm Phoenix v1.0 is on the frozen, intended commit (per the main Phoenix repository's `docs/version-1.0-freeze.md`).
- [ ] Confirm 209/209 backend tests pass locally before deploying.
- [ ] Confirm both `apps/api` and `apps/web` build clean locally (`npm run build` in each).
- [ ] Read `../06-Environment-Variables/production-secrets-checklist.md` in full — know every value you'll need before starting.
- [ ] Decide launch scope explicitly: is AI in scope for day one? Is the async Notifications worker required, or launching without it (degrades gracefully — see the main Phoenix repository's `docs/phase21-v1.1-roadmap.md`)?

## Infrastructure

- [ ] Choose hosting provider(s) — Vercel (frontend) + Railway (backend/workers) recommended per the main Phoenix repository's `docs/phase17-deployment-launch-guide.md`'s comparison; confirm or override.
- [ ] Create the hosting accounts.
- [ ] Confirm the backend hosting target supports the app's actual runtime requirements (Node version, persistent process, not serverless-only if long-running connections are needed).

## Database

- [ ] Provision a **dedicated** production Postgres instance (Neon or chosen provider) — never reuse the dev/test instance.
- [ ] Set `DATABASE_URL` in the backend's production environment.
- [ ] Run `prisma migrate deploy` (never `db push`) against the production instance.
- [ ] Verify with a direct `SELECT 1` or equivalent that the connection is live.
- [ ] Confirm the provider's automatic backup / point-in-time recovery is enabled (see Backups below).

## Storage

- [ ] Provision a **dedicated** production bucket (Backblaze B2 or any S3-compatible provider) — never reuse the dev/verification bucket from Phase 13.7.
- [ ] Generate a production application key scoped to that bucket only.
- [ ] Set the 5 `STORAGE_*` variables in the backend's production environment.
- [ ] Verify a real object can be written and read back before anything else depends on it.
- [ ] Confirm bucket privacy settings (private by default, access only via signed URLs) match what was verified in Phase 13.6/13.7.

## Email

- [ ] Create/confirm a Postmark account.
- [ ] Add and verify the sending domain (DKIM/Return-Path DNS records) — this can take time to propagate, start early.
- [ ] Generate a production server token; set `POSTMARK_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`.
- [ ] Send one real test email through Postmark's own testing tools before wiring it into the app.

## DNS

- [ ] Register (or confirm ownership of) the production domain.
- [ ] Point the domain's A/CNAME records at the frontend hosting provider.
- [ ] Point a subdomain (e.g., `api.`) at the backend hosting provider, if using one.
- [ ] Confirm the Postmark sending-domain DNS records (above) are on the same domain or a verified subdomain.
- [ ] Allow time for propagation (can take up to 24–48 hours in the worst case) before proceeding to smoke testing.

## SSL

- [ ] Confirm the hosting provider issues and auto-renews TLS certificates for the production domain (Vercel/Railway both do this automatically for custom domains once DNS is correctly pointed — no manual certificate management expected).
- [ ] Confirm HTTPS is enforced (HTTP requests redirect, not silently served) — re-verify the security-headers behavior built in Phase 16 against the real production domain, not localhost.

## Environment Variables

- [ ] Generate `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` / `PASSWORD_PEPPER` / `MFA_ENCRYPTION_KEY` directly on the owner's own machine — never inside an AI session, never reused from dev.
- [ ] Set every variable from `.env.server.production.example` in the backend hosting provider's environment-variable store.
- [ ] Set every variable from `.env.production.example` in the frontend hosting provider's environment-variable store.
- [ ] Double-check `NODE_ENV=production` is set on the backend.
- [ ] Confirm no `.env*` file (other than the committed `.example` templates) is ever committed — `.gitignore`'s `.env.*` / `!.env.example` pattern (Phase 18) already covers this; do not weaken it.

## Monitoring

- [ ] Wire up error tracking (Sentry or equivalent) on both `apps/api` and `apps/web`.
- [ ] Wire up an external uptime monitor polling both the frontend and `GET /api/v1/health` on an independent schedule.
- [ ] Configure at least one alert: error-rate spike, health-check failure, or 5xx-rate threshold — routed somewhere someone actually watches.
- [ ] See `../08-Deployment-Order-And-Rollback/phase21-launch-preparation.md` Section 6 for the full monitoring plan this checklist item summarizes.

## Backups

- [ ] Confirm the database provider's automatic backup/PITR is enabled and the retention window matches risk tolerance (don't assume the default is sufficient).
- [ ] Confirm the storage provider's own versioning/lifecycle rules for media, if any protection beyond the provider's own durability guarantees is desired.
- [ ] Record the process for taking a manual, on-demand backup before any risky future change (a migration, a major dependency upgrade).

## Deployment Order (summary — see `../08-Deployment-Order-And-Rollback/phase21-launch-preparation.md` Section 4 for full detail)

1. Database → 2. Storage → 3. Email (domain verification) → 4. Secrets generated → 5. Backend deployed → 6. Stripe webhook registered against the now-live backend URL, backend redeployed with the secret → 7. Workers (if built) → 8. Frontend deployed → 9. DNS pointed → 10. Monitoring wired up → 11. Smoke test → 12. Rollback snapshot taken.

## Post-Deployment Verification

- [ ] Run the full smoke-test checklist in `../08-Deployment-Order-And-Rollback/phase21-launch-preparation.md` Section 5 against the real, live, DNS-resolved production URLs.
- [ ] Confirm `GET /api/v1/health` reports every configured service `true`.
- [ ] Confirm the Stripe webhook delivery log (in Stripe's own dashboard) shows successful deliveries, not just app-side assumptions.
- [ ] Confirm at least one real end-to-end signup, one real checkout, and one real file upload all succeed against production.
- [ ] Confirm monitoring is actually receiving data (trigger a harmless test error if the tool supports it, to confirm the pipeline works end-to-end).

## Rollback Checklist

- [ ] Identify the failing component via monitoring/alerting.
- [ ] Redeploy the previous immutable build artifact (the commit SHA recorded at the end of the deployment order above) for the affected app.
- [ ] If the issue is data-level, use the database provider's point-in-time recovery to restore to a timestamp immediately before the incident.
- [ ] Re-run the relevant subset of the smoke test to confirm the rollback resolved the issue.
- [ ] Record the incident in `known-issues.md` — what happened, what was done, what would prevent recurrence.
- [ ] See `../08-Deployment-Order-And-Rollback/phase21-launch-preparation.md` Section 7 for the full disaster-recovery plan (per-scenario: database, media, email, payment, worker, API, frontend failure).
