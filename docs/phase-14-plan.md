# Phoenix Project — Phase 14 Engineering Plan

**Planning only.** No code, schema, migration, or other documentation file was modified to produce this plan. Read-only verification (git status, `prisma validate`, `npm run lint`, `npm run test`) was run to ground Step 1 in actual current state rather than assumption. This document is the sole artifact of this phase; it must be reviewed and approved before any implementation begins.

Skills applied throughout: `front-end-design`, `engineering-standards`, `environment-validation`.

---

## Step 1 — Technical Review

### 1.0 Naming collision (must be resolved before "Phase 14" is used again)

This repo has **two independent phase-numbering systems** in active use, and they now conflict:

1. **`docs/17-IMPLEMENTATION-ROADMAP.md`** — the original, formally approved 14-phase roadmap (Foundation → Database → Authentication → Backend API → Frontend Integration → Learning → Library → Marketplace → AI Platform → Admin Dashboard → Notifications → Testing → Performance → **Production Deployment**). In this system, **Phase 14 means "Production Deployment."**
2. **`docs/project-status.md` / `known-issues.md` / `next-session.md` / `restore-point-phase*.md`** — an informal, ad-hoc numbering that only ever tracked E2E stabilization (Phase 11) and the Media subsystem (Phase 12–13.6). This narrative never covered most of the platform.

This is the same class of problem already flagged once before in this project's history (the Phase 12 naming collision resolved in `docs/documentation-audit-report.md`). Calling the current work "Phase 14 — Core Platform Development" collides with the roadmap's own Phase 14 ("Production Deployment") while describing something else entirely. **Recommendation: do not deploy to production under the name "Phase 14."** For the remainder of this document, "Phase 14" is used only because that is the name this planning request was issued under; Step 3 proposes the numbering fix.

### 1.1 Actual current state vs. documented state — a material discrepancy

The instruction for this phase states "Phase 13 is officially Engineering Complete" and frames the prior work as the Media/storage narrative in `docs/project-status.md`. Verification shows that narrative is **real but severely incomplete** as a description of this repository. The working tree and git history (`backup/payment-stripe-refund-v1`, off `master`) contain a substantially larger, already-implemented platform that the "Phase 11–13.6" docs never mention:

| Area | Documented state (`docs/project-status.md`) | Actual state (verified this session) |
|---|---|---|
| Scope | Media system only (upload/library/course editor) | Full LMS + marketplace platform: Courses, Lessons, Modules, Quizzes, Enrollments, Progress, Certificates, Library, Products, Orders, Payments (Stripe, incl. refunds), News, Notifications, AI Gateway, Admin (analytics/moderation/audit logs), Roles/Permissions, Sessions |
| Backend tests | "30/44 E2E passing" (Phase 11.6, stale) | **22/22 unit-test suites passing, 166/166 tests passing** (this session, live run) across every module above |
| Prisma schema | Not discussed | 49 models, `prisma validate` passes cleanly |
| Admin | Not discussed | Two competing implementations: a populated route tree in `apps/web/src/app/[lang]/admin/*` (analytics, audit-logs, settings, users — permission-guarded via `@RequirePermissions` on the API side) **and** a separate `apps/admin` app that is an empty shell (`layout.tsx` + `page.tsx` only), despite a commit titled "frontend admin workspace complete (verified)" |
| Workers | Not discussed | `apps/workers` has no job processors at all; its own `package.json` `dev` script literally prints "apps/workers has no job processors yet" |
| Search | Not discussed | Meilisearch is provisioned in `infra/docker/docker-compose.yml` but **zero backend integration exists** — no search module, no indexing, no query endpoint |
| CI | Roadmap Phase 1 acceptance criterion: "GitHub Actions CI pipeline running on every PR" | **No `.github` directory exists** — no CI pipeline of any kind |
| Lint | `npm run lint` reported "0 tasks executed" | Lint is not actually wired up as a real quality gate across the workspaces |
| MFA | Roadmap Phase 10 acceptance criterion: "mandatory MFA enforced for all admin sessions" | **Explicitly not implemented** — `auth.service.ts` carries a header comment stating no TOTP secret/recovery-code storage exists in the schema, and `LoginDto.mfaCode` is accepted but intentionally never checked (self-documented, not a silent bug) |

**This is not a criticism of Phase 13.6's work** — the storage/Docker findings in that report are independently re-verified below and remain accurate. It means the four "doc preservation" files this project relies on as its source of truth (per the standing `project-phoenix-doc-preservation` memory) describe a small slice of a much larger, mostly-untracked build. Trusting `docs/project-status.md` alone before planning Phase 14 would have produced a plan blind to ~80% of the platform's actual surface area, including a live, security-relevant gap (admin routes reachable without MFA).

**Recommendation:** this discrepancy itself is the first thing that needs resolving — see Step 4.

### 1.2 Verification performed this session (read-only)

- `git status` — 87 changed/untracked paths, consistent with a large amount of uncommitted/unreconciled work sitting on top of the last `backup/*` checkpoint commits. Nothing destructive found; no action taken (verification only).
- `npx prisma validate` — **schema valid**, 49 models.
- `npm run lint` (all workspaces via turbo) — completed, but executed **0 real lint tasks** (packages have no wired lint step turbo could run). Not a code-quality signal either way — a tooling gap, noted in Step 2.
- `npm run test` (all workspaces via turbo) — only `@phoenix/api` has a test script; it ran and **passed 100%**: 22 suites, 166 tests, covering auth, courses, media, files, library, orders, payments, roles, news, certificates, progress, enrollments, products, admin/analytics, admin/moderation, settings, ai, refresh-tokens, sessions, quiz-scoring, sanitize-html, password-service. `apps/web`/`apps/admin`/`apps/workers` have no test scripts to run.
- Source scan for `TODO`/`FIXME`/`XXX`/`HACK` across `apps/api/src`, `apps/web/src`, `apps/admin/src` — **none found**. No temporary patches or workaround markers in the codebase, consistent with "Never Patch" already having been followed.
- WSL/Docker re-check — `wsl -l -v` still reports WSL is not installed; `docker ps` still returns `500 Internal Server Error` from the Docker Desktop Linux VM engine. **Unchanged from the Phase 13.6 report.** `apps/api/.env`'s `STORAGE_*` values are still the local MinIO placeholders, still unreachable for the same reason.

### 1.3 Verification against Step 1's required checklist

- **No unresolved application bugs remain:** True for the code actually exercised by the 166 passing tests and the earlier live-verified Media/Course/Moderator flows (Phase 11.7–13.6). Not true platform-wide in the sense of "fully verified" — large parts of the newer surface (payments/orders/admin/AI/notifications) have unit coverage but no equivalent live/E2E verification pass on record, the way Media got in Phase 13.4. This is a gap in verification depth, not a known defect.
- **Infrastructure blockers are correctly classified:** Confirmed. Per the `environment-validation` skill's classification rubric, the Docker/WSL2 unavailability is **Category B — Infrastructure**, not an application bug: it is independent of the code (which is proven correct wherever reachable — presigned URLs, TTLs, clean connection-refused handling, no orphan rows), requires administrator elevation and a reboot to fix, and has two documented, code-free resolution paths (fix WSL2, or point `STORAGE_*` at a hosted provider). **This classification is upheld by this review.**
- **No temporary workarounds exist:** Confirmed by the TODO/FIXME/HACK scan above — none found.
- **Media implementation is considered complete:** Confirmed at the code level (Phase 13.4/13.5/13.6 verification stands, re-confirmed by `media.service.spec.ts` and `files.service.spec.ts` passing in this session's run). Runtime storage verification remains blocked by the same infrastructure item, unchanged.
- **Documentation is synchronized:** **Not confirmed — this is the one checklist item that fails.** See 1.1. `docs/project-status.md`/`known-issues.md`/`next-session.md`/the restore-point chain are internally consistent with each other but do not reflect the actual repository. Per this phase's explicit rules, those four files are not to be touched now; Step 4 recommends the correction as the first action of actual Phase 14 work.
- **Restore point is valid:** `restore-point-phase13.6.md` is factually accurate for what it covers (Media/storage) and its "Safe Resume Point" instructions still work as written. It is simply not a restore point for the platform as a whole.
- **Phase 13 can be considered closed from an engineering perspective:** **Yes, with the classification the user's brief already states** — Media's application code is complete and correct; the remaining Storage items are Infrastructure Pending, not Application Bugs, and infrastructure-pending status does not block moving forward per the `environment-validation` skill's Recommendation Policy ("never stop project progress because of environment limitations if architecture is validated, implementation is complete, and only deployment infrastructure is missing"). That policy is satisfied here.

---

## Step 2 — Phase 14 Technical Plan

Given 1.1's findings, the realistic candidate feature set for "Phase 14" is not a blank slate — it's the set of roadmap items (`docs/17-IMPLEMENTATION-ROADMAP.md` Phases 10–13) that the code shows are genuinely incomplete, plus the documentation-sync debt from 1.1. Each candidate below is evaluated on the requested dimensions.

### Candidate A — Documentation Reconciliation (sync `docs/project-status.md` et al. to actual repo state)

- **Objective:** Replace the Media-only narrative in the four doc-preservation files with an accurate, full-platform status reflecting what's actually built and tested.
- **Business value:** Prevents every future session (human or agent) from planning against a false baseline — directly caused the naming collision and the blind-spot risk identified in 1.1.
- **Technical value:** Restores the project's own "documentation is part of the implementation" standard (`engineering-standards` §10); makes the restore-point chain trustworthy again.
- **Dependencies:** None — pure documentation, can start immediately.
- **Estimated effort:** Small (1 focused session) — the facts already exist (git log, test output, module tree); this is synthesis, not investigation.
- **Risks:** Low. Risk of *not* doing it is higher than the cost of doing it.
- **Regression risk:** None — no code touched.
- **Architecture impact:** None.
- **Required backend/frontend modules:** None.
- **Database impact:** None.
- **API impact:** None.
- **Security impact:** None directly, but it's what makes the MFA gap (below) visible to the next reader instead of buried in a code comment.
- **Testing strategy:** N/A (documentation).

### Candidate B — Admin MFA enforcement

- **Objective:** Implement TOTP-based MFA and enforce it for all sessions carrying admin-level permissions, closing the gap `auth.service.ts` already self-documents.
- **Business value:** Admin accounts (analytics, moderation, audit logs, user management, refunds) are the platform's highest-privilege surface; this is a launch-blocking control for any real deployment.
- **Technical value:** Closes a named Definition-of-Done item (`docs/17` Phase 10) and a named Security Bible requirement (`docs/10-SECURITY-BIBLE.md` §5).
- **Dependencies:** Schema change (TOTP secret + recovery codes storage — currently absent per the code comment), Auth module changes, session/permission-check integration.
- **Estimated effort:** Medium (schema migration + backend enrollment/verification endpoints + frontend enrollment UI + session-gating logic).
- **Risks:** Getting the recovery-code/lockout flow wrong locks out real admins; needs careful UX and a documented recovery procedure.
- **Regression risk:** Medium — touches the auth/session code path used by every authenticated request; needs full auth regression coverage, not just new-feature tests.
- **Architecture impact:** Additive — no existing auth contract needs to break (`LoginDto.mfaCode` already exists as a placeholder).
- **Required backend modules:** `auth`, `users`, a new MFA sub-module, `sessions`.
- **Required frontend modules:** Login flow (MFA challenge step), account-settings MFA enrollment UI, admin-app or admin-route gating.
- **Database impact:** New columns/table for TOTP secret + hashed recovery codes on `User` (additive migration).
- **API impact:** Additive — new `/auth/mfa/*` endpoints; existing `/auth/login` contract gains an already-anticipated second step.
- **Security impact:** High positive impact; this is a security-hardening feature, reviewed against `10-SECURITY-BIBLE.md` §23 before being called done, per `engineering-standards` §4.
- **Testing strategy:** Unit tests for TOTP verification/recovery-code consumption/rate-limited attempts; integration test for the full challenge-response login flow; a dedicated security review pass (no shortcuts on secret storage/hashing).

### Candidate C — `apps/admin` resolution (decide and build the real thing)

- **Objective:** Resolve the two-competing-implementations problem in 1.1: either finish `apps/admin` as its own deployable app per `docs/09-PLATFORM-ARCHITECTURE.md` §16 (independent deploy, independent access restriction), or formally retire it and declare the `apps/web/[lang]/admin/*` route tree the real admin surface — but not leave both half-built.
- **Business value:** Admin tooling is currently split across two codebases with unclear ownership; this creates real operational risk (which one do admins actually use?) and wasted future effort maintaining both.
- **Technical value:** Removes an architectural ambiguity before more admin features get built on top of whichever one nobody chose.
- **Dependencies:** A decision, not more code, is the first requirement — this is an architecture call, not a feature.
- **Estimated effort:** The decision itself: trivial. Execution: Small (if retiring `apps/admin`, delete + redirect) to Large (if building it out properly per the architecture doc's independent-deploy requirement).
- **Risks:** Building the wrong one wastes real effort; this is exactly the kind of premature-abstraction / duplicated-responsibility risk `engineering-standards` §2–3 exists to prevent.
- **Regression risk:** Low if retiring the shell; none either way for the currently-working `apps/web` admin routes.
- **Architecture impact:** Resolves a live architecture violation (two owners for one responsibility).
- **Required backend modules:** None new — `admin` module already exists and is tested.
- **Required frontend modules:** Either `apps/admin` (completed) or none (if retired in favor of `apps/web`).
- **Database impact:** None.
- **API impact:** None.
- **Security impact:** Indirect — a standalone admin app with independent access restriction is a stronger security boundary than an admin route inside the public-facing web app; this is a real trade-off to make explicitly, not by default.
- **Testing strategy:** N/A for the decision; standard frontend testing for whichever path is chosen.

### Candidate D — Notifications delivery worker

- **Objective:** Build the actual `NotificationsWorker` (queue consumer, in-app + email fan-out) that `docs/17` Phase 11 specifies. Today, `notifications` is API-only (create/list), with no evidence of async delivery or email.
- **Business value:** Every already-built domain (enrollments, orders, certificates, moderation decisions) is a dead-end for user-facing notification unless this exists — the trigger events likely need to be added too.
- **Technical value:** Completes a load-bearing piece of infrastructure other future features will assume exists.
- **Dependencies:** A queue (Redis is already provisioned in `infra/docker/docker-compose.yml`), an email provider decision (none currently configured, similar situation to the Phase 13.5 storage-provider gap), `apps/workers` needs its first real processor.
- **Estimated effort:** Medium — queue wiring + processor + at least one real event producer end-to-end + email provider integration.
- **Risks:** Same shape as the storage saga: if no email provider is actually provisioned, this becomes another "Infrastructure Pending" blocker discovered mid-phase. Recommend deciding the provider (e.g., Postmark/SES/Resend) up front, in a scoping pass, before writing code — avoids repeating the Phase 13.4→13.6 pattern of discovering the infra gap after the code is written.
- **Regression risk:** Low — additive, new consumer, doesn't change existing domain write paths beyond adding event emission.
- **Architecture impact:** Activates `apps/workers`, previously an empty shell.
- **Required backend modules:** `notifications`, a new queue-producer hook in each event-emitting domain (enrollments, orders, certificates, admin/moderation), `apps/workers`.
- **Required frontend modules:** Notification center UI (may already partially exist at `apps/web/[lang]/notifications`), preference management UI.
- **Database impact:** Possibly additive (delivery status/preferences), depends on current `Notification` model shape (not yet inspected in this planning pass — first task of implementation, not now).
- **API impact:** Additive.
- **Security impact:** Low-medium — must not leak notification content across users (authorization scoping, same pattern already established for Media's owner-scoped `GET /media/me`).
- **Testing strategy:** Unit tests for the processor's idempotency (must not double-send on redelivery), integration test for one full event → delivery chain.

### Candidate E — Search (Meilisearch integration)

- **Objective:** Wire the already-provisioned Meilisearch service into the backend — indexing for Courses/Library/Products/News at minimum, a query endpoint, frontend search UI.
- **Business value:** Discovery/browse is a core UX expectation for a catalog this size; currently no search exists at all.
- **Technical value:** Activates infrastructure that's been sitting provisioned-but-unused (same pattern as the Media/MinIO gap, just not yet load-bearing).
- **Dependencies:** Needs Docker (or a hosted Meilisearch instance) reachable to develop/test against — **this candidate inherits the exact same Docker/WSL2 infrastructure blocker as Media/Storage**, unless a hosted Meilisearch Cloud instance is used instead for local dev, mirroring the R2-instead-of-MinIO bypass already validated as a workable pattern in Phase 13.6.
- **Estimated effort:** Medium.
- **Risks:** Index/data sync drift (search index falling out of sync with Postgres on writes) if not designed with a clear re-indexing strategy from the start.
- **Regression risk:** Low — purely additive read-path feature.
- **Architecture impact:** New cross-cutting concern (every domain that should be searchable needs an indexing hook on write).
- **Required backend modules:** New `search` module; hooks into `courses`, `library`, `products`, `news`.
- **Required frontend modules:** Search UI/results page.
- **Database impact:** None directly (Meilisearch is a separate index, not Postgres).
- **API impact:** Additive — new `/search` endpoint(s).
- **Security impact:** Must respect existing visibility rules (don't index/return draft or unpublished content to unauthorized users) — same class of bug already fixed once in this project (the moderator course-visibility bug, Phase 11.7.2); worth explicitly testing for the search path too.
- **Testing strategy:** Index-write correctness, query-relevance smoke tests, and specifically an authorization test proving unpublished content never appears in results for unauthorized users.

### Candidate F — CI pipeline + real lint gate

- **Objective:** Stand up the GitHub Actions pipeline (`docs/17` Phase 1 acceptance criterion, never actually satisfied) and fix `turbo run lint` so it actually executes a lint task per package instead of silently doing nothing.
- **Business value:** Every candidate above currently ships with zero automated gate against regressions beyond whatever the author remembers to run manually — this is the platform's biggest process risk given 87 files of uncommitted/uncategorized change already observed in `git status`.
- **Technical value:** Turns "166 tests pass" from a manually-triggered fact into a guaranteed-on-every-PR fact.
- **Dependencies:** None technical; needs a decision on hosting/secrets for CI (repo already has a GitHub remote per `git status`).
- **Estimated effort:** Small–Medium.
- **Risks:** Low technical risk; the main risk is scope creep (don't try to add deployment automation here, that's Phase 14 in the *real* roadmap sense).
- **Regression risk:** None to existing code — CI config only.
- **Architecture impact:** None.
- **Required backend/frontend modules:** None — tooling only.
- **Database impact:** None.
- **API impact:** None.
- **Security impact:** Positive — enforces the existing security-relevant lint/type-check/test gates that currently rely on manual discipline.
- **Testing strategy:** Verify the pipeline itself by deliberately breaking a test/lint rule on a throwaway branch and confirming the pipeline catches it.

---

## Step 3 — Prioritization (re-evaluated from scratch, current state only)

Ignoring any prior roadmap assumption and reasoning purely from what Step 1 verified:

1. **Candidate A (Documentation Reconciliation)**
2. **Candidate B (Admin MFA)**
3. **Candidate F (CI pipeline + real lint)**
4. **Candidate C (`apps/admin` resolution)**
5. **Candidate D (Notifications worker)**
6. **Candidate E (Search)**

**This sequence explicitly differs from the implied continuation of the Media-focused narrative in `docs/project-status.md`** (which, taken at face value, would suggest the next step is more Media/Course-editor work). It also differs from a naive reading of "Phase 14 — Core Platform Development" as an invitation to start a brand-new large feature. Why this sequence is stronger:

- **A before anything else** because every other candidate's "dependencies" and "risks" analysis in Step 2 depended on Step 1's findings — findings that contradict the currently-committed docs. Building on top of undocumented ground truth is exactly the failure mode `engineering-standards` §2 ("Architecture First — determine where responsibility belongs before modifying code") and §10 ("Documentation is considered part of the implementation") exist to prevent. This is also the cheapest item on the list (no code), so sequencing it first costs almost nothing and removes risk from every item after it.
- **B before C, D, E** because MFA is a **live, disclosed security gap on an already-shipping, already-permission-gated admin surface** (`RequirePermissions` guards exist; a second factor does not). Per `engineering-standards` §4 ("Security First") and §12 ("protect the platform even if a weaker implementation is suggested"), a known privilege-escalation-adjacent gap on production-bound admin functionality outranks new-feature work or architecture cleanup that doesn't carry a security dimension. This is also directly responsive to this phase's own rule: *"verify that no unresolved architectural, security, or data-integrity issue would make implementing that task premature"* — MFA is that issue, and it specifically makes Candidate C (finishing/deploying an admin app) premature until it's closed.
- **F before C/D/E** because none of the feature work in C/D/E has been running under any automated gate so far (confirmed: no `.github`, lint executes nothing), and the project's own history (the Phase 11 rate-limiter cascade, the stale-`tsbuildinfo` cache issue recurring across at least two phases) shows this specific team/session pattern repeatedly rediscovers the same class of environment/tooling surprise late, at real cost. A CI gate is cheap insurance purchased once, ahead of the larger builds below it.
- **C before D/E** because it resolves an existing architectural ambiguity (two owners for one responsibility) before more code gets added under whichever admin surface. Per `engineering-standards` §2 and §3, this is exactly the kind of unresolved-responsibility question that should not be left to compound.
- **D and E last, in that relative order,** because both are genuinely new capability (not fixes to existing gaps), both carry real infrastructure dependencies that echo the still-open Docker/WSL2/email-provider situation (meaning either could rediscover an Option-B-style blocker), and Notifications (D) has more already-built domains waiting on it (enrollments/orders/certificates/moderation all plausibly want to notify users today) than Search (E) has urgent unmet demand, since no user-facing catalog-scale problem has been reported yet.

---

## Step 4 — Final Recommendation

**Recommend: Candidate A — Documentation Reconciliation — as the single first task of Phase 14, immediately followed by Candidate B (Admin MFA) as the first task with actual code.**

Why A is the strongest starting point on the requested optimization criteria:

- **Platform quality:** Every subsequent decision in this project (by any future session, human or agent) is only as good as the ground truth it's reasoning from. Step 1 proved that ground truth is currently wrong by a wide margin.
- **Architecture:** Resolves the Phase-14-naming collision and the `apps/admin` ambiguity's *visibility* (Candidate C still needs a decision, but that decision can't be made well while the docs still don't mention `apps/admin` exists at all).
- **Future scalability:** Cheap now, expensive later — the longer the doc/reality gap persists, the more work (payments, admin, AI, notifications, orders, certificates) accumulates undocumented, compounding the eventual reconciliation cost.
- **Lowest regression risk:** Zero — no code changes.
- **Highest long-term value:** Restores the exact "restorable from four files, no conversation-history dependency" property this project's own standing process (`project-phoenix-doc-preservation`) was built to guarantee, and which Step 1 found to currently be false for anything outside Media.

**Why not lead with B (MFA) instead**, despite it being the most security-sensitive item: MFA implementation should be scoped and estimated against an accurate picture of the current auth/session/admin architecture — and per this phase's own explicit rule, *"if an unresolved architectural, security, or data-integrity issue would make a task premature, recommend resolving it first."* Planning MFA in detail on top of docs that don't even acknowledge the admin surface's real shape (two competing apps) would risk designing it against the wrong one. A closes that gap first; B is the very next task once it does, not deferred further.

**No further roadmap change beyond Step 3's sequence is recommended.** The sequence A → B → F → C → D → E should be treated as provisional past B — re-run Step 3's reasoning once A is complete, since accurate documentation may surface additional candidates (e.g., the actual shape of `Notification`/email-provider status) not visible from this session's necessarily-partial code survey.

---

## Explicit gating check (per this phase's rules)

Before recommending Candidate A as implementable-now: no architectural, security, or data-integrity issue blocks it — it is pure documentation. **Cleared to implement immediately upon approval.**

Before Candidate B (MFA) could start: no blocking issue found beyond needing the schema design decision (TOTP secret storage, recovery-code hashing) made carefully — this is normal feature scoping, not a premature-task blocker, and can proceed once A lands.

Before Candidate C, D, or E could start: **C is gated on a decision, not a blocker.** D and E are gated on infrastructure decisions (email provider; hosted-vs-local Meilisearch) that should be made explicitly during their own scoping, the same way Phase 13.5 should have preceded Phase 13.4's storage assumption — a lesson this plan applies going forward rather than repeating.

**Stopping here per this phase's rules. Awaiting approval before any implementation begins.**
