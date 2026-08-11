# Restore Point — Phase 21 (v1.1 Strategic Planning)

**Date:** 2026-08-06 · **Type:** Read-only planning. Zero application code changed. Zero commits created. Zero files deleted.

## What this phase was

Phoenix Platform Version 1.0 is frozen (Phase 20). Phase 21 looked forward: a deep, non-repeating strategic planning pass for v1.1, covering architecture-area-by-area tradeoffs (18 named areas), a feature roadmap framed by business/technical value rather than a flat priority list, technical debt beyond what the freeze already documented, security/performance/AI/UX-specific roadmaps, scalability reasoning at 5 user-count tiers, a testing roadmap, a release/versioning strategy, and an executive recommendation.

Explicit constraint honored throughout: **do not repeat `docs/version-1.0-roadmap.md`**. That document is a flat, prioritized Immediate/Short/Medium/Long/Future list. This phase instead reasoned area-by-area about *why* each item matters, what it unblocks, and what it doesn't yet justify — genuinely new synthesis, not a restatement.

## Deliverable

**`docs/phase21-v1.1-roadmap.md`** — the full 11-section report. Read it directly for detail; the highlights below are for quick orientation only.

## Headline conclusions

- **Three highest-leverage v1.1 items, in order:** (1) Workers foundation + Notifications delivery worker (unblocks media transcoding and AI batch jobs downstream), (2) production monitoring/crash reporting (closes the platform's single biggest operational blind spot), (3) the Next.js Critical-severity dependency upgrade (closes a real, already-documented vulnerability). None of the three requires a product decision to start — unlike Search (needs real catalog content) or AI expansion (needs product scoping).
- **The AI module is real but thin relative to its marketing prominence** ("AI Tools" is a homepage headline feature; the backend is a working OpenAI/Anthropic gateway with quota tracking, nothing more) — flagged as the platform's most important reality/marketing gap to be honest about in v1.1 planning.
- **Scalability reasoning (not benchmarked — no load testing has ever been run on this platform, a disclosed gap):** the architecture is stateless-by-design (JWT auth, Redis-backed shared rate-limit state) and comfortably handles 100–1,000 users as-is; 10,000 users is where the deferred caching/notifications-worker items become necessary rather than optional; 100,000 users needs horizontal API scaling (a config change, not a redesign, because of the stateless design) plus read replicas and real search; 1,000,000 users would need genuine architectural rework (sharding, a real message queue, service decoupling) — explicitly **not recommended now**, reaffirming the platform's own "boring at launch, scale by adding" philosophy.
- **What should never be casually changed:** the RS256 JWT + RBAC identity model, the database's schema-per-domain/migration discipline, `EmailService`'s safe-degrading pattern — same conclusion as Phase 20's freeze, reaffirmed after this deeper pass found no reason to revisit it.
- **New technical debt surfaced this phase (not in the Phase 20 freeze):** a repeated locale-resolution boilerplate pattern across nearly every `apps/web` page component (real, directly observed across dozens of files edited in earlier phases); hardcoded per-controller rate-limit values instead of centralized config; no feature-flag mechanism (named as a future need in the original architecture doc, never built) — relevant because v1.1 features will be the first ones that might benefit from gradual rollout.

## What did NOT happen this phase (by design)

No code was written or modified. No security improvements were implemented (Section 4 is recommendations only, per the phase's explicit constraint). No new infrastructure was provisioned. No guesses were presented as facts — where this phase's confidence was lower than a full re-verification would give (e.g., whether a persistent AI chat/conversation model exists in the schema), the report says so explicitly rather than asserting a specific answer.

## How to resume

Read `docs/phase21-v1.1-roadmap.md` in full before deciding what to build next. The report's own Section 11 (Executive Recommendation) is the fastest way to get oriented: build Workers/Notifications + monitoring + the Next.js upgrade as v1.1.0, then let real production usage data — not further guessing — decide whether Search, AI expansion, or Analytics depth comes next.

This does not change Phase 19's launch status. **Launch remains 🟡 LAUNCH POSTPONED**, blocked on the project owner's external-account decisions (`docs/phase19-execution-readiness-report.md`'s Owner Action List) — v1.1 planning and launch execution are two independent threads, exactly as they were after Phase 20.
