# Restore Point — Phase 39 (Cloud Engineer Learning Path Production)

**Date:** 2026-08-11 · **Type:** Real content production (1 new course) + one new `LearningPath`, executing Phase 35's blueprint exactly as planned (no course-count correction needed this time). No schema changes, no application code changes (`apps/api/src`, `apps/web/src` both untouched). Zero regressions: 241/241 backend tests unchanged, both builds clean, seed run twice with 0 duplicates on the second run, all 11 prior content/path seeds re-confirmed idempotent.

## What this phase was

Executed Phase 35's Cloud Engineer recommendation: build the 1 remaining new course (Cloud Computing Foundations: AWS, Azure & GCP — the second of Phase 35's "2 new courses" for this path, since Programming Foundations, the first, was already built in Phase 36), reuse 3 already-real, production-ready courses (Programming Foundations, Computer Networking Foundations, DevOps Foundations), and create a genuinely new `cloud-engineer` `LearningPath` (no existing path was a real fit — confirmed by direct inspection).

## What's new

- **New course: Cloud Computing Foundations: AWS, Azure & GCP** — 5 modules (Cloud Fundamentals & Shared Responsibility; Compute & Storage Services; Cloud Networking & IAM; Infrastructure as Code & Cost Management; Multi-Cloud & Cloud-Native Architecture), 18 lessons (13 content + 5 quiz), 5 quizzes (25 questions), 2 standalone projects (Static Site on Cloud Storage with a CDN — Beginner; Secure, Monitored Multi-Tier Cloud Architecture — Capstone). Its own Module 4 explicitly does not re-teach Terraform/general IaC principles — confirmed by direct comparison against DevOps Foundations Module 4's real lesson titles, and its own first lesson states DevOps Foundations Module 4 as a prerequisite.
- **New file:** `apps/api/prisma/seed-phase39-content.ts` — additive only.
- **New `LearningPath`: `cloud-engineer`** — 4 courses in sequence: Programming Foundations (1) → Computer Networking Foundations (2) → Cloud Computing Foundations (3) → DevOps Foundations (4).
- **5 new, live-verified resources**: NIST SP 800-145 (official cloud computing definition), AWS Overview whitepaper, Microsoft Azure documentation, Google Cloud documentation (note: `cloud.google.com/docs` redirects to `docs.cloud.google.com/docs`, the correct URL was cited), AWS Well-Architected Framework.

## Key design decision (documented, not silently made)

Unlike Phase 37 (which found and corrected a real counting error in Phase 35's document), this phase's skill-matrix analysis confirmed Phase 35's Cloud Engineer course count was accurate as written: "2 new + 2 reused," with Programming Foundations already done in Phase 36. Only Cloud Computing Foundations remained genuinely new. This was verified by direct inspection, not assumed from the blueprint's own claim — the same discipline applied regardless of whether the blueprint turns out to be right or wrong.

A second decision: Cloud Computing Foundations' own Module 4 ("Infrastructure as Code & Cost Management") required careful scoping to avoid duplicating DevOps Foundations Module 4's already-real Terraform/IaC content — resolved by directly reading DevOps Foundations' real lesson titles before writing anything, and explicitly scoping the new module to cloud-provider-specific resource modeling/drift and cost management, exactly as Phase 35's own blueprint flagged as a real design constraint for whichever phase eventually built this course.

## Numbers

1 new course, 5 new modules, 18 new lessons (13 content + 5 quiz), 5 new quizzes, 25 new questions, 2 new projects, 1 new `LearningPath`, 4 new `LearningPathCourse` memberships.

## Validated, not assumed

- Idempotency: `seed-phase39-content.ts` run twice — second run created 0 new records at every level. All 11 prior content/path seeds (`seed-phase25` through `seed-phase38`) re-run afterward — every one still fully idempotent, zero duplicates.
- Record counts directly queried before/after: courses 43→44, modules 59→64, lessons 164→180, quizzes 34→39, questions 170→195, projects 27→29, paths 5→6, `LearningPathCourse` 17→21 — exactly matching the seed script's own reported counts.
- **Direct duplicate-content database checks**: zero duplicate module/lesson/quiz/project titles or question prompts within the new course, zero duplicate course titles/slugs platform-wide (44 total), zero duplicate learning-path slugs (6 total), zero duplicate path-course memberships.
- `tsc`, `eslint`, backend build, frontend build: all clean, both apps. Backend tests: 241/241, unchanged from Phase 38.
- **Live, real, end-to-end learner journey across all 4 courses**: used a freshly registered learner account for a genuine from-zero journey. Login → opened the new "Cloud Engineer" path, confirmed all 4 courses in correct sequence → for each course in turn: opened modules/lessons, enrolled, completed all lessons, (on course 1 only) submitted deliberately wrong quiz answers and confirmed completion did not falsely rise, submitted correct answers on every quiz, reached 100% completion, received a brand-new certificate → confirmed all 4 certificates exist with zero duplicates → re-triggered completion on the Cloud course and confirmed no duplicate certificate → opened the capstone project, submitted a real, specific multi-tier architecture design covering compute/storage/network/IAM/IaC/reliability/cost, with an honest 6-pillar Well-Architected self-evaluation → learner confirmed blocked (403) from self-evaluation → the real owning instructor evaluated it for real (93%, passed, specific written feedback) → the evaluation was confirmed persisted and re-readable.
- **Course-to-course transition** explicitly verified across all 4 courses.

## Discipline maintained from prior phases

No content duplicated. No resource fabricated — all 5 cited resources were live-verified via `WebFetch` before citing. No architectural change was needed or made — the existing `LearningPath`/`LearningPathCourse`/`Course` architecture already supported everything this phase needed. The two Phase 35 architecture gaps (no `learningPathId` on `Certificate` or `Project`) remain open, unaffected, undisclosed-as-fixed.

## Test-harness note (not a content or application bug)

The same rate limiter encountered in Phase 38 was hit again during course 3's quiz submissions; this time a single 15s backoff wasn't enough — needed a full ~90s idle wait plus a slower 2.5s-between-requests pace to finish cleanly. Zero lesson/quiz state was lost during the pause. Flagged in the production report as expected platform behavior under fast automated testing, not a defect.

## How to resume

Read `docs/phase39-cloud-engineer-path-production-report.md` in full. `docs/content-library/phase27-content-inventory.md` is updated to reflect the new course and the new Cloud Engineer path's 4/4-course status. **Explicitly stopped: not beginning Phase 40, awaiting approval.**
