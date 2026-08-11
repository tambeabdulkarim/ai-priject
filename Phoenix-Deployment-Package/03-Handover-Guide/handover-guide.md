# Phoenix Platform — Deployment Operator Handover Guide

**Created:** Phase 21 (Production Smoke Test & Launch Automation), 2026-08-06 · **Written for a technical operator with zero prior project knowledge.** You do not need to understand Phoenix's business logic, read its architecture docs, or make any engineering decisions to complete a deployment using this guide — every decision that required project context has already been made and documented. Your job is to execute, verify, and report back; not to design or troubleshoot business logic.

## What you're deploying

A course marketplace / learning platform: a NestJS backend, a Next.js frontend, and an (empty, not required) background-worker app. The code is complete, frozen, and tested (209/209 backend tests passing, both apps build clean) — this is a pure infrastructure deployment, not a software delivery task.

## Prerequisites

**⚠️ This package requires a full clone of the Phoenix repository alongside it.** This package (`Phoenix-Deployment-Package/`) is a reading and reference bundle — the checklists, guides, and secret inventories inside it are self-contained, but the smoke-test scripts, build commands, and Prisma/Turbo commands referenced throughout are not: they only run from inside a real, full clone of the Phoenix monorepo (they call `npm run build`, `npx prisma migrate deploy`, `npx turbo`, etc., none of which exist inside this package folder alone). Clone the repository first; use this package as your guide while working inside that clone.

- A full clone of the Phoenix repository (not just this package).
- Command-line access to that repository, with Node.js installed (a current LTS release).
- Access to create accounts with: Vercel, Railway, Neon, Upstash, Backblaze (or equivalent providers — see the main Phoenix repository's `docs/phase17-deployment-launch-guide.md` if a substitution is being considered), Postmark, Stripe, and a domain registrar.
- Enough access to add DNS records for the production domain (either directly, or via whoever holds registrar access).

## Required Accounts

See `../07-Required-Service-Accounts/launch-package.md`'s "Required Accounts" table for the full list with purpose and required/optional status. In short: everything above under Prerequisites, plus optionally Sentry (or equivalent) and an uptime monitor — both strongly recommended, not strictly blocking.

## Required Credentials

Every credential you will need to generate or obtain, with exactly what it's for, where to generate it, and how to store it: `../06-Environment-Variables/production-secrets-checklist.md`. **Do not generate `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `PASSWORD_PEPPER`, or `MFA_ENCRYPTION_KEY` anywhere except your own local machine** — the exact commands are in that document and in `.env.server.production.example`.

**No real credential of any kind exists anywhere in this repository.** The `.env.production.example` and `.env.server.production.example` files (repo root) are templates with placeholder/blank values only — fill them in with real values in your hosting provider's environment-variable configuration, never by committing a filled-in `.env` file.

## Deployment Order

Follow `../02-Production-Checklist/deployment-checklist.md` in full, in order. The short version:

1. Database (Neon) provisioned and migrated
2. Object storage (Backblaze) provisioned
3. Email (Postmark) domain verification started — **start this early, DNS propagation is the slowest step**
4. Secrets generated (your own machine)
5. Backend deployed (Railway)
6. Stripe live webhook registered against the now-live backend, backend redeployed with the secret
7. Workers deployed — **skip this step**, `apps/workers` is an empty shell not required for launch
8. Frontend deployed (Vercel)
9. DNS pointed at both deployments
10. Monitoring wired up
11. Full smoke test run (see below)
12. Rollback snapshot taken (DB backup confirmed + commit SHAs recorded)

For copy-paste-ready command sequences at each step, use `../01-Launch-Guide/production-readme.md` — it walks the same 13 steps with the exact commands.

## Post-Deployment Validation

Run the automated smoke test against your real, live, DNS-resolved production URLs — not localhost. **This command must be run from the root of a full Phoenix repository checkout** (not from inside this package — see Prerequisites above; the copy at `../04-Smoke-Test/production-smoke-test.js` is provided in this package for reading/reference only):

```
# Run from the root of your Phoenix repository checkout:
API_BASE_URL=https://api.yourdomain.tld WEB_BASE_URL=https://yourdomain.tld \
node scripts/production-smoke-test.js
```

Every line of output is labeled PASS, FAIL, or WARN with a plain-English explanation — you do not need to interpret raw logs. **Any FAIL must be resolved before declaring the deployment complete.** WARN lines are expected and documented (e.g., "requires --deep and fixture credentials," "certificate PDF generation is a known, disclosed v1.0 gap") — read each one, but a WARN alone does not block launch.

Once satisfied, optionally re-run with `--deep` and a real, low-privilege fixture account to additionally verify login/session/logout/refresh behavior end-to-end.

Fill in `../04-Smoke-Test/production-verification-report-template.md` with the real results of this run — this is the record that the deployment was actually verified, not just attempted.

## Rollback Steps

If the smoke test shows a FAIL, or something breaks after declaring launch complete:

1. Identify the failing component from the smoke test / monitoring output.
2. Redeploy the previous known-good build (your hosting provider's own "redeploy previous version" feature — both Vercel and Railway support this without you needing to rebuild manually).
3. For a data-level problem, use Neon's point-in-time recovery to restore to just before the incident.
4. Re-run the smoke test to confirm the rollback resolved it.
5. Record what happened in the project's `known-issues.md`.

Full detail, including per-scenario guidance (email failure, payment failure, worker failure, etc.): `../02-Production-Checklist/deployment-checklist.md`'s Rollback Checklist and `../08-Deployment-Order-And-Rollback/phase21-launch-preparation.md` Section 7.

## Emergency Contacts

*(Placeholder — fill in before going live. This tooling cannot know who your team's on-call engineer, hosting-provider support contact, or project owner is.)*

| Role | Name | Contact | Notes |
|---|---|---|---|
| Project owner / final decision-maker | _______________ | _______________ | |
| On-call engineer | _______________ | _______________ | |
| Hosting provider support (Vercel) | — | vercel.com/support | |
| Hosting provider support (Railway) | — | railway.app/help | |
| Database provider support (Neon) | — | neon.tech/docs/introduction/support | |
| Payments provider support (Stripe) | — | support.stripe.com | |
| Email provider support (Postmark) | — | postmarkapp.com/support | |

## Known Risks

Real, disclosed, non-hidden gaps you should know about before declaring launch complete — none of these block deployment, but each is worth understanding so a real user report doesn't look like a deployment mistake:

- **No async Notifications worker.** Users receive real email only for auth-flow events (verification, password reset, MFA); no post-purchase/enrollment email exists yet (`apps/workers` is an empty shell). Not a bug — a disclosed, scoped-out-of-v1.0 gap.
- **No certificate PDF generation.** Certificate records are created correctly; the downloadable PDF field (`pdfFileId`) is always null. A support ticket asking "where's my certificate PDF" is expected, not a regression.
- **No monitoring is pre-configured.** You must wire up error tracking and uptime monitoring yourself as part of this deployment — it is not optional in practice, even though the smoke test won't FAIL without it.
- **AI features require real provider credentials and incur real per-request cost.** If AI is in launch scope, budget/monitor usage; if not, it's safe to leave `AI_PROVIDER_*` blank — the feature will simply be unavailable, not broken.
- **Search does not exist.** No user-facing gap today (the catalog is small), but don't be alarmed that there's no search backend to configure — it's genuinely not built yet, not a missed step in this guide.
