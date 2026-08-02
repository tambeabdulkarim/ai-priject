# 17 — Implementation Roadmap

Status: Official execution plan for Phoenix. Architecture Phase (docs 00–16) is complete and approved; this document sequences the build. Assumes a team of 5–6 engineers (2–3 backend, 2 frontend, 1 full-stack/DevOps) working against the standards defined in `09-PLATFORM-ARCHITECTURE.md` through `16-API-CONTRACT.md`. Durations are calendar estimates for that team size, not effort-hours: they account for review, iteration, and realistic ramp-up, not idealized best-case throughput.

---

# Phase 1 — Project Foundation

- **Objectives:** Stand up the monorepo shell (`09-PLATFORM-ARCHITECTURE.md` §1) around the existing, frozen Homepage codebase with zero behavior change; establish shared tooling (`packages/config`, `packages/types`, `packages/validation`); wire CI (lint, type-check, build) per `09-PLATFORM-ARCHITECTURE.md` §21.
- **Deliverables:** `apps/web` (Homepage moved in as-is), empty `apps/api` skeleton, `packages/ui`/`config`/`types`/`validation` scaffolded, GitHub Actions CI pipeline running on every PR, local development environment documented and reproducible.
- **Dependencies:** None — this is the entry point of the build.
- **Estimated Complexity:** Low
- **Estimated Duration:** 2 weeks
- **Risks:** Migrating the Homepage into a monorepo introduces a build-path regression if done carelessly — mitigated by treating the move itself as a verification task (re-run the full responsive/visual QA already established for the frozen Homepage after the move, before touching anything else).
- **Acceptance Criteria:** Homepage builds and renders identically pre- and post-move; CI passes on a trivial PR; a new engineer can clone and run the full monorepo locally from the documented steps alone.

---

# Phase 2 — Database

- **Objectives:** Implement the schema defined in `13-DATABASE-BLUEPRINT.md` and `14-DATABASE-RELATIONSHIPS.md` as versioned migrations, following the creation order in `14-DATABASE-RELATIONSHIPS.md` Part 5.
- **Deliverables:** All 49 tables created across their domain schemas with constraints, indexes, and audit fields per `11-DATABASE-BIBLE.md`; seed data for `Roles`, `Permissions`, `Languages`, `AI_Providers`; a working local/staging database matching the blueprint exactly.
- **Dependencies:** Phase 1 (monorepo, tooling).
- **Estimated Complexity:** Medium
- **Estimated Duration:** 2 weeks
- **Risks:** Schema drift from the approved blueprint during implementation — mitigated by treating `13-DATABASE-BLUEPRINT.md`/`14-DATABASE-RELATIONSHIPS.md` as the reviewed source of truth; any deviation discovered during implementation is a documentation update first, code second, not the reverse.
- **Acceptance Criteria:** Every table, relationship, cascade behavior, and index in `14-DATABASE-RELATIONSHIPS.md` Part 1 is present and verified against a schema-diff review; migrations run cleanly from empty on a fresh environment; restore-drill dry run (`11-DATABASE-BIBLE.md` §13) succeeds against this initial schema.

---

# Phase 3 — Authentication

- **Objectives:** Implement the full identity system per `10-SECURITY-BIBLE.md` and Workflows 1–7 (`15-SYSTEM-WORKFLOWS.md`) — registration, verification, login, refresh/rotation, logout, password reset, profile update, RBAC enforcement.
- **Deliverables:** All Authentication and Users/Profiles API endpoints from `16-API-CONTRACT.md` §1–3 implemented and passing their documented validation/security/rate-limit behavior; MFA (TOTP) support; session/refresh-token management; the shared authorization middleware other modules will depend on.
- **Dependencies:** Phase 2 (Users, Roles, Permissions, Sessions, Refresh_Tokens tables must exist).
- **Estimated Complexity:** High
- **Estimated Duration:** 3 weeks
- **Risks:** Security-critical surface area with the highest cost-of-bug in the platform — mitigated by a dedicated security review pass (checklist in `10-SECURITY-BIBLE.md` §23) before this phase is considered done, not deferred to the general Phase 12 testing pass.
- **Acceptance Criteria:** Every Authentication workflow in `15-SYSTEM-WORKFLOWS.md` §1–7 is demonstrably working end to end; the `10-SECURITY-BIBLE.md` §23 checklist passes in full; refresh-token rotation and reuse-detection verified under simulated theft; every relevant Authentication endpoint in `16-API-CONTRACT.md` §1 matches its documented contract exactly.

---

# Phase 4 — Backend API

- **Objectives:** Implement the core domain modules of `apps/api` not already covered by Authentication — Courses, Library, Marketplace, News, Files, Notifications, AI Gateway skeleton, Administration — as functioning REST endpoints per `16-API-CONTRACT.md` §4–19, backed by the Phase 2 schema.
- **Deliverables:** All remaining API groups implemented, each endpoint matching its documented request/response contract, validation, authorization, and rate-limit rules; the shared AI Gateway abstraction (`12-AI-INTEGRATION-BIBLE.md` §2) stood up with at least one provider adapter, even before AI-specific features (Phase 9) are built on top of it.
- **Dependencies:** Phase 2 (schema), Phase 3 (authorization middleware, session context available to every endpoint).
- **Estimated Complexity:** High
- **Estimated Duration:** 6 weeks
- **Risks:** The largest single phase by scope — highest risk of scope creep or underestimation; mitigated by strict adherence to `16-API-CONTRACT.md` as a closed specification (no endpoint is added or reshaped mid-phase without a documentation update first) and by building domain-by-domain in the order recommended in Part "Recommended Development Order" below, rather than all domains in parallel with a small team.
- **Acceptance Criteria:** Every endpoint in `16-API-CONTRACT.md` §4–19 is implemented and contract-verified (request/response shape, status codes, rate limits); every Workflow in `15-SYSTEM-WORKFLOWS.md` touching these domains (8–21, excluding the AI-response-quality and frontend-specific aspects) is functionally complete at the API layer.

---

# Phase 5 — Frontend Integration

- **Objectives:** Connect `apps/web` to the now-functioning backend — replace any remaining static/mock Homepage-era data with live API calls where the Homepage design calls for dynamic content, and build out the authenticated application shell (dashboard, profile, enrollment views) using `packages/api-client` and the state-management patterns from `09-PLATFORM-ARCHITECTURE.md` §8.
- **Deliverables:** `packages/api-client` generated/maintained against the Phase 4 API surface; authenticated route groups (`(app)` per `09-PLATFORM-ARCHITECTURE.md` §2) functional for login-gated flows; TanStack Query integration for server state; React Hook Form + shared zod schemas wired to real endpoints.
- **Dependencies:** Phase 3 (Auth endpoints), Phase 4 (domain endpoints) — can begin against Phase 3's output while Phase 4 is still in progress for auth-only flows, then expand as each Phase 4 domain lands (see Parallel Tasks).
- **Estimated Complexity:** Medium
- **Estimated Duration:** 4 weeks
- **Risks:** Frontend/backend contract drift if `apps/web` is built against an assumed shape rather than the actual `16-API-CONTRACT.md` spec — mitigated by `packages/api-client` being the single, typed integration point, making a contract mismatch a compile-time error, not a runtime surprise.
- **Acceptance Criteria:** A user can complete registration → login → browse catalog → view profile entirely through `apps/web` against the real backend, with the frozen Homepage's visual/UX standard (`docs/00–08`) maintained for every newly built authenticated screen.

---

# Phase 6 — Learning System

- **Objectives:** Complete the full course experience — authoring (instructor-facing), enrollment, lesson consumption, progress tracking, quizzes, and certificate issuance — per `15-SYSTEM-WORKFLOWS.md` §8–11 and the Learning API group.
- **Deliverables:** Instructor course-authoring UI, learner course-consumption UI (video playback, progress tracking, quiz-taking), certificate generation pipeline (async PDF rendering, public verification page) fully working end to end.
- **Dependencies:** Phase 4 (Courses/Lessons/Enrollments/Progress/Certificates/Files/Media endpoints), Phase 5 (frontend integration patterns established).
- **Estimated Complexity:** High
- **Estimated Duration:** 5 weeks
- **Risks:** Video pipeline (upload → malware scan → transcode → HLS delivery) has the most moving infrastructure parts of any single feature — mitigated by validating the full pipeline with a single test video early in the phase before building the authoring UI around it, so infrastructure risk surfaces before UI investment.
- **Acceptance Criteria:** An instructor can author, submit, and (once approved) publish a complete course with video lessons and a quiz; a learner can enroll, consume content, pass the quiz, and receive a verifiable certificate — the full Workflow 8–11 chain demonstrably working.

---

# Phase 7 — Library

- **Objectives:** Complete the e-book catalog, licensed-access delivery, bookmarking, and reading-progress experience per `15-SYSTEM-WORKFLOWS.md` §12 and the Library API group.
- **Deliverables:** Library browse/detail UI, signed-URL watermarked delivery flow working end to end, bookmark and reading-progress features functional.
- **Dependencies:** Phase 4 (Library endpoints), Phase 5 (frontend patterns); can run in parallel with Phase 6/8 (see Parallel Tasks) since it shares no functional overlap beyond already-built Files infrastructure.
- **Estimated Complexity:** Medium
- **Estimated Duration:** 3 weeks
- **Risks:** Watermarking/signed-delivery implementation choices affect perceived content security — mitigated by validating the delivery mechanism against the exact requirements in `10-SECURITY-BIBLE.md` §14 before considering the feature complete, not treating it as a simple file-download feature.
- **Acceptance Criteria:** A user can browse, access (with correct entitlement enforcement), bookmark, and resume reading a library item; unentitled access attempts are correctly blocked per `15-SYSTEM-WORKFLOWS.md` §12's failure handling.

---

# Phase 8 — Marketplace

- **Objectives:** Complete checkout, payment processing, order management, and product delivery per `15-SYSTEM-WORKFLOWS.md` §13–15 and the Marketplace/Orders/Payments API groups.
- **Deliverables:** Product browse/detail UI, cart/checkout flow, Stripe integration (Checkout + webhook handling), order history, admin refund tooling.
- **Dependencies:** Phase 4 (Marketplace/Orders/Payments endpoints), Phase 5; can run in parallel with Phase 6/7.
- **Estimated Complexity:** High
- **Estimated Duration:** 4 weeks
- **Risks:** Payment correctness is the platform's highest financial/legal risk surface — mitigated by exhaustive webhook-path testing (including simulated failure, duplicate-delivery, and reuse scenarios) before this phase is considered done, and by a dedicated review against `10-SECURITY-BIBLE.md` §18's payment-data-handling rules.
- **Acceptance Criteria:** A full purchase completes end to end (checkout → payment confirmation via verified webhook → entitlement grant → receipt), a failed payment is handled gracefully per Workflow 15, and an admin-issued refund correctly reverses entitlement and records a ledger `Transactions` entry.

---

# Phase 9 — AI Platform

- **Objectives:** Build the first user-facing AI features (learning assistant, content-generation aids) on top of the AI Gateway skeleton from Phase 4, implementing the full quota/cost/logging/moderation pipeline per `12-AI-INTEGRATION-BIBLE.md` and Workflows 16–17.
- **Deliverables:** At least one interactive (streaming) AI feature and one non-interactive (batch/content-aid) AI feature fully working; quota enforcement, cost tracking, prompt versioning, and response validation all demonstrably functioning; admin AI-usage/cost dashboard (feeding into Phase 10).
- **Dependencies:** Phase 4 (AI Gateway skeleton, AI_* tables), Phase 5.
- **Estimated Complexity:** High
- **Estimated Duration:** 4 weeks
- **Risks:** Cost overrun if quota enforcement isn't genuinely fail-closed before launch, and quality/safety risk if response validation is treated as an afterthought — mitigated by building quota enforcement and moderation-checking before building the second AI feature, so the pattern is proven once and reused, not each feature reinventing its own guardrails.
- **Acceptance Criteria:** Every item in `12-AI-INTEGRATION-BIBLE.md`'s scope — provider abstraction, failover, cost tracking, quotas, prompt versioning, response validation, PII redaction in logs — is demonstrably working, not just the happy-path feature UI.

---

# Phase 10 — Admin Dashboard

- **Objectives:** Build `apps/admin` per `09-PLATFORM-ARCHITECTURE.md` §16 — user management, content moderation, catalog management, order/refund tooling, analytics, AI usage dashboard — as a separate application with its own deploy pipeline.
- **Deliverables:** `apps/admin` functional for every Administration workflow (§18–21 of `15-SYSTEM-WORKFLOWS.md`, §18 of `16-API-CONTRACT.md`); mandatory MFA enforced for all admin sessions; audit-log viewer.
- **Dependencies:** Phase 4 (Administration endpoints), Phases 6–9 (there must be real courses/orders/AI usage data to manage and moderate).
- **Estimated Complexity:** Medium
- **Estimated Duration:** 4 weeks
- **Risks:** Building admin tooling last risks discovering missing API capability late — mitigated by having defined the full Administration API surface already in `16-API-CONTRACT.md` §18 during the architecture phase, so this phase is UI construction against an already-complete contract, not API design under deadline pressure.
- **Acceptance Criteria:** Every Admin Approval workflow (`15-SYSTEM-WORKFLOWS.md` §21) is operable through `apps/admin`'s UI; role/permission management, moderation queue, and analytics dashboard are all functional; `apps/admin` is deployed to its own subdomain with independent access restriction per `09-PLATFORM-ARCHITECTURE.md` §16.

---

# Phase 11 — Notifications

- **Objectives:** Complete the notification delivery infrastructure per `09-PLATFORM-ARCHITECTURE.md` §17 and Workflow 20 — queue-based fan-out across in-app and email channels, with user-configurable preferences.
- **Deliverables:** `NotificationsWorker` consuming the event queue and delivering to in-app (`Notifications` table) and email; notification center UI in `apps/web`; preference management UI.
- **Dependencies:** Phase 4 (Notifications endpoints, event-producing domains already emitting events from Phases 6–9's workflows).
- **Estimated Complexity:** Medium
- **Estimated Duration:** 2 weeks
- **Risks:** Retrofitting event-emission into already-built domain workflows if this phase is deferred too late — mitigated by each domain phase (6–9) emitting its notification-triggering events from day one even before this phase formally builds the consumer, so Phase 11 is "build the consumer for events already flowing," not "add events to already-shipped features."
- **Acceptance Criteria:** Every notification-triggering event listed across `15-SYSTEM-WORKFLOWS.md` (enrollment, certificate, order, AI response, security alerts, admin decisions) reaches the user through their configured channels; preference opt-out correctly suppresses the relevant channel.

---

# Phase 12 — Testing

- **Objectives:** Comprehensive quality pass across the full platform — unit, integration, and end-to-end test coverage; security regression pass against `10-SECURITY-BIBLE.md` §23; accessibility audit.
- **Deliverables:** Automated test suites for every critical workflow in `15-SYSTEM-WORKFLOWS.md`; a documented, executed security checklist pass; load-testing results against expected launch traffic.
- **Dependencies:** Phases 3–11 substantially complete (this phase is concentrated hardening, though foundational unit/integration testing occurs continuously within every prior phase, not solely here — see Parallel Tasks).
- **Estimated Complexity:** Medium
- **Estimated Duration:** 3 weeks
- **Risks:** Treating testing as a purely end-of-project phase risks discovering foundational issues too late to fix cheaply — mitigated by the parallel, continuous testing expectation stated in Parallel Tasks below; this phase is concentrated hardening and gap-filling, not the first time anything gets tested.
- **Acceptance Criteria:** Critical-path workflows (registration through payment through content delivery) have automated end-to-end coverage; the `10-SECURITY-BIBLE.md` §23 checklist passes platform-wide, not just per-feature; no critical or high-severity issue remains open.

---

# Phase 13 — Performance

- **Objectives:** Optimize for the "millions of users" target established in `09-PLATFORM-ARCHITECTURE.md` — caching, query optimization, bundle size, image/media delivery, and the scaling levers defined in `11-DATABASE-BIBLE.md` §11–12.
- **Deliverables:** Redis caching implemented for the hot paths identified in `11-DATABASE-BIBLE.md` §11; slow-query review and index tuning against realistic staging data volume; frontend bundle/loading performance audit; CDN caching configuration verified for static/ISR content.
- **Dependencies:** Phase 12 (a stable, feature-complete platform is the right baseline to optimize, not a moving target).
- **Estimated Complexity:** Medium
- **Estimated Duration:** 2 weeks
- **Risks:** Premature optimization in earlier phases wasting effort on paths that don't matter — mitigated by this phase being data-driven (real staging-volume query analysis, real Lighthouse/Web Vitals measurement) rather than speculative, per the "boring, scales later" philosophy in `09-PLATFORM-ARCHITECTURE.md`.
- **Acceptance Criteria:** Defined performance budgets met (Core Web Vitals targets for `apps/web`, p95 API latency targets, no N+1 query patterns in critical-path endpoints); load test demonstrates the platform handles projected launch-day traffic with acceptable latency and error rate.

---

# Phase 14 — Production Deployment

- **Objectives:** Execute the go-live per `09-PLATFORM-ARCHITECTURE.md` §21 — production infrastructure provisioning, DNS/CDN cutover, monitoring/alerting verification, and the actual launch.
- **Deliverables:** Production environment fully provisioned via Terraform; monitoring/logging/alerting (`09-PLATFORM-ARCHITECTURE.md` §19) verified live; DR/backup restore drill executed against production-equivalent data (`10-SECURITY-BIBLE.md` §20–21); go-live runbook executed.
- **Dependencies:** Phase 13 (performance-verified, feature-complete platform).
- **Estimated Complexity:** Medium
- **Estimated Duration:** 2 weeks
- **Risks:** Environment-specific issues (config, secrets, DNS propagation) that only surface in a true production environment — mitigated by a staged rollout (see Release Strategy) rather than a single all-at-once cutover, and by having already executed at least one restore drill (Phase 2) well before this phase so disaster recovery isn't being validated for the first time under launch pressure.
- **Acceptance Criteria:** Production environment serving live traffic; monitoring/alerting confirmed functional (verified via a deliberate test alert, not assumed); rollback procedure (see Rollback Strategy) executed successfully in a rehearsal before being relied upon for real.

---

# Critical Path

The sequence that cannot be compressed regardless of team size, since each step's output is required input for the next:

```
Phase 1 (Foundation) → Phase 2 (Database) → Phase 3 (Authentication) → Phase 4 (Backend API)
   → Phase 5 (Frontend Integration, auth-dependent portion)
   → [Phase 6 Learning is the longest downstream phase] → Phase 12 (Testing)
   → Phase 13 (Performance) → Phase 14 (Deployment)
```

Critical path duration: 2 + 2 + 3 + 6 + 4 + 5 + 3 + 2 + 2 = **29 weeks**, using Phase 6 (Learning, the longest of the domain phases) as the representative downstream dependency, since Phases 7–9 run in parallel with it (see below) and do not extend the critical path themselves as long as they complete within Phase 6's window.

---

# Parallel Tasks

- **Phase 5 (Frontend Integration) begins against Phase 3's output** while Phase 4 is still in progress for domains not yet built, expanding incrementally as each Phase 4 domain module lands — it does not wait for all of Phase 4 to finish before starting.
- **Phases 6, 7, and 8 (Learning, Library, Marketplace) run concurrently** once Phase 4/5 have delivered their respective domain APIs and frontend patterns — they are independent verticals with no functional overlap (`14-DATABASE-RELATIONSHIPS.md` Part 3's "content domains are peers" principle applies equally to build sequencing). With the assumed team size, this requires splitting frontend/backend pairs across the three verticals rather than one team working them in series.
- **Phase 9 (AI Platform) can begin in parallel with Phases 6–8** once its Phase 4 Gateway skeleton exists, since it has no functional dependency on Learning/Library/Marketplace being complete — only on Users and the Gateway foundation.
- **Phase 11 (Notifications)'s event-emission work happens inside Phases 6–9**, not as a blocking prerequisite to them — the dedicated consumer-building work in Phase 11 itself can run in parallel with the tail end of Phases 6–9.
- **Unit and integration testing happen continuously inside every phase**, not deferred to Phase 12 — Phase 12 is concentrated end-to-end/security/accessibility hardening and gap-filling, run in parallel with the final week(s) of Phases 9–11 rather than strictly after all of them close.
- **Phase 10 (Admin Dashboard) can begin its foundational shell (auth, navigation, role-gating) in parallel with Phase 4**, since it depends on the Administration API contract (already fully specified in `16-API-CONTRACT.md` §18) rather than on Phases 6–9's features existing yet — only the domain-specific moderation/management screens within Phase 10 need to wait for their respective domain phase.

---

# Milestones

| Milestone | Marks the completion of | Approx. week |
|---|---|---|
| **M1 — Foundation Ready** | Phase 1 | Week 2 |
| **M2 — Data Layer Live** | Phase 2 | Week 4 |
| **M3 — Identity Complete** | Phase 3 | Week 7 |
| **M4 — API Surface Complete** | Phase 4 | Week 13 |
| **M5 — Web App Connected** | Phase 5 (auth-dependent portion) | Week 15 |
| **M6 — Core Verticals Live** | Phases 6, 7, 8 (parallel) | Week 20 |
| **M7 — AI Platform Live** | Phase 9 | Week 19 (parallel with M6) |
| **M8 — Admin Operational** | Phase 10 | Week 21 |
| **M9 — Notifications Complete** | Phase 11 | Week 22 |
| **M10 — Quality Gate Passed** | Phase 12 | Week 25 |
| **M11 — Performance Verified** | Phase 13 | Week 27 |
| **M12 — Production Launch** | Phase 14 | Week 29 |

---

# Recommended Development Order

1. Foundation → Database → Authentication (strictly sequential, no shortcuts — every later phase depends on these).
2. Backend API, built domain-by-domain in this priority order within Phase 4: Users/Profiles extensions → Files (needed by nearly everything else) → Courses/Lessons/Enrollments/Progress → Library → Marketplace/Orders/Payments → News → AI Gateway skeleton → Administration — this ordering front-loads the domains with the most downstream dependents (Files, Courses) and defers the most self-contained domain (News) and the purely-administrative layer.
3. Frontend Integration begins as soon as Authentication is live, expanding domain-by-domain in lockstep with Backend API's own build order.
4. Learning, Library, and Marketplace are built in parallel by separate frontend/backend pairs once their respective API domains land, with Learning prioritized first-to-start given it's the longest phase and the platform's primary value proposition.
5. AI Platform is built in parallel with the above, starting as soon as the Gateway skeleton and Users exist.
6. Admin Dashboard's shell starts early (parallel with Phase 4) but its feature screens are completed last, after their corresponding domain phase ships.
7. Notifications' consumer is built once real events are flowing from at least one domain phase, refined as more domains come online.
8. Testing, Performance, and Deployment close out the roadmap in strict sequence, but with continuous testing throughout every prior phase as described in Parallel Tasks — Phase 12 is not the first time anything is tested, it is the final integration gate.

---

# Release Strategy

- **Staged rollout, not a single big-bang launch.** Production deployment (Phase 14) targets a limited-availability launch (waitlist, invite codes, or soft-launch to a small percentage of traffic) before full public availability, allowing real-world load and behavior to validate the Phase 13 performance work under genuine conditions before committing to full scale.
- **Feature flags gate risky or incomplete verticals independently** (`09-PLATFORM-ARCHITECTURE.md` §21) — e.g., Marketplace payments or AI features can go live to a subset of users ahead of full rollout, decoupling "code is deployed" from "feature is available to everyone."
- **Environments progress strictly local → staging → production** (`09-PLATFORM-ARCHITECTURE.md` §21) — no phase's work is considered complete until it has been verified in staging under production-like configuration, not just locally.
- **Post-launch, releases follow a regular cadence** (e.g., weekly deploys to production for non-critical changes, with the CI/CD pipeline from `09-PLATFORM-ARCHITECTURE.md` §21 as the mechanism) rather than large infrequent releases, keeping each release's blast radius small.

---

# Versioning Strategy

- The platform as a whole follows semantic versioning at the release level (`MAJOR.MINOR.PATCH`), distinct from but coordinated with the API's own versioning (`16-API-CONTRACT.md` "Versioning Strategy") — a platform `MAJOR` bump generally corresponds to an API `v2`, but the two are not required to move in lockstep for every release.
- The Homepage's own frozen version (v1.0, per the earlier Homepage phase) is treated as the platform's initial `0.x` baseline; the platform's first coordinated `1.0.0` release corresponds to Phase 14's production launch milestone (M12).
- Every deployed artifact is immutably tagged (`09-PLATFORM-ARCHITECTURE.md` §21) — the version number is not just documentation, it is the literal deployable unit referenced by the release and rollback tooling.
- Database schema versions (migration state) are tracked independently of application release versions but are always deployed in lockstep with the application version that depends on them, per the migration-before-traffic-cutover rule in `11-DATABASE-BIBLE.md` §10.

---

# Rollback Strategy

- Every production deploy is a redeploy of a previous immutable tagged artifact (`09-PLATFORM-ARCHITECTURE.md` §21) — rollback is never a manual code revert-and-rebuild under time pressure, it is a pre-tested, fast operation against already-built artifacts.
- Because migrations follow the additive-first, expand-then-contract pattern (`11-DATABASE-BIBLE.md` §10), an application rollback does not require a corresponding database rollback in the common case — the previous application version continues to function against the (additively) newer schema.
- `apps/api` deploys use blue-green or canary rollout (`09-PLATFORM-ARCHITECTURE.md` §21) — a health-check failure during rollout triggers automatic traffic cutback to the previous version before the bad deploy ever receives significant real traffic, rather than rollback being a purely reactive, post-incident action.
- Feature flags provide a rollback mechanism faster than a full redeploy for feature-specific issues — a misbehaving feature can be disabled instantly without touching the deployed artifact at all.
- Every rollback (deploy-level or flag-level) triggers the same Incident Response process defined in `10-SECURITY-BIBLE.md` §19, including a post-mortem for any rollback caused by a production-impacting defect.

---

# Definition of Done

A phase, feature, or release is considered done only when **all** of the following are true — this bar applies uniformly across every phase in this roadmap, not just the ones that explicitly restate it:

- Implementation matches its governing specification document (`09`–`16`) exactly, with any necessary deviation resolved by updating the specification first, not left as undocumented drift.
- Automated test coverage exists for the feature's critical paths (happy path and the primary documented failure-handling behavior from `15-SYSTEM-WORKFLOWS.md`).
- The relevant portions of the `10-SECURITY-BIBLE.md` §23 security checklist pass.
- No `console`/debug-only code, no hardcoded secrets, no TODO-marked incomplete logic remains in the shipped code.
- Accessibility and responsive behavior meet the standard already established and verified for the Homepage (`docs/00–08`), extended consistently to every new authenticated screen.
- Audit logging is implemented and verified for every action identified as security/administratively significant per `10-SECURITY-BIBLE.md` §18 and the per-workflow Audit Logging requirements in `15-SYSTEM-WORKFLOWS.md`.
- The feature has been demonstrated working in staging, under production-like configuration, not only in local development.
- Documentation (this roadmap, and any of docs 09–16 it touches) is updated to reflect what was actually built, keeping the documentation set a living, accurate reference rather than a historical snapshot of intent.
