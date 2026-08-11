# Launch Package — Summary

**Created:** Phase 21 (Production Infrastructure Preparation), 2026-08-06 · A single-page summary of everything required to launch Phoenix. For full detail, see `docs/production-readme.md` (step-by-step), `docs/deployment-checklist.md` (checkbox form), and `docs/production-secrets-checklist.md` (every variable explained).

## Required Accounts

| Account | Purpose | Required? |
|---|---|---|
| Vercel | Frontend hosting (recommended) | Required (or an equivalent host) |
| Railway | Backend/workers hosting (recommended) | Required (or an equivalent host) |
| Neon (or another Postgres provider) | Production database | Required |
| Upstash | Production Redis | Required |
| Backblaze B2 (or another S3-compatible provider) | Production object storage | Required |
| Postmark | Transactional email delivery | Required |
| Stripe | Payments (Live mode) | Required |
| Domain registrar | Production domain | Required |
| Sentry (or equivalent) | Error tracking | Strongly recommended, not strictly blocking |
| An uptime-monitoring service | External health checking | Strongly recommended, not strictly blocking |
| OpenAI and/or Anthropic | AI Gateway | Optional — only if AI is in launch scope |
| Meilisearch host | Search | Not applicable — no backend integration exists yet |

## Required Credentials

See `docs/production-secrets-checklist.md` for the complete table (purpose, generation source, storage location, rotation guidance) for every one of: `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `PASSWORD_PEPPER`, `MFA_ENCRYPTION_KEY`, `DATABASE_URL`, `UPSTASH_REDIS_REST_URL`/`_TOKEN`, `STORAGE_ENDPOINT`/`STORAGE_BUCKET`/`STORAGE_ACCESS_KEY_ID`/`STORAGE_SECRET_ACCESS_KEY`/`STORAGE_REGION`, `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`, `POSTMARK_API_KEY`/`EMAIL_FROM_ADDRESS`, and (optional) `AI_PROVIDER_OPENAI_API_KEY`/`AI_PROVIDER_ANTHROPIC_API_KEY`.

**Zero real values for any of the above exist anywhere in this repository or this session.**

## Required Domains

- One production domain (e.g. `yourdomain.tld`) for the frontend.
- One subdomain (e.g. `api.yourdomain.tld`) for the backend, if not using a path-based routing scheme instead.
- The same domain (or a verified subdomain) must be usable for Postmark's DKIM/Return-Path sending-domain verification.

## Required Services (recap)

Hosting (frontend + backend) · Database · Cache/Redis · Object storage · Transactional email · Payments · DNS · TLS (provider-managed, no separate service needed) · Error tracking (recommended) · Uptime monitoring (recommended).

## Deployment Order

1. Database provisioned + migrated
2. Object storage provisioned
3. Email domain verification started (DNS propagation takes time — start early)
4. Production secrets generated (owner's own machine)
5. Backend deployed
6. Stripe live webhook registered against the now-live backend URL, backend redeployed with the secret
7. Workers deployed (only if built before launch — optional)
8. Frontend deployed
9. DNS pointed at both deployments
10. Monitoring wired up
11. Full smoke test run against live URLs
12. Rollback snapshot taken (DB backup confirmed + commit SHAs recorded)

*(Full detail: `docs/deployment-checklist.md`. Full step-by-step instructions: `docs/production-readme.md`.)*

## Expected Deployment Duration

- **Account creation + credential generation:** roughly 2–3 hours of owner-side work, most of it parallelizable across the different provider dashboards.
- **DNS propagation (domain + Postmark sending-domain verification):** highly variable, typically a few hours, worst case up to 24–48 hours — start this early and treat it as the critical path, not something to do last.
- **Actual deploy steps (backend, frontend, webhook registration):** a few hours of hands-on work once accounts and DNS are ready, faster with engineering support.
- **Smoke testing:** 1–2 hours for the full role-by-role checklist.

**Total, realistic estimate: 1–2 business days** from a standing start to a fully verified, monitored production deployment — consistent with `docs/phase21-launch-preparation.md`'s own estimate, dominated by DNS propagation wait time and account-creation overhead rather than any remaining engineering work.
