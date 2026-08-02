# 18 — Project Governance

Status: Final governance document. Architecture Phase (docs 00–17) is complete. This document is binding on every engineer, every pull request, and every release from the start of implementation onward — it is the rulebook `09`–`17` are built to be executed under. Where any future decision conflicts with this document, this document governs unless formally amended (see §18, Change Management).

---

## 1. Engineering Principles

- **Specification before code.** No feature is implemented without a corresponding, approved specification in the `docs/00–17` set (or a formal amendment to one). Implementation that deviates from its spec is a bug, not a judgment call, until the spec is updated.
- **Boring technology, proven patterns.** Per `09-PLATFORM-ARCHITECTURE.md`'s cross-cutting principle — the platform scales by adding replicas, caching, and service-splitting as real bottlenecks appear, not by speculative complexity introduced ahead of need.
- **Security and data integrity are never negotiable for velocity.** A deadline is never a justification for skipping a control defined in `10-SECURITY-BIBLE.md` or `11-DATABASE-BIBLE.md` — the correct response to schedule pressure is to reduce scope, not reduce rigor.
- **Explicit over implicit, everywhere.** Naming, contracts, error handling, and authorization checks are written to be understood without tribal knowledge — the same principle `11-DATABASE-BIBLE.md` §1 applies to schema design applies to all code.
- **Every engineer owns quality, not just their own module.** Code review, testing, and documentation are shared responsibilities — "not my code" is never a reason to wave through a defect.

---

## 2. Coding Standards

- **Language and typing:** TypeScript in strict mode across every app and package; `any` is prohibited except in narrowly justified, commented exceptions reviewed at PR time.
- **Naming:** Mirrors the database conventions in `11-DATABASE-BIBLE.md` §2 wherever code represents a domain concept — `snake_case` at the API/data boundary (matching `16-API-CONTRACT.md`), `camelCase` in application-layer TypeScript, consistent and never mixed within a single layer.
- **Formatting and linting** are automated and non-negotiable — a formatter and linter run in CI and block merge on failure; formatting is never a subject of code-review debate because it is not a matter of opinion once configured.
- **File and module organization** follows the layered structure in `09-PLATFORM-ARCHITECTURE.md` §3 (primitives never import features; features never import each other directly) — violations are treated as architecture bugs, not style preferences.
- **No dead code.** Unused exports, commented-out blocks, and unreferenced files are removed at the time they become unused, not left "in case they're needed later" — version control is the record of what existed before, not the working tree.
- **Comments explain why, not what.** A comment restating what the next line of code obviously does is removed in review; a comment is warranted only for non-obvious rationale, a workaround, or a constraint that isn't visible from the code itself.

---

## 3. Git Workflow

- **Trunk-based development against `main`**, with short-lived feature branches — branches are expected to merge within days, not weeks; long-lived branches are a signal the work should have been split into smaller increments.
- **Commit messages** state intent and reasoning ("why"), not a restatement of the diff — consistent with the codebase's own comment philosophy (§2).
- **No direct commits to `main`.** Every change reaches `main` through a reviewed, CI-passing pull request, without exception — including hotfixes (§11).
- **History stays linear where practical** (rebase feature branches onto `main` before merge) so `git log`/`git blame` remain a reliable, readable record for future debugging.
- **Secrets, credentials, and `.env` files are never committed** (`10-SECURITY-BIBLE.md` §17) — a pre-commit hook and CI secret-scanning step both enforce this independently, so a single missed control doesn't let a secret through.

---

## 4. Branch Strategy

- `main` — always deployable, protected, reflects the current production-track state.
- `staging` — tracks `main` post-merge, deployed automatically to the staging environment (`09-PLATFORM-ARCHITECTURE.md` §21) for pre-release verification.
- `feature/<short-description>` — one branch per unit of work, branched from `main`, merged back via pull request.
- `fix/<short-description>` — same model as `feature/`, used for bug fixes to distinguish intent in branch listings and release notes.
- `hotfix/<short-description>` — branched from `main` for production-impacting fixes requiring expedited review (§11); merged to `main` and immediately deployed, then back-merged into any active long-running branch.
- No engineer works directly on `main` or `staging` locally for anything other than pulling latest — all work happens on a named branch.

---

## 5. Pull Request Rules

- Every PR is scoped to a single logical change — a PR that mixes an unrelated refactor with a feature is split before review, not reviewed as-is.
- Every PR description states: what changed, why, and how it was verified (tests run, manual verification steps) — a PR with no description beyond a linked ticket number is returned for elaboration.
- Every PR that touches an endpoint, table, or workflow defined in `13`–`16` links back to the relevant specification section — reviewers verify against the spec, not against the author's stated intent alone.
- CI must be fully green (lint, type-check, tests, build) before a PR is eligible for human review — reviewer time is not spent on issues automation already catches.
- At least one approval from an engineer other than the author is required to merge; changes to `10-SECURITY-BIBLE.md`-governed surfaces (auth, payments, admin, PII handling) require an approval from a designated security-aware reviewer specifically, per §9.
- The author merges their own approved PR (once CI is green and approvals are in) — reviewers approve, they do not merge on the author's behalf, keeping merge timing under the author's control.

---

## 6. Code Review Checklist

Every reviewer confirms, for every PR:

- [ ] Matches its governing specification (`09`–`17`) or includes the corresponding spec update
- [ ] No unauthenticated/unauthorized access path introduced or widened without justification
- [ ] Input validation present at every new API boundary (`10-SECURITY-BIBLE.md` §11, §13)
- [ ] No raw SQL, no `dangerouslySetInnerHTML` without sanitization review, no new secret in source
- [ ] Database changes follow the migration strategy in `11-DATABASE-BIBLE.md` §10 (additive-first)
- [ ] Tests added or updated for the change, covering the primary failure path as well as the happy path
- [ ] No dead code, no leftover debug statements, no unresolved TODO without a linked follow-up
- [ ] Naming and structure consistent with §2 of this document
- [ ] Audit logging present for any action meeting the significance bar in `10-SECURITY-BIBLE.md` §18
- [ ] No unnecessary new dependency introduced without a stated reason and a license/vulnerability check

---

## 7. Testing Requirements

- **Unit tests** cover business logic in isolation (validation rules, scoring logic, pricing calculations) — required for any new non-trivial function, written alongside the implementation, not deferred to `17-IMPLEMENTATION-ROADMAP.md`'s Phase 12 hardening pass.
- **Integration tests** cover each API endpoint against a real (test) database instance, verifying the documented contract in `16-API-CONTRACT.md` — status codes, response shape, validation errors, authorization enforcement.
- **End-to-end tests** cover the critical-path workflows defined in `15-SYSTEM-WORKFLOWS.md` (registration through purchase through content delivery) and are run in CI against a staging-like environment before any production deploy.
- **Security-specific tests** verify the negative case explicitly for every access-controlled resource — an object-level authorization check is not considered tested until a test confirms a non-owner is actually rejected, not just that an owner is accepted.
- **Coverage is a signal, not a target to game** — a numeric coverage threshold is enforced as a floor (agreed per `apps/` package) to catch untested modules, but a reviewer's judgment on whether the *right* things are tested always outweighs a coverage percentage.
- **Flaky tests are treated as bugs**, fixed or removed promptly — a flaky test that's routinely re-run until green trains the team to ignore CI failures, which is more dangerous than having no test at all.

---

## 8. Documentation Rules

- The `docs/00–17` set is the authoritative source of truth for architecture, security, data model, workflows, API contract, and process — code comments and README files supplement it, they never contradict it.
- Any implementation decision that deviates from an existing doc requires that doc to be updated in the same PR (or an immediately following one, explicitly linked) — documentation drift is treated with the same severity as a failing test.
- New capability that isn't yet covered by any existing doc (a genuinely new domain, workflow, or API group) gets a proportionate documentation addition before or alongside implementation, following the shape of the existing equivalent document (e.g., a new domain's tables follow `13-DATABASE-BLUEPRINT.md`'s per-table format).
- User-facing and operator-facing documentation (help content, runbooks) is a distinct concern from this engineering documentation set and is tracked separately, but any operational runbook referenced by this governance document (e.g., incident response, §14) must exist and be kept current before the relevant capability goes to production.
- Documentation changes go through the same pull request and review process as code — no direct edits to `docs/` outside a reviewed PR.

---

## 9. Security Review Process

- Every PR touching authentication, authorization, payments, PII handling, file upload, or the admin surface requires review from a designated security-aware reviewer, in addition to standard code review (§5) — this is a gate, not a suggestion.
- The `10-SECURITY-BIBLE.md` §23 checklist is applied at two points: per-feature (by the implementing engineer, before requesting review) and again at each phase boundary in `17-IMPLEMENTATION-ROADMAP.md` (by the security reviewer, across the whole phase's surface area).
- New third-party dependencies are checked against known-vulnerability databases before being introduced (`10-SECURITY-BIBLE.md` §18); dependency updates are reviewed for changelog/breaking-change risk, not merged blindly by automation alone for anything touching a security-sensitive module.
- Any discovered vulnerability — whether from internal review, automated scanning, or external report — is triaged within 24 hours and follows the Incident Response process (§14) if it affects a deployed environment.
- Security review is a required Definition of Done criterion (§17) for every phase in `17-IMPLEMENTATION-ROADMAP.md`, not an optional final pass.

---

## 10. Performance Standards

- Every new API endpoint is expected to meet the platform's baseline latency target (p95 under a defined threshold, per `17-IMPLEMENTATION-ROADMAP.md` Phase 13's performance budgets) under realistic data volume in staging before shipping — not assumed acceptable from small local datasets.
- N+1 query patterns are treated as review-blocking defects (`11-DATABASE-BIBLE.md` §11), caught at code-review time via the checklist (§6), not discovered post-launch via a slow-query alert.
- Frontend changes are evaluated against the Core Web Vitals budgets established for the Homepage (`docs/00–08`) and extended to every new page — a regression here blocks merge the same as a failing test.
- Any new query, index, or caching decision follows the strategy in `11-DATABASE-BIBLE.md` §11–12 — caching is applied deliberately to identified hot paths, not speculatively everywhere, and never as a substitute for fixing an actually-slow query.
- Load testing against projected traffic is required before any change expected to materially increase read/write volume on a shared resource (a new high-traffic feature, a bulk-import capability) goes to production.

---

## 11. Release Process

- Releases follow the environment progression in `09-PLATFORM-ARCHITECTURE.md` §21 — local → staging → production — with no environment skipped, including for hotfixes.
- Standard releases are deployed on a regular cadence (per `17-IMPLEMENTATION-ROADMAP.md`'s Release Strategy) via the CI/CD pipeline; there is no manual production deployment path outside that pipeline.
- **Hotfix path:** a production-impacting defect is branched from `main` (`fix/hotfix-<description>`, §4), receives an expedited but still-real review (a single qualified reviewer, not zero reviewers), passes the full CI suite, and deploys through the same pipeline — "hotfix" shortens the review and merge timeline, it never skips CI, testing, or the security review trigger in §9 if applicable.
- Every release is preceded by a green CI run against `staging` matching what will be deployed to production — no release is promoted on the basis of a passing run against a different commit.
- Post-release verification (smoke test of critical paths, monitoring dashboard check) is a required step immediately following every production deploy, not an optional follow-up.

---

## 12. Versioning Policy

- Follows `17-IMPLEMENTATION-ROADMAP.md`'s Versioning Strategy: semantic versioning (`MAJOR.MINOR.PATCH`) at the platform release level, coordinated with but distinct from the API's own versioning defined in `16-API-CONTRACT.md`.
- `MAJOR` version increments correspond to breaking changes at the platform or API contract level, requiring the deprecation-window process in `16-API-CONTRACT.md`'s Versioning Strategy.
- `MINOR` increments correspond to net-new, backward-compatible capability (a new feature, a new API endpoint group).
- `PATCH` increments correspond to bug fixes and non-functional changes with no contract impact.
- Every deployed artifact carries its version as an immutable tag, and that tag — not a branch name or commit hash alone — is the unit referenced by release notes, rollback tooling, and incident records.

---

## 13. Bug Severity Levels

| Severity | Definition | Response expectation |
|---|---|---|
| **Critical (S1)** | Production outage, data loss/corruption risk, security breach, or payment-processing failure affecting real users | Immediate response, Incident Response process (§14) invoked, hotfix path (§11) used |
| **High (S2)** | Major feature broken or significantly degraded for a substantial user segment, no safe workaround | Response within the current working day, prioritized ahead of new feature work |
| **Medium (S3)** | Feature partially broken or degraded with a viable workaround, affects a limited user segment | Scheduled into the current or next sprint, not immediately interrupting other work |
| **Low (S4)** | Cosmetic issue, minor inconsistency, edge-case behavior with negligible user impact | Backlogged, addressed opportunistically or in a dedicated cleanup pass |

Severity is assigned at triage by whoever identifies the bug, confirmed or adjusted by the responsible engineering lead — severity determines response urgency, not who is allowed to fix it.

---

## 14. Incident Response

- Follows the five-stage process defined in `10-SECURITY-BIBLE.md` §19: **Detect → Contain → Eradicate → Recover → Post-mortem**, applied to any Critical (S1) bug per §13, not exclusively security incidents.
- An on-call rotation owns initial triage for production alerts once the platform is live, per `09-PLATFORM-ARCHITECTURE.md` §19.
- Containment actions (credential rotation, session revocation, feature-flag disablement, traffic rollback) are taken immediately on reasonable suspicion — the team does not wait for full root-cause certainty before limiting damage, consistent with `10-SECURITY-BIBLE.md` §19.
- Every S1 incident receives a written, blameless post-mortem — what happened, why, what's changing so it doesn't recur — published internally within a defined window (5 business days) of resolution.
- Incidents involving actual or suspected user data exposure additionally trigger the data-breach notification process in `10-SECURITY-BIBLE.md` §19, with legal/compliance engaged immediately, in parallel with technical remediation, not after it.

---

## 15. Technical Debt Policy

- Technical debt is tracked explicitly — a deliberate shortcut taken under time pressure is recorded (linked issue, brief rationale) at the time it's taken, not left as an undocumented landmine for a future engineer to discover.
- Debt is triaged with the same severity framing as bugs (§13) where it carries risk (a known-fragile area near a security or financial boundary is never "low priority" debt regardless of how long it's been stable) — otherwise scheduled opportunistically.
- A recurring allocation of engineering time (a defined percentage of each sprint/cycle, set by engineering leadership) is reserved for debt paydown — debt is not expected to be addressed only "when there's time," because there is reliably never leftover time without a deliberate allocation.
- Debt introduced to hit a specific roadmap milestone (`17-IMPLEMENTATION-ROADMAP.md`) is explicitly called out at that phase's completion review, not silently absorbed into "done."
- Debt affecting a `10-SECURITY-BIBLE.md`-governed surface is never acceptable as a long-term state — it is either resolved before the affected feature reaches production, or the feature's launch is delayed, full stop.

---

## 16. Definition of Ready

A task/story is ready to be picked up for implementation only when:

- [ ] It traces to an approved specification in `docs/09–17` (or the specification amendment is included with the task)
- [ ] Acceptance criteria are explicit and testable, not left to implementer interpretation
- [ ] Dependencies (per `17-IMPLEMENTATION-ROADMAP.md`'s phase dependencies, or a specific prior task) are identified and either complete or explicitly sequenced
- [ ] Any new API endpoint, table, or workflow the task introduces is already reflected in `16-API-CONTRACT.md`, `13-DATABASE-BLUEPRINT.md`, or `15-SYSTEM-WORKFLOWS.md` respectively — or that documentation update is itself part of the ready task
- [ ] Security-sensitive tasks (per §9's trigger list) have an identified reviewer available before work starts, not discovered as a blocker at PR time

---

## 17. Definition of Done

Restates and binds `17-IMPLEMENTATION-ROADMAP.md`'s Definition of Done as the platform-wide standard for every unit of work, not only roadmap phases:

- Implementation matches its governing specification exactly, or the specification was updated first.
- Automated tests cover the happy path and the primary documented failure path (§7).
- The relevant portion of the `10-SECURITY-BIBLE.md` §23 checklist passes.
- No debug-only code, hardcoded secrets, or undocumented TODOs remain.
- Accessibility and responsive/performance standards (§10) are met, consistent with the Homepage baseline.
- Audit logging is implemented wherever `10-SECURITY-BIBLE.md` §18 or the relevant workflow's Audit Logging requirement (`15-SYSTEM-WORKFLOWS.md`) applies.
- Verified working in staging under production-like configuration.
- Relevant documentation (`docs/00–18`) is updated to match what was actually built.
- Code review (§6) is complete and approved, including security review (§9) where triggered.

---

## 18. Change Management

- Changes to this governance document, or to any of `docs/09–17`, follow the same pull-request review process as code (§5, §8) — no document in this set is edited outside a reviewed PR, including by senior engineering leadership.
- A proposed change to an approved architectural decision (a table structure, an API contract, a security control) is raised as an explicit amendment proposal, stating what's changing and why, reviewed by the same security/architecture-aware reviewers as the original decision, not silently reinterpreted during implementation.
- Emergency deviations (a genuine production incident requiring an immediate action that conflicts with standing process) are permitted under the Incident Response process (§14) but require retroactive documentation and review within the same post-mortem window — an emergency justifies acting first, it does not exempt the action from later scrutiny.
- Scope changes to `17-IMPLEMENTATION-ROADMAP.md`'s phases (adding, removing, or materially resequencing work) are reviewed against the dependency graph in that document before being accepted, to avoid silently breaking the critical path or parallelization assumptions it documents.

---

## 19. AI-Assisted Development Rules

- AI coding assistants (including agentic tools operating directly on the codebase) are permitted and expected to be used, but every rule in this document applies identically to AI-produced and human-produced code — there is no separate, lighter review standard for AI-generated changes.
- An engineer who submits AI-assisted work is responsible for it in full — understanding what it does, why it's correct, and defending it in review — the same as any other submission; "the AI wrote it" is never an acceptable answer to a review question.
- AI-assisted changes to security-sensitive surfaces (§9's trigger list) receive the same mandatory security review as any other change to those surfaces, with no exception for tool-assisted authorship.
- AI tools used within Phoenix's own product (the AI Gateway, `12-AI-INTEGRATION-BIBLE.md`) are governed by that document specifically; this section governs AI used *as a development tool* by the engineering team, a distinct concern from AI as a *platform feature*.
- Generated code that introduces a new dependency, a new architectural pattern, or deviates from `docs/09–17` is held to the same specification-first principle in §1 — an AI suggesting an approach outside the documented architecture requires the same documentation-amendment process as a human proposing the same thing, not an exception because a tool suggested it.
- Credentials, secrets, and access tokens are never provided to an AI tool as part of its working context beyond what's required for its immediate, scoped task, consistent with `10-SECURITY-BIBLE.md` §17's least-privilege principle applied to tooling as much as to human access.

---

## 20. Project Quality Gates

Hard gates that block progression regardless of schedule pressure:

- **Gate: Merge to `main`** — CI green, required approvals obtained (§5), code review checklist satisfied (§6).
- **Gate: Staging deploy** — full test suite passing against the exact commit being promoted (§11).
- **Gate: Production deploy** — staging verification complete, security checklist passed for any touched sensitive surface (§9), post-release verification plan defined before deploy, not improvised after.
- **Gate: Phase completion** (`17-IMPLEMENTATION-ROADMAP.md`) — that phase's Acceptance Criteria met in full, its portion of the Definition of Done (§17) satisfied, and any technical debt taken on during the phase explicitly logged (§15) rather than silently carried forward.
- **Gate: Public launch** (`17-IMPLEMENTATION-ROADMAP.md` Phase 14) — every prior phase gate passed, disaster-recovery restore drill executed successfully (`10-SECURITY-BIBLE.md` §21), monitoring/alerting verified live, rollback procedure rehearsed (`17-IMPLEMENTATION-ROADMAP.md` Rollback Strategy) — not merely documented, but demonstrated.

No gate is bypassed by schedule pressure, seniority, or urgency short of a declared Critical (S1) incident under the Incident Response process (§14) — and even then, the bypass is temporary, scoped to the specific containment action, and followed by full retroactive review (§18).
