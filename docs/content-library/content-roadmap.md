# Phoenix Content Library — Content Roadmap

**Status:** Master blueprint, Phase 24. This document sequences the work still needed to take the architecture in this folder (categories, paths, course/module structure, project specs, certificate policy, curated resource lists) to fully-authored, published, database-imported content. Nothing below has been executed yet — it is the plan, not the work.

## Why a phased rollout, not "author everything at once"

The architecture defines ~575 lessons across 18 flagship courses, 36 path-level projects, and a resource library needing a full bibliographic/link verification pass. Attempting all of it at once produces either an impossibly long timeline or shallow, filler-quality content — the opposite of this phase's "no placeholder text, no Lorem Ipsum" constraint. Phasing by real learner demand and dependency order is both more honest and more likely to ship anything usable.

## Phase C0 — Verification Pass (before any content goes live)

Prerequisite to everything else. Live-check every link in `documentation-links.md` (20 root domains), confirm or replace every 🟡-flagged entry in `books.md` and `videos.md`, and confirm current ISBNs/editions for every 🟢 book. **Estimated effort:** 1–2 weeks for one content operations person.

## Phase C1 — Foundation Courses (highest-leverage, unlocks the most paths)

Full lesson-level authoring (per `lessons.md`'s template) for the courses every path depends on:
1. Programming Foundations (feeds all 9 paths)
2. Database Design & SQL Mastery (feeds 5 paths)
3. Computer Networking Foundations (feeds 4 paths)

**Rationale:** these three courses appear in the most learning paths — finishing them unlocks partial progress on every path simultaneously, rather than completing one path end-to-end while learners in other paths wait. **Estimated effort:** 6–8 weeks per course for a small content team (writer + technical reviewer + video producer), courses can run in parallel.

## Phase C2 — Fastest-Value Path: Prompt Engineer

The shortest path in the library (6–8 weeks learner-time) and the one most aligned with current market demand. Complete lesson authoring for AI Foundations (LLM-focused modules) and Prompt Engineering, finishing the first fully-authored, fully-certifiable path end-to-end. **Estimated effort:** 8–10 weeks.

## Phase C3 — Web Development Cluster

Full-Stack Web Development with Next.js, UI/UX Design Foundations — unlocking Frontend Engineer and most of Full Stack Engineer. Chosen next for market breadth (web development remains the highest-volume entry category for career-changers). **Estimated effort:** 10–14 weeks (this is the largest single course in the library at 110 hours/72 lessons).

## Phase C4 — Cloud/DevOps Cluster

Cloud Computing Foundations, DevOps Foundations — unlocking Cloud Engineer and DevOps Engineer, and completing Backend Engineer and Full Stack Engineer's remaining stages. **Estimated effort:** 12–16 weeks (two large, hands-on-lab-heavy courses).

## Phase C5 — Data/AI Cluster

Data Science Foundations, Machine Learning Foundations, Deep Learning Foundations — completing Data Scientist and AI Engineer. Sequenced after C2 (Prompt Engineering) deliberately, since Prompt Engineering is faster to ship and validate the AI-content production process on before committing to the much larger ML/Deep Learning courses. **Estimated effort:** 16–20 weeks.

## Phase C6 — Security Cluster

Cyber Security Fundamentals — completing Cyber Security Analyst. Sequenced after Networking (C1) and Cloud (C4) since it depends on both. **Estimated effort:** 8–10 weeks.

## Phase C7 — Remaining Standalone Categories

Mobile App Development, Freelancing, Entrepreneurship, Productivity, Career Preparation — smaller courses, no path dependencies blocking other work, can be produced opportunistically alongside any other phase. **Estimated effort:** 2–6 weeks each.

## Phase C8 — Future Course Backlog

The 18 named-but-not-yet-speced second-tier courses listed at the end of `courses.md` — scoped only after Phase C1–C7 validate real learner demand for deeper content in each category, not speculatively built first.

## Cross-Cutting, Ongoing (not a phase, a standing practice)

- Re-run the Phase C0 link-verification pass before every subsequent phase's content goes live, not just once.
- Every completed lesson/course/project gets reviewed against `quality-standards.md` before publish, not after.
- No phase above touches `apps/api` or `apps/web` code or database schema — importing this content into Phoenix's real `Course`/`Lesson`/`Module` tables is its own future implementation phase, deliberately not started here (per this phase's explicit constraint: no seed files, no application code).

## Total Estimated Timeline

Phases C0–C7, run with reasonable parallelism across a small content team: **roughly 12–15 months** to a fully-authored library across all 9 paths and 18 categories. Phase C2 alone (first fully shippable path) is achievable in **~10–12 weeks** from a standing start — the recommended first real milestone to target, not "finish everything before shipping anything."
