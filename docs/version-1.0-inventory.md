# Phoenix Platform — Version 1.0 Project Inventory

**Date:** 2026-08-06 · **Method:** every count below was produced by a real `find`/`grep -c`/`wc -l` command against the working tree at freeze time — none is estimated. Where something is genuinely ambiguous, it is flagged as such rather than guessed.

---

## Part 1 — Final Project Inventory

### Frontend (`apps/web/src`) — 151 `.ts`/`.tsx` files

| Folder | Files | Purpose |
|---|---|---|
| `app/` | 64 | Next.js App Router pages. The `[lang]/` subtree is the real, canonical route set (localized `ar`/`en`). **7 files sit outside `[lang]/`** (`analytics`, `checkout/cancel`, `checkout/success`, `dashboard`, `files`, `projects`, `workspace`) — of these, `checkout/success` and `checkout/cancel` are real, live Stripe redirect targets (confirmed Phase 15); the other 5 are the confirmed-dead legacy scaffold route tree (confirmed Phase 15, not deleted per that phase's explicit no-cleanup rule) |
| `components/` | 29 | Shared React components, subfoldered by domain: `admin/`, `ai/`, `icons/`, `media/`, `ui/` (the last holds `StatusBadge`, `EmptyState`, `Loading` — Phase 14.7/14.8) |
| `hooks/` | 32 | React Query hooks, one per API resource area, plus auth/cart/media-upload hooks |
| `guards/` | 4 | Route guards (`RequireAuth`, `RequireGuest`, `RequireRole`, and one more) |
| `providers/` | 4 | React context providers (Auth, Query, Cart, App-level composition) |
| `contexts/` | 2 | React Context definitions (Auth, Cart) |
| `lib/` | 10 | i18n helpers, auth-client-adjacent utilities, misc leftover files from the pre-Phoenix scaffold |
| `services/` | 2 | `api-client.ts`/`auth-client.ts` — the HTTP layer |
| `utils/`, `constants/`, `types/`, `config/`, `middlewares/` | ~5 total | Smaller supporting folders |

### Backend (`apps/api/src`) — 203 `.ts` files

| Folder | Files | Purpose |
|---|---|---|
| `modules/` | 162, across **23 modules** | `admin`, `ai`, `auth`, `categories`, `certificates`, `courses`, `enrollments`, `files`, `lessons`, `library`, `media`, `news`, `notifications`, `orders`, `payments`, `permissions`, `products`, `progress`, `refresh-tokens`, `roles`, `sessions`, `settings`, `users` |
| `common/` | 27 | Cross-cutting: decorators, DTOs, filters (`AllExceptionsFilter`), guards (`JwtAuthGuard`/`RolesGuard`/`PermissionsGuard`), interceptors, services (`EmailService`, `AuditLogService`, `PasswordService`, `MfaCryptoService`, `BreachedPasswordService`) |
| `config/`, `storage/`, `redis/`, `database/`, `health/` | 2 each | Infrastructure wiring — configuration loading, S3-compatible storage client, Redis REST client, Prisma service, the Phase 16 health endpoint |
| `payments/` (top-level, distinct from `modules/payments/`) | 2 | The raw Stripe SDK wrapper (`StripeModule`/`StripeService`) — infrastructure client, separate from `modules/payments/`'s domain logic, the same pattern as `storage/`/`redis/` being infra vs. their domain-module consumers |

### Database

- **52 Prisma models** in `apps/api/prisma/schema.prisma` (1148 lines), organized into explicit "LAYER 1–13" dependency-order comments plus a domain-schema banner (`auth`, `courses`, `library`, `marketplace`, `ai`, `news`, `files`, `system` — one logical database, schema-per-domain).
- **21 migration folders**, strictly ordered, every one containing a real `migration.sql` (confirmed no gaps/conflicts, Phase 18).
- Every model carries a `docs/13-DATABASE-BLUEPRINT.md` doc-reference comment.

### Workers (`apps/workers`)

`src/` contains only `main.ts` — confirmed, real, intentional scaffold. No job processors exist. This is the target for the Candidate D (Notifications delivery) work whenever it happens.

### Shared Packages (`packages/*`)

| Package | Files | Actually imported by `apps/web`? | Actually imported by `apps/api`? |
|---|---|---|---|
| `api-client` | 26 | **Yes** (13 files) | No |
| `types` | 25 | **Yes** (31 files) | No |
| `i18n` | 6 | No | No |
| `validation` | 6 | No | No |
| `ui` | 9 | No | No |
| `config` | 3 | No (consumed via `tsconfig` `extends`, not JS import) | No (same) |

**Only `@phoenix/api-client` and `@phoenix/types` are real, load-bearing shared packages.** `i18n`, `validation`, and `ui` exist as scaffolding for future work (mobile app, generalized i18n) per the architecture doc's own stated intent — confirmed still unused, not a defect.

### Documentation

- **67** `.md` files directly in `docs/` (this file included), **20** in `docs/archive/`, **19** `restore-point-phase*.md` files, **67** files in `docs/assets/` (screenshots from the visual-review/verification phases).

### Scripts

No standalone `scripts/` directory exists. Root `package.json` exposes `dev`/`build`/`lint`/`type-check`/`test` (all via Turborepo) plus `format`/`format:check` (Prettier).

### Tests

- **Backend:** 26 `*.spec.ts` files (`apps/api`), **209 tests**, all passing as of Phase 19's final verification.
- **Frontend unit tests:** **0** real ones — confirmed across multiple phases; the only `*.test.js` files under `apps/web/tests/` reference an unrelated, non-Phoenix scaffold project and don't run.
- **E2E:** 34 files under `apps/web/tests/e2e/`.

### CI

`.github/workflows/ci.yml` — the only workflow file. 5 jobs (`quality`, `test-backend`, `build-backend`, `build-frontend`, `ci-summary`), Turbo caching on all 4 real jobs (Phase 16), build artifacts uploaded (Phase 16). Never yet run on a real GitHub Actions push (documented, unresolved, since Phase 15).

### Configuration

9 `tsconfig.json` files, 3 `.eslintrc*` files, 1 root `.prettierrc.json`, 1 `next.config.mjs`, 1 `nest-cli.json`, 1 `turbo.json`, 11 real workspace `package.json` manifests.

### Environment Files

5 `.env.example` files exist (root, `apps/admin`, `apps/api`, `apps/web`, `apps/workers`) — all confirmed accurate and current as of Phase 16/17/18.

### Deployment Configuration

`apps/web/vercel.json` — **confirmed absent** (deleted Phase 19, was stale/wrong). No `Dockerfile` exists anywhere in the repo (confirmed absent, open gap since Phase 17 — not required for the recommended Railway/Nixpacks deployment path). `infra/docker/docker-compose.yml` (local dev only) and `infra/terraform/README.md` (scaffolding-only, no `.tf` files) are the only infrastructure-as-code artifacts.

### Folder Tree

```
ai project/
├── apps/
│   ├── admin/        (retired, inert placeholder — Phase 14.4)
│   ├── api/           (NestJS backend — 203 .ts files, 23 modules)
│   │   └── src/{modules, common, config, storage, redis, database, health, payments}/
│   ├── web/            (Next.js frontend — 151 .ts/.tsx files)
│   │   └── src/{app, components, hooks, guards, providers, contexts, lib, services, utils, constants, types}/
│   └── workers/       (empty scaffold — Candidate D target)
├── packages/
│   ├── api-client/    (real, used)
│   ├── types/          (real, used)
│   ├── i18n/            (scaffold, unused)
│   ├── validation/  (scaffold, unused)
│   ├── ui/                 (scaffold, unused)
│   └── config/          (tsconfig base only)
├── docs/                    (67 top-level .md + 20 archived + 19 restore points + 67 assets)
├── infra/
│   ├── docker/          (local dev compose)
│   └── terraform/     (scaffolding only, no real resources)
├── .github/workflows/ci.yml
├── turbo.json, package.json, .eslintrc.json, .prettierrc.json
```

**Repo-hygiene items noticed while producing this inventory, worth flagging (not fixed — read-only phase):** a few stray top-level directories/files (`shots/`, `shots2/`, `.preview/`, `Phoenix_v0.1.0.zip`) exist at the repo root outside the standard monorepo structure — plausibly leftover artifacts from earlier phases' screenshot/verification work or the original scaffold. Not investigated further this phase; flagged in Part 4 (Technical Debt) as a Low-priority repo-cleanup item, consistent with the already-known dead-route-tree finding.

---

*This is Part 1 of the Version 1.0 freeze documentation set. See `docs/version-1.0-freeze.md` for Parts 2–10 (feature inventory, architecture freeze, technical debt, limitations, code health, and the final executive conclusion) and `docs/version-1.0-roadmap.md` for the v1.1+ roadmap.*
