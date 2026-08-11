# Restore Point — Phase 25 (Educational Content Verification & First Production Content)

**Date:** 2026-08-09 · **Type:** Real content authoring + controlled, additive database seed. `apps/api/src` (application code) untouched — 209/209 backend tests still pass. One new file: `apps/api/prisma/seed-phase25-content.ts`.

## What this phase was

Converted a representative slice of the Phase 24 content blueprint into the platform's first real, non-test-fixture educational content, and proved the entire pipeline works end-to-end — from resource verification, through authoring, through database seeding, through a live learner completing a course and receiving a real certificate.

## What's now real in the database

- **6 courses** (Module 1 of each, from `docs/content-library/courses.md`'s approved structure): Prompt Engineering, AI Foundations, UI/UX Design Foundations, Full-Stack Web Development with Next.js, Computer Networking Foundations, DevOps Foundations.
- **37 lessons**, all real, non-filler content following the Phase 24 lesson template.
- **6 quizzes, 30 questions** — real mix of single/multiple/text question types, 75% passing threshold, no uniform correct-answer pattern.
- **6 project briefs** (2 per selected path), seeded as `Lesson` rows — a deliberate, disclosed reuse of the existing model (see the schema-gap note below for what this does and doesn't cover).

## The headline finding: real schema gaps, documented not invented

Per this phase's explicit instruction ("if the schema cannot represent an approved content requirement, stop and document the gap — do not redesign the database automatically"), inspection of the real Prisma schema found:

1. **No `LearningPath` model exists.** Paths are documentation-only (`docs/content-library/learning-paths.md`) today, not a real database entity.
2. **No `Project`/submission/grading model exists.** A project's brief legitimately fits the existing `Lesson` model (contentType `text`) — used here — but there is no way to track a learner's actual submission or its evaluation. This is the more significant gap.
3. **`Course` has no difficulty/hours/prerequisites/tags fields**; `Tag` is wired only to `News`, not `Course`.
4. **`Module`/`Lesson` have no unique constraint beyond `id`** — the new seed script's idempotency is implemented at the application level (`findFirst` before `create`) rather than a true DB `upsert`, and this is called out explicitly in the script's own header comment as a real, minor technical-debt observation.

None of these were resolved by modifying the schema this phase. Full detail: `docs/phase25-content-production-report.md`'s Database Findings section.

## Two real corrections found during live verification

OpenAI's and Anthropic's official documentation URLs have both moved since Phase 24 (`platform.openai.com/docs` → `developers.openai.com/api/docs/overview`; `docs.anthropic.com` → `platform.claude.com/docs`). Found via real `WebFetch` requests, not memory. `docs/content-library/documentation-links.md` is corrected.

## Validated, not assumed

- **Idempotency:** the seed script was run twice against the real local database. Second run created zero new records (logged "already exists, skipping create" for all 6 courses).
- **No duplicates:** confirmed via direct Prisma query — exact expected counts (6 courses, 37 lessons, 6 quizzes, 30 questions), all unique titles.
- **Real end-to-end learner journey:** logged in as `e2e.learner@phoenix.test`, found the course via the real catalog search, enrolled, read real lesson content via the live API, completed all 8 lessons of the Prompt Engineering course's Module 1, submitted a real quiz attempt that scored 100% via the platform's actual scoring logic (including correctly grading an open-ended text question), reached 100% course completion, and received a real, automatically-issued certificate (`CERT-241A68ACD080`) — the platform's existing, pre-dating-this-phase certificate-issuance logic fired correctly with no manual trigger.
- **Regression:** 209/209 backend tests still pass; zero application code touched.

## How to resume

Read `docs/phase25-content-production-report.md` in full, particularly its Database Findings and Recommended Phase 26 sections. Two undecided directions are laid out (schema design for LearningPath/Project models, vs. continuing content production per `content-roadmap.md`) — the report deliberately does not choose between them, per this phase's instruction not to guess architectural decisions. **Explicitly stopped: not beginning Phase 26, awaiting approval.**
