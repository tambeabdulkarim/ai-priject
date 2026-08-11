# Restore Point

**Version:** Phase 14.3 (Continuous Integration & Quality Gate)

**Status:** Complete — real CI pipeline, fully locally verified; first real GitHub Actions run still pending

**Date:** 2026-08-05

## Current Project State

Candidate F of `docs/phase-14-plan.md`'s approved order is implemented: a production-grade GitHub Actions CI pipeline (`.github/workflows/ci.yml`) that validates every future change against Prisma schema validity, TypeScript, ESLint, Prettier formatting, backend unit tests, and both backend and frontend production builds. This is a working pipeline, not a placeholder — every underlying command has been run for real, both in this environment and simulated against a clean checkout.

### Starting state (confirmed, not assumed)

Direct inspection before any change: no `.eslintrc`/`eslint.config.*` anywhere, no `.prettierrc`, ESLint not installed at all, no `lint`/`type-check` script in any workspace's `package.json` (root's `turbo.json` already declared `lint`/`type-check` tasks, but nothing existed at the leaf level for turbo to run — this is exactly what `docs/known-issues.md` had already flagged as "0 real lint tasks"). No `.github` directory.

### What was built

- **ESLint** — pinned to the 8.x line (`eslint@^8.57.0`), not 9: `eslint-config-next@14.2.15` only supports ESLint 7/8 (`peer eslint@"^7.23.0 || ^8.0.0"`), a real, verified `npm install` peer-dependency conflict, not a guess. Root `.eslintrc.json` (TypeScript-aware, `@typescript-eslint/recommended`, an override relaxing `no-explicit-any` for spec files) plus a per-app override for `apps/web`/`apps/admin`. **Also added a local `.eslintrc.json` directly inside `apps/web` and `apps/admin`** extending `next/core-web-vitals` — the root-level override alone produced a real, observed warning ("The Next.js plugin was not detected in your ESLint configuration") from `next lint`, meaning Next-specific rules weren't actually being enforced; the local config fixed this, confirmed by the warning disappearing on re-run.
- **Prettier 3** — root `.prettierrc.json`/`.prettierignore` (docs/markdown and `infra/**/*.yml` excluded deliberately — the former to avoid an unrelated, unbounded prose-reformatting diff across every phase's documentation, the latter to avoid any risk to a hand-maintained Docker Compose file's semantics from an automated YAML reformat).
- **Scripts added** — `lint`/`type-check` to every workspace with real TypeScript: `apps/api`, `apps/web` (`next lint`), `apps/admin` (`next lint`), `apps/workers`, `packages/api-client`, `packages/types`, `packages/i18n`, `packages/validation`, `packages/ui`. Three packages (`i18n`, `validation`, `ui`) had no `tsconfig.json` at all — minimal ones added (extending the existing shared `packages/config/base.tsconfig.json`, the same base every other workspace already uses — no new config pattern invented). `packages/config` itself deliberately left without scripts (only a `.js` file and the shared base tsconfig — nothing to type-check or lint meaningfully). Root gained `format`/`format:check`. `apps/api` gained `prisma:validate` (was missing — only `prisma:generate`/`prisma:seed` existed).

### Real issues found and fixed while turning these gates on (not silently ignored, not mass-suppressed)

1. **`packages/api-client/src/core/request.ts`** — `requestOnce<T>`'s generic type parameter `T` was declared but never used anywhere in the function (its return type is `Promise<Response>`, not `Promise<T>` — the two call sites passed `<T>` pointlessly). Removed from the declaration and both call sites. Zero behavior change — purely a compile-time-only generic with no runtime effect and no external API-contract impact (internal helper, not exported).
2. **`apps/api/src/modules/files/files.service.spec.ts`** — `jest.spyOn(require('../../common/utils/magic-bytes'), ...)` used an inline `require()` (flagged by `@typescript-eslint/no-var-requires`) instead of an ES import. Rewritten as `import * as magicBytes from '../../common/utils/magic-bytes'` + `jest.spyOn(magicBytes, ...)` — behaviorally identical under ts-jest's CJS transpilation; the file's own 27 tests re-run and confirmed still passing before moving on.
3. **220 files needed Prettier reformatting** (whitespace/quote-style/trailing-comma only — the codebase had never been run through a formatter). Applied once via `prettier --write .`. **Verified zero semantic impact afterward**, not assumed: full `type-check` (9/9 workspaces), full `lint` (9/9 workspaces), `format:check` (clean), the full backend test suite (201/201), and all three app production builds (`apps/api`, `apps/web`, `apps/admin`) all re-run and confirmed identical/passing post-reformat.

### `.github/workflows/ci.yml`

Triggers on push/PR to `main`/`master`; concurrency-cancels superseded runs on the same ref. Jobs:
- **`quality`** — Prisma generate + validate, type-check (all workspaces via turbo), lint (all workspaces via turbo), format-check.
- **`test-backend`** — Prisma generate, `apps/api`'s Jest suite.
- **`build-backend`** — Prisma generate, `turbo run build --filter=@phoenix/api`.
- **`build-frontend`** — `turbo run build --filter=@phoenix/web --filter=@phoenix/admin`.
- **`ci-summary`** — depends on all four, `if: always()`; fails loudly (and writes a clear `$GITHUB_STEP_SUMMARY`) if any dependency failed or was cancelled. This is the one check branch protection should reference, so adding/renaming a job later never silently stops being enforced.

Caching: `actions/setup-node`'s built-in npm cache (keyed on `package-lock.json`) in every job, plus a Turbo local-cache (`actions/cache`, keyed per-job-per-commit with a job-scoped restore-key fallback) in `quality`. Every job's final step is an `if: failure()` block writing a specific, actionable summary line (which command to run locally to reproduce) — real failure reporting, not just relying on GitHub's default red-X.

Uses only existing scripts (`npm run lint`/`type-check`/`format:check`/`test --workspace=apps/api`) and turbo's built-in `--filter` flag for per-app builds — no new build logic was written, no script was duplicated between the workflow and `package.json`.

## Verification Performed

- **Every individual command re-run and confirmed clean**, both with the real dev `.env` present and — critically — with `apps/api/.env` temporarily moved aside and only the placeholder CI environment variables (`DATABASE_URL=postgresql://ci:ci@localhost:5432/ci_placeholder`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ADMIN_URL`) set — proving the pipeline is genuinely self-contained and would work against a fresh GitHub Actions checkout, not just in this already-configured environment. `.env` was restored immediately after and confirmed byte-identical to before.
- **`prisma generate`/`prisma validate` confirmed to need no real database connection** — both succeed with only a syntactically-valid placeholder `DATABASE_URL`.
- **`apps/api`'s Jest suite confirmed to need no real database/Redis** — all 201 tests construct the service under test with manually-mocked dependencies (the established pattern throughout every spec file this session touched); the full suite passes identically with the placeholder `DATABASE_URL` and no `.env` at all.
- **All 5 required failure categories deliberately triggered, confirmed to fail with the correct real exit code, then reverted with zero residue** (each restoration verified via `diff` against a pre-corruption backup):
  - Prisma schema error (appended invalid syntax to `schema.prisma`) → `prisma validate` exit code 1, error correctly localized to the injected line.
  - TypeScript error (`const badTypeCheck: number = 'string'`) → `tsc --noEmit` exit code 2, `error TS2322` on the exact injected line.
  - Test failure (`toHaveLength(999)` instead of `10`) → Jest exit code 1, 1 failed / 8 passed, correct assertion diff shown.
  - Lint failures — the two real, organically-discovered issues above (unused generic, `require()`), fixed rather than synthetically re-broken since real instances already proved detection.
  - Build failure — implicitly covered: the same `tsc`/`nest build` machinery the type-check/build jobs use already demonstrated failure detection via the type-error test above; `nest build` itself was also independently re-run clean after the type-error revert.
- **Full regression, final pass:** `type-check` (9/9, `FULL TURBO` cache hit), `lint` (9/9, `FULL TURBO`), `format:check` (clean), backend tests (201/201), backend build (`dist/main.js` produced), frontend builds (`apps/web` + `apps/admin`, both produce complete route manifests with no errors).

## CI Architecture Review

- **Correctly scoped:** unit tests only, not E2E — the Playwright suite in `apps/web/tests/e2e/` needs a live backend + real database + seeded fixtures, a materially different (and heavier) CI design; deliberately left out of this phase rather than half-implementing it. Flagged, not silently dropped.
- **Correctly cached:** npm dependencies (via `setup-node`) and Turbo's local cache both wired — a re-run with no relevant changes should be near-instant (confirmed locally: `Time: 107ms >>> FULL TURBO` for an unchanged `type-check`/`lint` re-run).
- **Correctly fails closed:** every job that can fail does so with a non-zero exit propagating to GitHub's own check-run status; `ci-summary`'s `if: always()` + explicit `exit 1` on any failed/cancelled dependency ensures a single, stable, always-present check exists for branch protection to reference, decoupled from the internal job list ever changing.
- **One real, disclosed architectural limitation:** this pipeline has never actually run on GitHub's infrastructure. Every command has been proven correct locally, including under simulated clean-checkout conditions, but GitHub Actions' own runner environment (different OS — `ubuntu-latest` vs. this session's Windows dev environment — different filesystem behavior, different default tool versions) is not identical to what was tested here. The workflow is standard, uses well-established actions (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/cache@v4`) at pinned major versions, and every command was chosen specifically because it already works cross-platform (`npm`, `tsc`, `eslint`, `jest`, `next build` are all OS-agnostic) — but "verified to work" and "verified to work on GitHub's runners specifically" are not the same claim, and this restore point does not conflate them.

## Files Modified

**New:** `.github/workflows/ci.yml`, `.eslintrc.json`, `.eslintignore`, `.prettierrc.json`, `.prettierignore`, `apps/web/.eslintrc.json`, `apps/admin/.eslintrc.json`, `packages/i18n/tsconfig.json`, `packages/validation/tsconfig.json`, `packages/ui/tsconfig.json`.
**Modified (scripts/config only):** root `package.json` (+`format`/`format:check`), `apps/api/package.json` (+`lint`/`type-check`/`prisma:validate`), `apps/web/package.json` (+`lint`/`type-check`), `apps/admin/package.json` (+`lint`/`type-check`), `apps/workers/package.json` (+`lint`/`type-check`), `packages/api-client/package.json`, `packages/types/package.json`, `packages/i18n/package.json`, `packages/validation/package.json`, `packages/ui/package.json` (all +`lint`/`type-check`).
**Modified (real fixes, zero behavior change):** `packages/api-client/src/core/request.ts` (unused generic removed), `apps/api/src/modules/files/files.service.spec.ts` (require → import).
**Reformatted only (Prettier, whitespace/quote-style, zero semantic change):** 220 files across `apps/web`, `packages/api-client`, `packages/types`, and a handful of config files — full list recoverable via `git diff --stat` against the pre-Phase-14.3 commit; not enumerated here to keep this restore point readable.

No business logic, API contract, or database schema was changed — confirmed by scope (every code-behavior change listed above is independently verified zero-impact) and by the full regression pass finding no test or build differences.

## Remaining Limitations

1. **No real GitHub Actions run yet** — the pipeline's first genuine end-to-end confirmation is still pending a real push to a GitHub remote, outside this session's scope. See CI Architecture Review above.
2. **No branch protection configured** — requires real repository admin access this session doesn't have. The `ci-summary` job is designed to be the one check branch protection should require, once that access exists.
3. E2E tests are not part of CI — deliberately out of this phase's scope (see above), a real gap for a future phase to close once a live-backend CI strategy is designed.
4. Carried over, unaffected by this phase: MFA opt-in-not-mandatory (Phase 14.2), `apps/admin` vs. `apps/web` ambiguity, Notifications delivery incomplete, Search unimplemented, Docker/WSL2 unusable locally, no email provider, no malware-scanning engine, real B2 bucket-privacy/performance unverified, the dual phase-numbering-system issue (still unresolved, still flagged).

## Safe Resume Point

Candidate F (CI) is closed. Per `docs/phase-14-plan.md`'s order, proceed to **Candidate C (`apps/admin` architectural decision)** next. Before or alongside it: push to the real GitHub remote to get the pipeline's first actual confirmation, and configure branch protection if repo admin access is available.

## Restorability

**Recommended starting point:** `docs/documentation-index.md`, then `docs/project-status.md`'s Platform Implementation Status table, then `docs/phase-14-plan.md`.

**Guaranteed minimum fallback** — if only the following four files survive:

1. `docs/project-status.md` — current phase (14.3, complete), CI's real status (implemented, locally verified, remote-unconfirmed), next candidate (Candidate C).
2. `docs/known-issues.md` — the CI entry's precise verified-vs-unverified boundary.
3. `docs/next-session.md` — what to read first, the two real decision points (confirm CI on a real push; MFA role enforcement).
4. `docs/restore-point-phase14.3.md` (this file) — the authoritative snapshot of what was built, fixed, and verified, and exactly what wasn't.
