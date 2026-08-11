# Production Checklist

**Created:** Phase 21 (Production Smoke Test & Launch Automation), 2026-08-06 · Provider-specific version of `docs/deployment-checklist.md` (which remains the authoritative process-ordered checklist — this document names the specific recommended providers and does not repeat that document's step-by-step detail). Every checkbox below represents a real deployment requirement verified against this project's own architecture, not a generic template item.

## Domain
- [ ] Domain registered or ownership confirmed.
- [ ] Registrar account access confirmed (needed for DNS record changes).

## DNS
- [ ] A/CNAME record for the frontend domain → Vercel.
- [ ] CNAME for the API subdomain (e.g. `api.yourdomain.tld`) → Railway.
- [ ] DKIM/Return-Path records added for the Postmark-verified sending domain.
- [ ] Propagation confirmed (`dig`/`nslookup` the domain and see the expected target) before proceeding to smoke testing.

## SSL
- [ ] Confirmed Vercel/Railway auto-issue and auto-renew TLS certificates for the custom domain (no manual certificate management expected).
- [ ] HTTPS enforcement confirmed (HTTP requests redirect) once DNS is live — verify with `scripts/production-smoke-test.js`'s Security category.

## Vercel (frontend hosting — recommended, see `docs/phase17-deployment-launch-guide.md`'s comparison)
- [ ] Account created.
- [ ] Project linked to this repository (`apps/web` as the project root).
- [ ] Custom domain added and verified.
- [ ] Every `NEXT_PUBLIC_*` variable from `.env.production.example` set in the project's environment variables.
- [ ] Build succeeds on Vercel's own infrastructure (not just locally) — confirm via the first deploy's build log.

## Railway (backend/workers hosting — recommended)
- [ ] Account created.
- [ ] Service linked to this repository (`apps/api` as the service root).
- [ ] Custom domain (subdomain) added.
- [ ] Every variable from `.env.server.production.example` set in the service's environment variables.
- [ ] `NODE_ENV=production` confirmed set.
- [ ] Build succeeds on Railway's own infrastructure — confirm via the first deploy's build log.
- [ ] (Optional, once built) a second Railway service for `apps/workers`, once the Notifications-delivery worker exists (`docs/phase21-v1.1-roadmap.md`) — not required for initial launch.

## Postmark
- [ ] Account created.
- [ ] Sending domain added and DKIM/Return-Path DNS records added (see DNS section above).
- [ ] Domain verification confirmed complete (not just submitted).
- [ ] Production server token generated, set as `POSTMARK_API_KEY`.
- [ ] One real test email sent and received via Postmark's own testing tools before relying on the app to send the first real one.

## Neon (database — recommended, see `docs/phase17-deployment-launch-guide.md`)
- [ ] New, dedicated production project created (never reuse the dev/test project).
- [ ] Connection string copied, set as `DATABASE_URL`.
- [ ] `npx prisma migrate deploy` run successfully against it.
- [ ] Point-in-time recovery / automatic backups confirmed enabled, retention window noted.

## Backblaze (object storage — recommended)
- [ ] New, dedicated production bucket created (never reuse the Phase 13.7 verification bucket).
- [ ] Application key created, scoped to that bucket only.
- [ ] Bucket privacy confirmed private-by-default (access only via signed URLs, matching Phase 13.6's verified configuration).
- [ ] `STORAGE_ENDPOINT`/`STORAGE_BUCKET`/`STORAGE_ACCESS_KEY_ID`/`STORAGE_SECRET_ACCESS_KEY`/`STORAGE_REGION` set.
- [ ] One real object write+read confirmed (e.g. via `scripts/production-smoke-test.js --deep`'s Storage category).

## Environment Variables
- [ ] `.env.production.example` and `.env.server.production.example` used as the source of truth for what to set — every value real, none copied from development.
- [ ] `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`/`PASSWORD_PEPPER`/`MFA_ENCRYPTION_KEY` freshly generated on the owner's own machine (never inside an AI session — see `docs/production-secrets-checklist.md`).
- [ ] `STRIPE_SECRET_KEY` confirmed to be a **live** key, not a test key.
- [ ] No `.env*` file other than the committed `.example` templates ever committed (`.gitignore`'s `.env.*`/`!.env.example` pattern already covers this — confirmed unchanged).

## Security Headers
- [ ] Confirmed present on the live production backend: CSP, X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security (all built Phase 16) — verify with `scripts/production-smoke-test.js`'s Security category against the real production URL, not just localhost.
- [ ] CORS `Access-Control-Allow-Origin` confirmed to match the real production frontend URL (not a wildcard, not left at a dev value).

## Monitoring
- [ ] Error tracking (Sentry or equivalent) wired into both `apps/api` and `apps/web`.
- [ ] External uptime monitor watching the live frontend URL and `GET /api/v1/health`.
- [ ] At least one alert configured (error-rate spike, health-check failure, or 5xx threshold) and routed somewhere actually watched.

## Backups
- [ ] Neon's automatic backup/PITR confirmed active (see Neon section above).
- [ ] Manual on-demand backup procedure documented for use before any risky future change.

## Recovery
- [ ] `docs/deployment-checklist.md`'s Rollback Checklist and `docs/phase21-launch-preparation.md`'s Disaster Recovery Plan reviewed by whoever is executing the deployment, before it begins — not read for the first time during an incident.
- [ ] Rollback snapshot process (previous build's commit SHA + a fresh DB backup) confirmed to be taken immediately after a successful post-deployment smoke test.
