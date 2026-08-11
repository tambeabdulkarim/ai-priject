# Restore Point — Phase 35 (Learning Paths Master Blueprint)

**Date:** 2026-08-10 · **Type:** Analysis and planning only. **Zero database writes, zero seed runs, zero application code changes, zero schema changes.** This phase produced one new planning document and updated 4 standing docs — nothing else in the repository changed.

## What this phase was

A full skill-gap and course-architecture analysis for the 6 currently-empty named learning paths (Backend Engineer, Frontend Engineer, Full Stack Engineer, Data Scientist, Cloud Engineer, Cyber Security Analyst), validated against the real, current database state — not against memory or the Phase 24 blueprint alone.

## What's new

- **`docs/content-library/phase35-learning-path-master-blueprint.md`** — the full 21-section master blueprint: per-path target outcomes, skill-gap tables, required-course determinations, learning sequences, project/assessment/resource architecture, and priority ordering.
- **Two real architecture gaps found and documented (not fixed):** no `learningPathId` field on `Certificate` (no path-level certificate mechanism exists), and no `learningPathId` field on `Project` (no path-level capstone project mechanism exists) — both confirmed by directly reading `schema.prisma`, not assumed.

## Key findings

- Only 3 `LearningPath` rows exist in the real database (Prompt Engineer, Frontend/Web, DevOps Engineer) — none of this phase's 6 target paths have a database row.
- All 6 courses built in Phases 25–34 are real and production-ready; every other course in `courses.md`'s 18-course catalog remains planned-only, including all 7 new courses this phase's 6 paths still need (Programming Foundations, Database Design & SQL Mastery, Cloud Computing Foundations, Data Science Foundations, Machine Learning Foundations, Cyber Security Fundamentals, Career Preparation).
- The database also contains 35 non-production noise rows (E2E test-fixture/editor/review courses from prior phases' live-API testing) — real, harmless, disclosed, excluded from all analysis.
- Course counts needed per path are **not uniform** — validated per path from a real skill-gap analysis, ranging from 1 new course (Frontend Engineer) to 3 new courses (Data Scientist, the path with the least existing-content reuse).
- Recommended priority order: Frontend Engineer → Backend Engineer → Full Stack Engineer → Cloud Engineer → Cyber Security Analyst → Data Scientist — reasoned from reuse, shared-course leverage, and content effort, not asserted.

## Validated, not assumed

- Full database inventory queried directly (learning paths, all 41 course rows classified real-vs-noise, module/lesson/quiz/question/project counts per real course) before any recommendation was made.
- `schema.prisma` read directly to confirm both certification-architecture gaps, rather than inferred from the Phase 24 blueprint's aspirational design.
- Two new resources verified via live `WebFetch` this phase (official Python documentation — confirmed; official AWS documentation — attempt inconclusive, disclosed as such, not claimed verified).
- Cross-checked every proposed new course against the 6 real courses' actual module content (not just their titles) to avoid recommending a duplicate — e.g. confirmed AI Foundations does NOT substitute for Data Science Foundations or Machine Learning Foundations despite superficial "AI" naming overlap; confirmed Full-Stack Web Dev's OWASP lesson does NOT substitute for Cyber Security Fundamentals' application-security module (different target skill, same named vulnerability list).
- Validation pass completed: no duplicate proposed course titles, no duplicate skill-to-course assignments, no circular prerequisites, every required skill maps to exactly one recommended course, every path has a stated logical progression.

## How to resume

Read `docs/content-library/phase35-learning-path-master-blueprint.md` in full — particularly Section 17 (Priority Order) and Section 21 (Recommended Execution Sequence) before deciding what to build next. **Explicitly stopped: no course was created, no seed was run, no Phase 36 work began. Awaiting explicit project-owner approval and direction on which path (or which shared foundation course) to build first.**
