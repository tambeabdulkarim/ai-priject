# Phoenix Content Library — Quality Standards

**Status:** Master blueprint, Phase 24. The standing rubric every piece of content in `docs/content-library/` (present and future) is held to. This document is normative — if a future course/lesson/project doesn't meet a rule here, it doesn't ship, regardless of how much work went into it.

## 1. No Fabricated Facts

- Never state a specific external fact (an ISBN, a live URL, a statistic, an exam passing rate at a real institution) with confidence the author doesn't actually have. `books.md` and `videos.md` demonstrate the required pattern: real, well-known sources cited with an explicit confidence flag (🟢/🟡), never a fabricated specific (an invented ISBN, an invented video URL).
- Every external link — book, video, documentation — gets a **live-check pass immediately before publish**, not just at authoring time. Links rot; a link verified 6 months ago is not verified today.
- If a category doesn't have a high-confidence real resource yet (e.g. `books.md`'s Business & Freelancing entry), leave it explicitly marked incomplete rather than fill it with a plausible-sounding guess. An honest gap is recoverable; a fabricated citation that gets caught later damages trust in the whole library.

## 2. No Placeholder or Filler Content

- No Lorem Ipsum, ever, anywhere in this folder or anything imported from it.
- Every lesson has a real, specific objective a learner can self-check ("Explain X," "Build Y," not "Learn about X").
- Every project has a stated real-world scenario and an explicit evaluation focus — "build a to-do app" is not sufficient; "build a to-do app, evaluated on X and Y" is the minimum bar.
- Content that isn't ready yet is marked as a scoped future item in `content-roadmap.md`, never shipped as a thin stand-in.

## 3. Duplication Prevention

- Before adding a new course, check `courses.md`'s existing 18 flagship courses and the Future Course Backlog for topic overlap.
- Where two categories legitimately share a subtopic (e.g. cloud security appears in both Cyber Security and Cloud Computing), each course must cover it from its own category's lens, and the shared/subset relationship must be explicitly noted in `learning-paths.md`'s stage tables (see the `*(subset)*` annotations already used there) — never silently duplicated in full.
- Before adding a new project, check `projects.md` for scenario overlap; surface-level similarity (e.g. two "CRUD app" projects) is acceptable only when the evaluation focus and stack scope genuinely differ, and that difference must be stated explicitly.
- Run this same check for books and videos — a resource may legitimately serve more than one category (see `videos.md`'s freeCodeCamp/StatQuest note), but must not be listed as if it were category-exclusive when it isn't.

## 4. Logical Progression & Consistent Difficulty

- Every course lists its entry prerequisites explicitly (`courses.md`) and every path sequences its stages so no course assumes knowledge from a later stage (`categories.md`'s Category Dependency Map is the source of truth for this).
- Difficulty labels (Beginner / Intermediate / Advanced) are used consistently: **Beginner** = no prior knowledge in that specific subject assumed; **Intermediate** = assumes the stated prerequisite course(s) are complete; **Advanced** = assumes at least one Intermediate course in the same subject cluster is complete. A course's difficulty label must match what its stated prerequisites actually justify — not aspirational, not diluted.
- Path-level projects escalate in scope and ambiguity from Beginner (fully scoped) to Professional Capstone (real-world ambiguity, learner makes more of the design decisions) — checked explicitly for every path in `projects.md`.

## 5. Passing Scores & Certification Integrity

- 75% is the standard passing score for every graded exam in this library (`certificates.md`) — chosen because it reflects genuine competence while tolerating normal learning variance (a lower bar risks certifying unready learners; a much higher bar penalizes minor, non-critical mistakes). Any course that needs a different threshold (e.g. a security course where a missed vulnerability is a genuine safety issue) must justify the deviation explicitly in that course's own spec, not change the number silently.
- No certificate — course or path — is issued without an independently checkable requirement being met (submitted-and-passed project, scored exam). Time spent or content viewed is never sufficient alone.

## 6. Professional Organization

- Every file in `docs/content-library/` cross-references the others by exact filename (e.g. `courses.md` referencing `projects.md`), never by vague description — this is how the duplication and consistency checks above are actually auditable.
- Tone throughout: direct, specific, no marketing language ("industry-leading," "revolutionary," "cutting-edge" are banned words in this library — say what the course actually teaches and let that speak for itself).
- Every category, course, and path states its prerequisites and outcomes in checkable, learner-facing language — never internal jargon the learner hasn't been taught yet.

## 7. Accessibility & Inclusivity Baseline

- Video content must have (or get) captions before publish — not optional, a baseline requirement carried over from this project's own platform accessibility standards.
- Written lesson content avoids unnecessary jargon and defines any term the first time it's used.
- Project scenarios are chosen to be broadly relevant (not assuming a specific country's business/legal context) except where a category is inherently jurisdiction-specific (e.g. Freelancing's invoicing/taxes module explicitly notes it covers general principles, not jurisdiction-specific legal/tax advice — see `categories.md`).

## 8. Review Process (before any content is imported into Phoenix)

1. **Content review** — a subject-matter reviewer checks technical accuracy.
2. **Link verification pass** — every external reference live-checked (Section 1).
3. **Rubric check against this document** — sections 1–7 above, checked explicitly, not assumed.
4. **Learner pilot** (recommended, not blocking for v1) — a small group completes the course/lesson before general release, feedback incorporated.

Only after all four does content move from `docs/content-library/` (this blueprint) into Phoenix's real database via a future, separate implementation phase — explicitly not this one.
