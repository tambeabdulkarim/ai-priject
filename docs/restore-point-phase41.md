# Restore Point — Phase 41 (Data Scientist Learning Path Production)

**Date:** 2026-08-11 · **Type:** Real content production (1 new course) + one new `LearningPath`, executing Phase 35's blueprint with one documented scope extension (a light, introductory ML module beyond the literal 4-module blueprint, to keep the mandatory path self-contained). Executed fully autonomously per this phase's own execution mode — no intermediate approval stops. No schema changes, no application code changes (`apps/api/src`, `apps/web/src` both untouched). Zero regressions: 241/241 backend tests unchanged, both builds clean, seed run twice with 0 duplicates on the second run, all 13 prior content/path seeds re-confirmed idempotent.

**This phase completes all 6 of the originally-named learning paths from Phase 35's scope.**

## What this phase was

Executed Phase 35's Data Scientist recommendation — the path Phase 35 itself flagged as having "the largest genuine gap — 0 courses currently reusable in full." Built the 1 remaining new course (Data Science Foundations: From Data to Decisions — 2 of the original 3 "new" courses, Programming Foundations and Database Design & SQL Mastery, had already been built for other paths in Phases 36/37), reused those 2 already-real courses, and created a genuinely new `data-scientist` `LearningPath`.

## What's new

- **New course: Data Science Foundations: From Data to Decisions** — 5 modules (Data Collection, Cleaning & SQL for Analysts; Statistics & Probability for Data Analysis; Hypothesis Testing & Experimentation; Data Visualization & Storytelling; Introduction to Predictive Modeling & Responsible Data Science), 18 lessons (13 content + 5 quiz), 5 quizzes (25 questions), 2 standalone projects (Exploratory Data Analysis & Findings Report — Beginner/Intermediate; End-to-End Data Product — Capstone). Its own Module 1 "SQL for Analysts" lesson explicitly does not duplicate Database Design & SQL Mastery's existing SELECT/WHERE/JOIN content — confirmed by direct query before writing anything (that course's real Module 1 covers no GROUP BY/aggregate content, a genuine gap this course fills).
- **New file:** `apps/api/prisma/seed-phase41-content.ts` — additive only.
- **New `LearningPath`: `data-scientist`** — 3 courses in sequence: Programming Foundations (1) → Database Design & SQL Mastery (2) → Data Science Foundations (3).
- **6 new, live-verified resources**: NumPy, pandas, Python "statistics" module docs, Seeing Theory (Brown University), "Fundamentals of Data Visualization" (Claus Wilke), scikit-learn.

## Key design decision (documented, not silently made)

`courses.md`'s literal blueprint for Data Science Foundations specifies only 4 modules with zero predictive-modeling content, deferring that entirely to a separate, non-mandatory "Machine Learning Foundations" elective. But Phase 35's own Section 6 states this path's Advanced/Capstone projects "assume at least introductory ML," and this phase's own explicit objective requires the mandatory path to be self-sufficient end-to-end. Resolution: added a 5th module providing only the light, introductory concepts the path's own projects require (train/test split, overfitting, classification basics, precision/recall, responsible data science) — explicitly not the deeper, multi-algorithm content a real, future Machine Learning Foundations course would cover. Documented explicitly, not silently decided.

## Numbers

1 new course, 5 new modules, 18 new lessons (13 content + 5 quiz), 5 new quizzes, 25 new questions, 2 new projects, 1 new `LearningPath`, 3 new `LearningPathCourse` memberships.

## Validated, not assumed

- Idempotency: `seed-phase41-content.ts` run twice — second run created 0 new records at every level. All 13 prior content/path seeds (`seed-phase25` through `seed-phase40`) re-run afterward — every one still fully idempotent, zero duplicates.
- Record counts directly queried before/after: courses 45→46, modules 69→74, lessons 195→213, quizzes 44→49, questions 220→245, projects 31→33, paths 7→8, `LearningPathCourse` 24→27 — exactly matching the seed script's own reported counts.
- **Direct duplicate-content database checks**: zero duplicate module/lesson/quiz/project titles or question prompts within the new course, zero duplicate course titles/slugs platform-wide (46 total), zero duplicate learning-path slugs (8 total), zero duplicate path-course memberships.
- `tsc`, `eslint`, backend build, frontend build: all clean, both apps. Backend tests: 241/241, unchanged from Phase 40.
- **Live, real, end-to-end learner journey across all 3 courses**: used a freshly registered learner account for a genuine from-zero journey, split into 2 batches to respect the documented quiz-submission rate limit. Login → opened the new "Data Scientist" path, confirmed all 3 courses in correct sequence → for each course in turn: opened modules/lessons, enrolled, completed all lessons, (on course 1 only) submitted deliberately wrong quiz answers and confirmed completion did not falsely rise, submitted correct answers on every quiz, reached 100% completion, received a brand-new certificate → confirmed all 3 certificates exist with zero duplicates → re-triggered completion on the Data Science course and confirmed no duplicate certificate → opened the capstone project, submitted a real, specific analytical response (hypothesis-test interpretation, overfitting reasoning, precision/recall justification, a specific bias check, an honest business recommendation) → learner confirmed blocked (403) from self-evaluation → the real owning instructor evaluated it for real (94%, passed, specific written feedback) → the evaluation was confirmed persisted and re-readable.
- **Course-to-course transition** explicitly verified across all 3 courses.

## Real, transient issue diagnosed during this phase (not a reproducible bug)

One quiz submission returned a real 500 error mid-journey. The server itself remained healthy throughout (confirmed via a parallel health check), and an immediate retry of the identical request succeeded cleanly with the correct score — consistent with the same class of transient Neon serverless-database wake/reconnect blip hit earlier in this same phase during DB inspection (which also self-resolved on retry). No code change was made, since the issue did not reproduce. Documented in the production report for transparency, not hidden.

## Discipline maintained from prior phases

No content duplicated. No resource fabricated — all 6 newly cited resources were live-verified via `WebFetch` before citing; one candidate (Matplotlib docs) returned HTTP 403 and was correctly left uncited rather than guessed. No architectural change was needed or made. The two Phase 35 architecture gaps (no `learningPathId` on `Certificate` or `Project`) remain open, unaffected, undisclosed-as-fixed.

## How to resume

Read `docs/phase41-data-science-content-production-report.md` in full. `docs/content-library/phase27-content-inventory.md` is updated to reflect the new course and the new Data Scientist path's 3/3-course status. **All 6 of Phase 35's originally-named learning paths are now complete.** Phase 41 completed fully; no blocker was encountered. Not beginning Phase 42 automatically, per standing project discipline — awaiting the project owner's direction on what's next (a Machine Learning Foundations elective, or scope beyond Phase 35's original 6 paths, are the two most likely next threads, neither assumed).
