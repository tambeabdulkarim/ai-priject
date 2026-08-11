# Restore Point — Phase 38 (Full Stack Engineer Learning Path Production)

**Date:** 2026-08-11 · **Type:** Real path assembly, zero new content authoring — executing Phase 35's blueprint after confirming, by direct inspection, that both courses it flagged as "new" for this path were already built for other paths (Phase 36, Phase 37). No schema changes, no application code changes (`apps/api/src`, `apps/web/src` both untouched). Zero regressions: 241/241 backend tests unchanged, both builds clean, seed run twice with 0 duplicates on the second run, all 10 prior content/path seeds re-confirmed idempotent.

## What this phase was

Executed Phase 35's Full Stack Engineer recommendation. Unlike Phases 36/37 (each of which built exactly 1 new course), this phase's own skill-gap analysis found **zero new courses were needed** — both courses Phase 35 flagged as new for this path (Programming Foundations, Database Design & SQL Mastery) had already been built in Phases 36 and 37, for Frontend Engineer and Backend Engineer respectively. This phase's entire content footprint is one new `LearningPath` row plus 5 course memberships.

## What's new

- **New `LearningPath`: `full-stack-engineer`** — 5 courses in Phase 35's specified sequence: Programming Foundations (1) → Database Design & SQL Mastery (2) → UI/UX Design Foundations (3) → Full-Stack Web Development with Next.js (4) → DevOps Foundations (5).
- **New file:** `apps/api/prisma/seed-phase38-content.ts` — additive only, creates only the path + memberships.
- **Zero new modules, lessons, quizzes, questions, or projects.**

## Key design decision (documented, not silently made)

Phase 35's Section 17 explicitly predicted this outcome ("If Backend Engineer is built first, Full Stack Engineer becomes nearly free"). This phase didn't assume that prediction was correct — it re-verified it by direct inspection of all 5 required courses' real modules/lessons/projects before writing anything, confirming every skill (including the one genuinely new "cross-stack integration" skill) is already covered by existing, production-ready content, and that a genuine frontend+backend+database-integrated project already exists (Full-Stack Web Dev's "Full-Stack Next.js Feature," which explicitly reuses/extends its own REST API project's backend route). Per the user's own explicit instruction ("if one course is enough, don't build the second — document why"), this same logic was applied down to zero: no course was built, and the reasoning is recorded in `docs/phase38-fullstack-learning-path-production-report.md` Section 2.

## Numbers

0 new courses, 0 new modules, 0 new lessons, 0 new quizzes, 0 new questions, 0 new projects, 1 new `LearningPath`, 5 new `LearningPathCourse` memberships.

## Validated, not assumed

- Idempotency: `seed-phase38-content.ts` run twice — second run created 0 new records (path and all 5 memberships correctly recognized as already existing). All 10 prior content/path seeds (`seed-phase25` through `seed-phase37`) re-run afterward — every one still fully idempotent, zero duplicates.
- Record counts directly queried before/after: courses/modules/lessons/quizzes/questions/projects **all unchanged** (43/59/164/34/170/27 → identical) — the only deltas are `paths` 4→5 and `LearningPathCourse` 12→17, exactly matching the seed script's own reported counts and confirming no unintended content was created.
- **Direct duplicate-content database checks**: zero duplicate learning-path slugs platform-wide (5 total), zero duplicate course memberships within the new path.
- `tsc`, `eslint`, backend build, frontend build: all clean, both apps.
- **Live, real, end-to-end learner journey, all 23 requested steps, across all 5 courses**: used a freshly registered learner account (not the long-lived fixture, which already held certificates for all 5 courses from prior phases) to genuinely exercise a from-zero journey. Login → opened the path, confirmed all 5 courses in sequence → for each of the 5 courses in turn: opened modules/lessons, enrolled, completed all lessons, (on course 1 only) submitted deliberately wrong quiz answers and confirmed completion did not falsely rise, submitted correct answers on every quiz, reached 100% completion, received a brand-new certificate → confirmed all 5 certificates exist with zero duplicates → re-triggered completion on the last course and confirmed no duplicate certificate → opened Full-Stack Web Dev's genuine frontend+backend+database-integrated project, submitted a real feature design → learner confirmed blocked (403) from self-evaluation → the real owning instructor evaluated it for real (90%, passed, specific written feedback) → the evaluation was confirmed persisted and re-readable.
- **Course-to-course transition** explicitly verified: the same learner session moved cleanly from Programming Foundations through all 4 remaining courses with no state leakage or blocking issues.

## Discipline maintained from prior phases

No content duplicated. No resource fabricated — none was cited, since no new lesson content was written. No architectural change was needed or made — the existing `LearningPath`/`LearningPathCourse`/`Course` architecture already supported everything this phase needed. The two Phase 35 architecture gaps (no `learningPathId` on `Certificate` or `Project`) remain open, unaffected, undisclosed-as-fixed.

## Test-harness note (not a content or application bug)

The learner-journey driver script hit the platform's real, existing rate limiter (120 req/60s) when firing requests too fast; paced/backoff logic was added and the journey resumed cleanly with zero state loss. Flagged in the production report as a real, working piece of platform behavior encountered during testing, not a defect.

## How to resume

Read `docs/phase38-fullstack-learning-path-production-report.md` in full. `docs/content-library/phase27-content-inventory.md` is updated to reflect the new Full Stack Engineer path's 5/5-course status. **Explicitly stopped: not beginning Phase 39, awaiting approval.**
