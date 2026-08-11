# Restore Point — Phase 27 (Educational Content Production & Platform Population)

**Date:** 2026-08-09 · **Type:** Real content production against the existing Phase 26 architecture. No schema changes, no application code changes. Zero regressions: 230/230 backend tests unchanged, both builds clean, Phase 25/26 seeds both re-verified fully idempotent after this phase's additions.

## What this phase was

The first real content-production pass built entirely on the Phase 26 architecture: extended 3 of the 6 Phase 25 courses with genuinely new modules, brought one course to full completion, and created the platform's first 2 standalone `Project` rows (not lesson-linked) — proving the Phase 26 architecture works for real, newly-authored project content, not just the migrated Phase 25 briefs.

## What's new

- **Prompt Engineering: Mastering Large Language Models — now fully complete** (4 of 4 planned modules, 25 lessons, 4 quizzes, 20 questions, 4 projects). This is the platform's first course declared production-ready end-to-end.
- **UI/UX Design Foundations** — Module 2 (User Research & Wireframing) added, 5 new lessons, 1 new quiz. Explicitly still partial (2 of 4 modules).
- **DevOps Foundations** — Module 2 (Containers/Docker) added, 4 new lessons, 1 new quiz. Explicitly still partial (2 of 5 modules).
- **2 new standalone Projects** (RAG Pipeline with Citations; Production Prompt-Powered Feature — Capstone) — created directly via the real Phase 26 `Project` model, no `sourceLessonId`, real substantial `instructions` text. The first projects on the platform NOT sourced from a Phase 25 lesson-workaround.
- **New file:** `apps/api/prisma/seed-phase27-content.ts` — additive only.

## Numbers

25 new lessons, 5 new quizzes, 25 new quiz questions, 5 new modules, 2 new projects. Combined platform totals: 62 lessons, 11 quizzes, 55 questions, 36 modules, 8 projects — across the same 6 courses and 3 learning paths Phase 25/26 established (no new courses, no new paths this phase).

## Validated, not assumed

- Idempotency: `seed-phase27-content.ts` run twice — second run created 0 new records. `seed-phase25-content.ts` and `seed-phase26-content.ts` re-run after this phase's changes — both still fully idempotent, confirming zero disruption to prior phases' data.
- Record counts directly queried before/after: courses 41→41, modules 31→36, lessons 47→72, quizzes 6→11, questions 30→55, projects 6→8, paths/pathCourses/enrollments/certs all unchanged.
- `tsc`, `eslint`, backend build, frontend build, `prisma validate`: all clean.
- Backend tests: 230/230, unchanged from Phase 26 (no `src/` code touched).
- **Live, real, end-to-end learner journey**: login → open path → open the now-4-module course → read a real new lesson → pass a real new quiz at 100% → view both new standalone projects (confirmed real instructions, no duplication) → submit a real project via the Phase 26 architecture → confirm a learner is blocked (403) from self-grading → confirm the owning instructor can view (200) and evaluate (201) real submissions.

## Discipline maintained from Phase 25/26

No content duplicated (verified both structurally — idempotent seed guards — and by direct database query). No resource fabricated — every new lesson's citations reuse already-verified Phase 25 sources, with `NEEDS_VERIFICATION` flags carried forward honestly, not silently upgraded. No course, path, or category falsely declared complete — `docs/content-library/phase27-content-inventory.md` states explicit per-course status (production-ready / partially authored / planned) for every touched and untouched item.

## How to resume

Read `docs/phase27-educational-content-production-report.md` in full, particularly Section 12 (Content Still Planned) and Section 19 (Recommended Phase 28 — two candidate directions, deliberately not chosen). `docs/content-library/phase27-content-inventory.md` is the fast reference for exact per-course/per-path completion state. **Explicitly stopped: not beginning Phase 28, awaiting approval.**
