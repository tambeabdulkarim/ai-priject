# Restore Point

**Version:** Phase 17 (Deployment & Production Launch Planning)

**Status:** Complete. Pure planning/documentation phase — **zero code, configuration, or infrastructure changes made**, per the phase's own "operational, not feature development" framing and its explicit addendum against creating hosting-provider-specific files without a justified comparison, and against assuming decisions that belong to the project owner.

**Date:** 2026-08-06

## What This Phase Was

The sixth thread in this project's session history. Phase 16 closed every Critical engineering blocker Phase 15 found; this phase answers the remaining question — how does a first production deployment actually happen — without unilaterally making the decisions (hosting provider, domain, DNS) that belong to the project owner. The full deliverable is **`docs/phase17-deployment-launch-guide.md`**; this restore point summarizes it and records what was deliberately not done and why.

## What Was Produced

One comprehensive guide, `docs/phase17-deployment-launch-guide.md`, covering:

1. **Hosting comparison** — Vercel, Railway, Render, Fly.io, Azure, AWS compared across a real feature/complexity/cost table for both `apps/web` and `apps/api`/`apps/workers` separately (they have different requirements — Vercel is unambiguously wrong for the long-running NestJS backend, right for the Next.js frontend). **Recommendation:** Vercel (frontend) + Railway (backend/workers, Render as an equally-valid substitute) — justified, not asserted, and explicitly framed as a recommendation for the project owner to confirm, not a decision already made.
2. **Infrastructure diagram** (Mermaid) showing the full recommended topology alongside the already-live managed services (Neon, Upstash, B2, Postmark, Stripe) that this phase did not re-decide.
3. **Environment guide** — the real, current `apps/api/.env.example`/`apps/web/.env.example` reproduced with production-specific annotations, a secret-generation command table, and rotation guidance grounded in what each secret actually protects (e.g., why `PASSWORD_PEPPER` must never be casually rotated, unlike the JWT keypair).
4. **Database, storage, and email sections** — Neon backup/PITR and migration-safety practice (`migrate deploy`, never `migrate dev`/`db push`, with the exact prior incident from `docs/known-issues.md` cited as why this matters), Backblaze B2 retention gaps, and a full Postmark/SPF/DKIM/DMARC production checklist.
5. **Monitoring guide** — what already exists (the Phase 16 health endpoint, structured logging) versus what doesn't (uptime monitoring, crash reporting, metrics) with a priority-ordered recommendation for adding them post-launch.
6. **Production security review** — confirms what Phase 15/16 already verified, flags what specifically changes for a real domain (CORS origin, HTTPS enforcement, cookie `secure` flag behavior).
7. **Production Checklist, 3-stage Launch Checklist, Rollback/Backup/Recovery plans, Operational Risks, Engineering Recommendation, and a final Go/No-Go Decision section** — all as required deliverables.

## Real Findings From This Phase's Own Investigation (not previously documented)

- **No Dockerfile exists anywhere in the repository**, despite `docs/09-PLATFORM-ARCHITECTURE.md` §21 committing to containerizing `apps/api`/`apps/workers`. Directly relevant to the hosting comparison (Railway/Render don't need one; Fly.io/ECS/Azure Container Apps would).
- **`apps/web/vercel.json` is a stale, actively-wrong leftover** from the pre-Phoenix scaffold project (`"name": "ai-productivity-platform"`, legacy Vercel v2 `builds` array syntax that predates modern zero-config Next.js deploys). Found, documented as a concrete pre-launch action item in the Production Checklist — **not corrected or deleted this phase**, since doing so would be modifying a hosting-provider-specific config outside this phase's read-only/planning scope.
- **Terraform is confirmed scaffolding-only** (`infra/terraform/README.md` says so explicitly) — the real, live Neon/Upstash/B2 setup this project has used since Phase 13.6/13.7 was provisioned manually, not reproducibly from code. A real gap between documented intent and practice, not a launch blocker.
- **Certificates have no real PDF generation** (`certificates.service.ts`'s own header: `pdfFileId` is always `null`, no PDF-rendering library exists) — a pre-existing, already-disclosed gap, re-surfaced here because it directly affects what "object storage in production" needs to actually serve at launch.

## Validation

Not applicable in the usual sense — this phase made no code changes, so there is nothing to type-check, lint, build, or test. The one form of validation performed was factual: every claim in the guide (Dockerfile absence, `vercel.json`'s exact stale content, Terraform's scaffolding-only status, certificates' `pdfFileId: null` state, the real current `.env.example` contents) was verified by directly reading the relevant file, not inferred or assumed.

## Architecture Review

No architecture changes. The recommended topology (Vercel + Railway) is consistent with, not a departure from, `docs/09-PLATFORM-ARCHITECTURE.md` §21's original plan — this phase narrows "Railway/Fly.io/ECS" down to one justified recommendation rather than introducing a new direction.

## Remaining Risks

Everything from `docs/phase16-production-validation-report.md`'s Remaining Issues is unaffected (Postmark credentials, 27 dependency findings, no CD workflow, CI unverified on a real push, unbuilt Notification email channel, no monitoring service, unverified backup policy — several of these are now directly addressed *as guidance* in this phase's guide, e.g. backup policy is now documented as "confirm Neon PITR is enabled on the production plan," but no one has actually confirmed it yet since no production Neon project exists). New from this phase: the Dockerfile gap, the stale `vercel.json`, and Terraform's scaffolding-only status are now explicitly tracked (see `docs/known-issues.md`).

## Safe Resume Point

Per the phase's closing instruction, **wait for approval before Phase 18.** The guide's own Go/No-Go section is explicit: **No-Go today**, blocked entirely on four owner decisions (hosting provider, domain, DNS access, fresh production secrets) — none requiring further engineering work. Once those are made, the guide converts to Go without needing to be rewritten; it needs to be executed.

## Restorability

**Recommended starting point:** `docs/documentation-index.md` → `docs/project-status.md`'s Current Phase section → `docs/phase17-deployment-launch-guide.md` (the complete guide) → this file.

**Guaranteed minimum fallback:**
1. `docs/phase17-deployment-launch-guide.md` — the complete deployment/launch guide, hosting comparison, all checklists, disaster recovery, and the Go/No-Go decision.
2. `docs/project-status.md` — current phase and pointer to the guide.
3. `docs/known-issues.md` — the Dockerfile/vercel.json/Terraform findings folded into the existing structure.
4. `docs/next-session.md` — the real next decision points (which are, explicitly, the project owner's to make).
