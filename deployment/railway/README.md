# deployment/railway/

Placeholder. Once the backend (`apps/api`) and, eventually, `apps/workers` are deployed to Railway, project-level notes (service names, linked domains, environment-variable group names — never real values) belong here. No config exists yet.

Note: no Dockerfile currently exists for `apps/api` despite the original architecture doc committing to containerizing the backend (flagged in `docs/phase17-deployment-launch-guide.md` and `docs/version-1.0-freeze.md`'s technical debt table) — Railway can build directly from the Node project without one, but a real Dockerfile remains a reasonable future addition, not a launch blocker.
