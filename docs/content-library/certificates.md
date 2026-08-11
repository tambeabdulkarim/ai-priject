# Phoenix Content Library — Certificates

**Status:** Master blueprint, Phase 24. Defines two certificate tiers — **Course Certificate** (awarded per completed course) and **Path Certificate** (awarded per completed learning path, the more significant credential) — and the exact, checkable requirements for each. This uses Phoenix's existing, real `Certificate` model (`apps/api`'s `modules/certificates`) — no new database schema is introduced by this document; it only defines the content-side policy for what triggers issuance.

## General Policy (applies to every certificate)

- Certificates are **never** issued for partial completion, time served, or payment alone — every requirement below must be independently checkable (a project was submitted and passed review, an exam score was met), not self-reported.
- Passing score for any graded exam: **75%**, chosen as a standard that reflects real competence without being so high it penalizes normal learning variance. Applied consistently across every course and path in this library — see `quality-standards.md` for why this number was chosen and when it's allowed to differ.
- All required projects must meet the evaluation focus stated in `projects.md` for that project — a rubric, not a vibe check.
- A certificate is dated and versioned to the content version it was earned under (so if a course is later revised, the original certificate remains valid to what was actually completed).

## Course Certificate Requirements (per one of the 18 flagship courses)

1. Complete every lesson's exercises (auto-checked where applicable).
2. Submit and pass all module projects for that course (count and description per `courses.md`'s course entries).
3. Score ≥75% on the course's final exam (a graded assessment covering every module, written per-course during content production).
4. No time limit is imposed — mastery, not speed, is the gate.

## Path Certificate Requirements (per one of the 9 learning paths)

A Path Certificate is the senior credential — it requires more than "complete every course in the path":

1. Hold a valid Course Certificate for every course listed in that path's stage table (`learning-paths.md`).
2. Submit and pass **all four** tier projects for that path — Beginner, Intermediate, Advanced, and Professional Capstone (`projects.md`) — the Capstone specifically must be reviewed against its stated evaluation focus, not just "submitted."
3. Score ≥75% on a **path-level comprehensive exam** — distinct from any single course's final exam, testing integration across the whole path (e.g. the AI Engineer path's comprehensive exam tests whether a learner can reason about when to use classical ML vs. deep learning vs. prompting an LLM, not just facts from one course).
4. Complete the Career Preparation course's core deliverables (resume/portfolio review, one mock technical interview, one mock behavioral interview) — required for every path, since "job-ready" is the explicit target of a Path Certificate.

## Per-Path Certificate Summary

| Path | Required course certificates | Required projects | Comprehensive exam passing score | Career prep required? |
|---|---|---|---|---|
| AI Engineer | 7 courses (see `learning-paths.md`) | 4-tier project set | 75% | Yes |
| Backend Engineer | 6 courses | 4-tier project set | 75% | Yes |
| Frontend Engineer | 3 courses | 4-tier project set | 75% | Yes |
| Full Stack Engineer | 5 courses (+1 optional elective) | 4-tier project set | 75% | Yes |
| Data Scientist | 4 courses (+1 optional elective) | 4-tier project set | 75% | Yes |
| Cloud Engineer | 4 courses | 4-tier project set | 75% | Yes |
| Cyber Security Analyst | 4 courses (+1 optional elective) | 4-tier project set | 75% | Yes |
| DevOps Engineer | 4 courses | 4-tier project set | 75% | Yes |
| Prompt Engineer | 3 courses | 4-tier project set | 75% | Yes |

## Non-Path Standalone Course Certificates

The 5 non-technical-path categories (Business & Freelancing, Entrepreneurship, Productivity) and standalone electives issue **Course Certificates only** — there is no "path" wrapping them, per `categories.md`'s note that these are standalone tracks. Same passing-score and project-submission rules apply at the course level.

## What This Document Does NOT Do

It does not modify `apps/api`'s `Certificate` model, does not create seed data, and does not implement issuance logic — those are explicitly out of scope for Phase 24 per this phase's own constraints. This document is the content-side specification an eventual implementation phase would build against.
