# Restore Point

**Version:** Phase 14.4 (Admin Platform Architecture Resolution)

**Status:** Complete — architectural ambiguity resolved, zero regressions

**Date:** 2026-08-05

## Current Project State

Candidate C of `docs/phase-14-plan.md`'s approved order is resolved: the project had two administrative surfaces with no reconciled owner (`apps/web`'s route tree and the standalone `apps/admin` app). This phase reviewed both in full, weighed the original approved architecture against the code's actual current state, and formally adopted **`apps/web` as the platform's one authoritative admin surface**, retiring `apps/admin`.

### Review performed before any code change (per this phase's explicit requirement)

- **`apps/admin`** — read directly, not assumed: `src/app/layout.tsx` (11 lines, bare HTML shell) and `src/app/page.tsx` (a component literally named `AdminPlaceholderPage` returning `null`, with a comment already stating it was scaffolding only). `package.json` confirmed zero dependency on `@phoenix/api-client`, `@phoenix/types`, `@tanstack/react-query`, or any auth mechanism — there was no real functionality to build on, only a shell.
- **Every `apps/web/[lang]/admin/*` route** — read `layout.tsx` (the shared shell: `RequireRole` guard + `Navigation`/`Footer` + `AdminSidebar`/`AdminBreadcrumbs`) and `page.tsx` (the dashboard, using `useAnalyticsOverview`, real backend data, an honest UI note about what metrics genuinely don't exist rather than fabricating them). Confirmed via direct import inspection that `RequireRole`, `AdminSidebar`, and every admin page depend on `apps/web`'s own `useAuth`/`constants/routes`/`lib/i18n` — none of this exists as a shared package `apps/admin` could import instead.
- **`docs/09-PLATFORM-ARCHITECTURE.md` §16** — read in full, not skipped. The original, approved plan: a separate app, separate subdomain, separate deploy pipeline, explicitly for security blast-radius isolation (an admin XSS/dependency vuln can't leak into the public bundle) and independent network restrictions (IP allowlist/VPN). This is a real, substantive rationale, not an arbitrary scaffold choice — weighed seriously in the decision below, not dismissed for convenience.
- **Backend test coverage** — confirmed `apps/api/src/modules/admin` has real, passing unit tests (`analytics.service.spec.ts`, `moderation.service.spec.ts`), unaffected either way by the frontend-topology decision.

### Decision

**`apps/web` is the platform's one authoritative admin surface. `apps/admin` is formally retired.**

Weighed explicitly against this phase's stated decision criteria:

- **Engineering quality:** `apps/web`'s admin routes are real, tested, and correctly permission-gated today. `apps/admin` is not — building it out for real, right now, under this phase's "no UI redesign" constraint, would mean either extracting `Navigation`/`Footer`/`AuthProvider`/`QueryClientProvider`/`RequireRole`/i18n into a real shared package first (a genuine architecture project of its own) or duplicating all of it into `apps/admin` wholesale.
- **Long-term maintenance:** duplicating that infrastructure would create exactly the kind of duplicated-responsibility problem this phase's acceptance criteria explicitly forbid ("No duplicated responsibilities may remain") — two copies of core app plumbing to keep in sync forever, a maintenance liability, not a resolution.
- **Scalability / deployment strategy:** §16's isolation rationale is real and not dismissed — it's preserved, updated (not deleted), and left as a legitimate future project once a real shared-component extraction makes it achievable without duplication. Nothing about this platform's current traffic or security posture demands that isolation today in a way that justifies rushing an incomplete or duplicated implementation under this phase's scope constraints.
- **This is a genuine engineering trade-off, made and documented, not a silent override.** Per `engineering-standards`' Technical Authority clause ("challenge assumptions when necessary... protect the platform even if a weaker implementation is suggested"): executing the original separate-app plan today, given the code's actual state, would have produced either an incomplete admin app or real duplicated logic — both worse outcomes than consolidating on what already works.

## What Was Changed

- **`apps/admin/README.md`** (new) — explains the retirement, why the directory is kept (not deleted), and points to this restore point and `docs/09-PLATFORM-ARCHITECTURE.md` §16.
- **`apps/admin/src/app/page.tsx`** — comment updated from a forward-reference ("built in Phase 10") to reflect the actual, final decision.
- **`.github/workflows/ci.yml`** — `build-frontend` job renamed ("Frontend Build (web)"), no longer builds `@phoenix/admin`; comment explains why. The `quality` job (lint/type-check) still covers `apps/admin` — harmless, and keeps it from silently rotting if anyone touches it later.
- **`docs/09-PLATFORM-ARCHITECTURE.md`** §16 — a "Status (Phase 14.4 — superseded)" block added above the original text, which is preserved unchanged underneath (not deleted) for future reconsideration. §21 (Deployment Strategy)'s `apps/admin` mention corrected to reflect it's not part of the deployment plan.
- **Documentation:** `docs/project-status.md`, `docs/known-issues.md`, `docs/next-session.md`, `docs/documentation-index.md` — all updated to reflect the resolution.

**Not changed:** any file inside `apps/web/src/app/[lang]/admin/*`, `apps/web/src/components/admin/*`, `apps/web/src/hooks/useAnalytics.ts`/`useAdminUsers.ts`/`useModeration.ts`, `apps/api/src/modules/admin/*`, any route, any permission, any API contract. Zero business logic touched.

## Post-Implementation Verification Pass (final, before closure)

A dedicated final verification (requested separately, after the implementation above) confirmed two things with fresh evidence rather than re-asserting the original claims:

1. **CI coverage confirmed unreduced for every active app/package**, via `turbo run build --filter=@phoenix/web --dry-run=json`: the dependency graph for `build-frontend` still includes `@phoenix/api-client` and `@phoenix/types` exactly as before — removing `@phoenix/admin` from the filter list changed only `apps/admin`'s own coverage, nothing else's.
2. **A repo-wide search for stale "apps/admin is active" references found 4 real ones** — comments in `apps/web/src/types/auth.ts`, `packages/api-client/index.ts`, `packages/api-client/src/core/client-config.ts`, and `packages/types/index.ts`, each describing `apps/admin` as an active, intended consumer of shared code ("shared by apps/web, apps/admin, and the future apps/mobile"). **Fixed** — each now reads "apps/web and a future apps/mobile (apps/admin is retired, see `docs/09-PLATFORM-ARCHITECTURE.md` §16)." Comment-only, zero behavior change, confirmed by a full re-run of type-check (9/9), lint (9/9), format-check (clean), backend tests (201/201), and `apps/web`'s production build.

Seven other `apps/admin` mentions found in the same search were confirmed correct as-is (deliberately still linted, the CI comment explaining the retirement, the retired app's own `package.json` name, the auto-generated lockfile, and `infra/docker/docker-compose.yml`'s accurate statement about what runs via `turbo dev`) — not edited.

## Regression Verification

- `npm run type-check` — 9/9 workspaces passing (including `apps/admin`, still type-checks cleanly).
- `npm run lint` — 9/9 workspaces passing (including `apps/admin`, still lints cleanly — `next lint` confirms "No ESLint warnings or errors").
- `npm run format:check` — clean.
- `npm test --workspace=apps/api` — 201/201 passing, unaffected (no backend code touched).
- `npx turbo run build --filter=@phoenix/web` — succeeds; **all 6 admin routes confirmed present in the build output** (`/[lang]/admin`, `/admin/analytics`, `/admin/audit-logs`, `/admin/settings`, `/admin/users`, `/admin/users/[id]`), byte-for-byte unchanged from before this phase.
- `apps/admin`'s own `npm run build` — independently re-run and confirmed still clean (4 static pages generated) — retiring it from the CI gate didn't break it; it simply isn't the canonical surface.

## Architecture Review

- **Exactly one authoritative admin architecture now exists**, satisfying this phase's acceptance criterion directly: `apps/web`, documented as such in both `docs/project-status.md` and `docs/09-PLATFORM-ARCHITECTURE.md`.
- **No duplicated responsibility remains** — `apps/admin` has no real functionality to duplicate anything with; it's inert.
- **The original isolation rationale is preserved, not lost** — a future team revisiting real admin-app separation has the original reasoning intact in §16, plus this phase's explicit account of why it wasn't pursued now and what would need to be true first (a real shared-component/auth library).

## Remaining Risks

None introduced by this phase — every change is either documentation, CI-scope, or an inert retired app's own comments. Carried over, unaffected: MFA opt-in-not-mandatory, no CI remote verification yet, Notifications/Search unimplemented, no email provider, Docker/WSL2 unusable locally, no malware scanning, the dual phase-numbering-system issue.

## Safe Resume Point

Candidate C is closed. Per `docs/phase-14-plan.md`'s order, proceed to **Candidate D (Notifications delivery)** next — note its own real dependency on an email-provider decision, carried over from Phase 14.2's MFA-notification gap; deciding the email provider once unblocks both.

## Restorability

**Recommended starting point:** `docs/documentation-index.md`, then `docs/project-status.md`'s Platform Implementation Status table, then `docs/phase-14-plan.md`.

**Guaranteed minimum fallback** — if only the following four files survive:

1. `docs/project-status.md` — current phase (14.4, complete), the admin decision and why, next candidate (Notifications).
2. `docs/known-issues.md` — the `apps/admin` entry, now marked RESOLVED with full reasoning.
3. `docs/next-session.md` — what to read first, the real next decision points (email provider, CI remote confirmation, MFA enforcement).
4. `docs/restore-point-phase14.4.md` (this file) — the authoritative snapshot of the decision, its reasoning, and what was/wasn't changed.
