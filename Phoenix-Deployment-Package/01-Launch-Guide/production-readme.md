# Production README — Deploying Phoenix From Zero

**Created:** Phase 21 (Production Infrastructure Preparation), 2026-08-06 · Written for a future engineer with no prior context on this project, deploying it for the first time. No assumptions about prior knowledge of Phoenix's internals — only familiarity with standard web deployment concepts (DNS, environment variables, hosting dashboards) is assumed.

## 0. What you're deploying

Phoenix is a course marketplace / learning platform: a NestJS backend (`apps/api`), a Next.js frontend (`apps/web`), and an as-yet-unbuilt background-worker app (`apps/workers`, currently an empty shell — not required for launch). Version 1.0 is frozen (the main Phoenix repository's `docs/version-1.0-freeze.md`) — the code itself is complete and tested; what remains is entirely infrastructure setup, which is what this document walks through.

## 1. Prerequisites

**⚠️ This package requires a full clone of the Phoenix repository alongside it.** Everything in `Phoenix-Deployment-Package/` is for reading and reference; the actual build/migrate/smoke-test commands below only work from inside a real, full clone of the Phoenix monorepo (they call `npm run build`, the Prisma CLI, and Turbo — none of which exist inside this package folder alone). Clone the repository before starting Step 1.

- A GitHub (or equivalent) account with access to the Phoenix repository, and a full local clone of it.
- Node.js (version matching `apps/api/package.json`'s `engines` field, if set — otherwise use a current LTS release) installed locally, for running one-time setup commands.
- Accounts you will need to create (see `../07-Required-Service-Accounts/launch-package.md` for the full list): a hosting provider (Vercel + Railway recommended), Neon (or another Postgres provider), Upstash, Backblaze B2 (or another S3-compatible storage provider), Postmark, Stripe, and a domain registrar.

## 2. Step-by-step deployment

### Step 1 — Provision the database
Create a new Postgres project with your chosen provider (Neon recommended — serverless, generous free tier, native branching). Copy the connection string. **Do not use any database instance from this project's own development history** — always start with a fresh, empty production database.

### Step 2 — Run migrations
From `apps/api`, with `DATABASE_URL` set to your new production connection string:
```
npx prisma migrate deploy
```
This applies all 21 existing migrations in order. **Never run `prisma db push` in production** — it can silently diverge from the migration history.

### Step 3 — Provision Redis
Create a new Upstash Redis database. Copy the REST URL and REST token.

### Step 4 — Provision object storage
Create a new bucket with your chosen S3-compatible provider (Backblaze B2 recommended per this project's own architecture notes). Create an application key scoped to that bucket. Copy the endpoint, bucket name, key ID, secret key, and region.

### Step 5 — Generate secrets
On your own machine (never in a shared or AI-assisted session):
```
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"   # run twice — once for PASSWORD_PEPPER, once for MFA_ENCRYPTION_KEY
```
See `../06-Environment-Variables/production-secrets-checklist.md` for what each value is used for.

### Step 6 — Set up Postmark
Create a Postmark account, add your sending domain, and add the DKIM/Return-Path DNS records Postmark provides to your domain registrar or DNS provider. Wait for verification (can take a few hours). Generate a server token.

### Step 7 — Deploy the backend
Deploy `apps/api` to your chosen backend host (Railway recommended). Set every variable from `.env.server.production.example` in that host's environment-variable configuration, using the real values gathered in Steps 1–6. Deploy. Confirm it starts successfully and `GET /api/v1/health` responds.

### Step 8 — Register the Stripe webhook
Only now, with a real backend URL live, go to the Stripe dashboard (Live mode) and register a webhook endpoint pointing at `https://<your-backend-url>/api/v1/webhooks/stripe` (confirm the exact path against the main Phoenix repository's `apps/api/src/modules/payments` controller). Copy the webhook signing secret, add it as `STRIPE_WEBHOOK_SECRET` to your backend host's environment, and redeploy.

### Step 9 — Deploy the frontend
Deploy `apps/web` to your chosen frontend host (Vercel recommended). Set every variable from `.env.production.example` (the `NEXT_PUBLIC_*` ones, plus the shared database/redis/storage ones **only if the frontend build itself needs them** — check `apps/web`'s own build output for any reference before assuming it does; most of the shared block in that template exists for reference, not because the frontend directly consumes it). Deploy.

### Step 10 — Point DNS
At your domain registrar or DNS provider, point your domain at the frontend host and a subdomain (e.g. `api.yourdomain.tld`) at the backend host, following each provider's custom-domain instructions. Wait for propagation.

### Step 11 — Wire up monitoring
Create a Sentry (or equivalent) project for each app, add the SDK/DSN to each app's environment, redeploy. Set up an external uptime monitor watching your live frontend URL and `GET /api/v1/health`.

### Step 12 — Smoke test
Run through `../08-Deployment-Order-And-Rollback/phase21-launch-preparation.md` Section 5 in full, against your real, live, DNS-resolved URLs — not localhost.

### Step 13 — Take a rollback snapshot
Record the exact deployed commit SHA for both apps, and confirm your database provider's backup/PITR is active. This is your restore point if something goes wrong in the following hours.

## 3. Health verification

`GET /api/v1/health` (public, no auth required — see the main Phoenix repository's `apps/api/src/health/health.controller.ts`) returns a JSON object with boolean fields:

```json
{ "database": true, "redis": true, "storage": true, "stripe": true, "email": true }
```

- `database` — a real `SELECT 1` against the configured `DATABASE_URL`.
- `redis` — connectivity to the configured Upstash instance.
- `storage` — connectivity to the configured S3-compatible endpoint.
- `stripe` — whether `STRIPE_SECRET_KEY` is set and minimally valid.
- `email` — whether `POSTMARK_API_KEY` and `EMAIL_FROM_ADDRESS` are both set (does not send a real test email on every health check — that would be wasteful; it reflects configuration presence).

**Other production endpoints worth confirming respond correctly post-deploy** (a non-exhaustive smoke sample — see `../08-Deployment-Order-And-Rollback/phase21-launch-preparation.md` Section 5 for the full role-by-role checklist):
- `POST /api/v1/auth/login` and `POST /api/v1/auth/register`
- `GET /api/v1/courses` (public catalog read)
- `POST /api/v1/orders` (checkout initiation)
- `POST /api/v1/media/uploads` (upload flow)

**Smoke-test checklist:** use `../08-Deployment-Order-And-Rollback/phase21-launch-preparation.md` Section 5 in full — it is the authoritative, role-by-role (Learner/Instructor/Moderator/Admin) smoke-test plan and is not duplicated here to avoid the two documents drifting out of sync.

## 4. If something goes wrong

See `../02-Production-Checklist/deployment-checklist.md`'s Rollback Checklist and `../08-Deployment-Order-And-Rollback/phase21-launch-preparation.md` Section 7 (Disaster Recovery Plan) for per-scenario guidance (database, storage, email, payment, worker, API, frontend failure).

## 5. What you do NOT need to do

- You do not need to write any new code — v1.0 is frozen and complete.
- You do not need to configure `apps/admin` — it was formally retired in Phase 14.4; `apps/web`'s own `/admin` route tree is the one authoritative admin surface.
- You do not need to build `apps/workers` before launching — it is an empty shell today; Notifications will simply not deliver beyond the synchronous auth-flow emails until it's built (a disclosed, non-blocking gap — see the main Phoenix repository's `docs/phase21-v1.1-roadmap.md`).
- You do not need Meilisearch/search infrastructure — not wired into the application layer yet.
