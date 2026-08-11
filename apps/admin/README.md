# `apps/admin` — Retired (Phase 14.4)

**This app is not the platform's administration surface.** The real, working, permission-gated admin functionality (analytics, audit logs, settings, user management) lives at `apps/web/src/app/[lang]/admin/*` and is backed by the tested `apps/api/src/modules/admin` module.

## Why this directory still exists

`docs/09-PLATFORM-ARCHITECTURE.md` §16 originally specified a separate, independently-deployed admin app for security isolation (blast-radius containment, independent network restrictions). This directory was scaffolded for that plan but never built out beyond a placeholder — see `src/app/page.tsx`.

Phase 14.4 (`docs/restore-point-phase14.4.md`) reviewed both surfaces and formally superseded that plan: every real admin page already built lives in `apps/web`, tightly coupled to its shared `AuthProvider`, `QueryClientProvider`, `RequireRole` guard, `Navigation`/`Footer`, and i18n system — none of which exist as a shared package today. Properly extracting those into a real shared library first, then building this app out for real, would be a genuine architecture project of its own, not a same-phase migration. Consolidating on `apps/web` was the stronger engineering call given the actual state of the code, not a preference override of the original doc for its own sake — see the restore point for the full reasoning.

This directory is kept in place (not deleted) as inert history and a real starting point if the isolation goal is ever revisited deliberately, with a real shared-component extraction planned first. It is excluded from the CI build-frontend job (`.github/workflows/ci.yml`) since it is no longer part of the validated, deployed system.
