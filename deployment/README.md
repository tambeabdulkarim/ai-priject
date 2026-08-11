# deployment/

Created Phase 21 (Production Infrastructure Preparation). Placeholder structure only — **no provider-specific secrets, tokens, or real configuration exist in this folder.** Each subfolder holds a README describing what belongs there once a real deployment happens; none currently contains a working config.

This folder does not replace `docs/deployment-checklist.md` (the step-by-step process) or `docs/production-secrets-checklist.md` (the secret inventory) — it's a place for the artifacts those documents produce (provider config files, DNS records, SSL notes, monitoring dashboards) to eventually live, kept separate from application source (`apps/`) and shared packages (`packages/`).

| Folder | Purpose |
|---|---|
| `vercel/` | Frontend hosting config, once a real Vercel project is linked (see `docs/phase17-deployment-launch-guide.md` for the hosting recommendation). |
| `railway/` | Backend/workers hosting config, once a real Railway project is linked. |
| `backups/` | Notes on backup schedules/retention and manual on-demand backup procedures — not a place to store actual backup files. |
| `dns/` | DNS record documentation (A/CNAME/DKIM entries) for the production domain, once one is registered. |
| `ssl/` | Notes only — TLS certificates are expected to be provider-managed and auto-renewing (Vercel/Railway both handle this for custom domains); this folder documents that expectation, not manual certificate files. |
| `monitoring/` | Monitoring/alerting configuration notes (Sentry project links, uptime-monitor config) once wired up. |

**Nothing in this folder should ever contain a real secret.** If a provider's config format requires one inline, use the same `.example`-suffix convention as this project's `.env.example` files and keep the real file out of git via `.gitignore`.
