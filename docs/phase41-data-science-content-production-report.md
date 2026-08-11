# Phase 41 — Data Scientist Learning Path Production Report

**Date:** 2026-08-11. **Scope:** execute Phase 35's Data Scientist recommendation — the last of the original 6 named learning paths — building only the real, remaining content gap, creating the `data-scientist` `LearningPath`, and verifying the full journey live against the running API. No schema changes, no certificate-rule changes, no business-logic changes. Executed autonomously end-to-end per this phase's explicit execution mode, with no intermediate approval stops.

---

## 1. What existed before Phase 41

Directly queried before writing anything:

- **Courses (real, production):** 11 — Prompt Engineering, AI Foundations, UI/UX Design Foundations, Full-Stack Web Development with Next.js, Computer Networking Foundations, DevOps Foundations (Phases 25–34), Programming Foundations (Phase 36), Database Design & SQL Mastery (Phase 37), Cloud Computing Foundations (Phase 39), Cyber Security Fundamentals (Phase 40).
- **Learning Paths (real, production):** 7 — `prompt-engineer`, `frontend-web`, `devops-engineer`, `backend-engineer`, `full-stack-engineer`, `cloud-engineer`, `cyber-security-analyst`. No `data-scientist` path existed.
- Baseline record counts (direct query, immediately before this phase's seed):
  `{"courseCount":45,"moduleCount":69,"lessonCount":195,"quizCount":44,"questionCount":220,"projectCount":31,"pathCount":7,"pathCourseCount":24}`

## 2. Skill gap analysis and why only 1 course was needed

Per `docs/content-library/phase35-learning-path-master-blueprint.md` Section 6, Data Scientist was flagged as "the path with the largest genuine gap — 0 courses currently reusable in full" at the time Phase 35 was written, needing 3 mandatory new courses + 1 elective: Programming Foundations (new), Database Design & SQL Mastery (new), Data Science Foundations: From Data to Decisions (new), plus a non-mandatory Machine Learning Foundations elective.

Direct inspection before writing anything confirmed 2 of those 3 "new" courses had already been built — for other paths — in the phases since Phase 35 was written: Programming Foundations (Phase 36) and Database Design & SQL Mastery (Phase 37). That left exactly one genuinely new course: **Data Science Foundations: From Data to Decisions**.

Coverage was checked, topic by topic, against the full skill checklist this phase's instructions specified:

| Skill area | Where covered | Real gap? |
|---|---|---|
| Python/data-oriented programming, problem solving, data structures | Programming Foundations (Phase 36) | None — reused |
| SQL / data querying (SELECT/WHERE/JOIN) | Database Design & SQL Mastery (Phase 37) | None — reused |
| SQL aggregation (GROUP BY / aggregate functions) | — (confirmed absent from Database Design & SQL Mastery's real Module 1 by direct query) | **Real gap** — covered in this course's new "SQL for Analysts" lesson |
| Data cleaning, exploratory data analysis | — | **Real gap** |
| Statistics, probability, distributions, sampling | — | **Real gap** |
| Correlation, regression fundamentals | — | **Real gap** |
| Hypothesis testing, A/B testing | — | **Real gap** |
| Data visualization, storytelling | — | **Real gap** |
| Feature engineering, ML fundamentals, train/validation/test, overfitting/underfitting, metrics | — (AI Foundations directly re-checked and confirmed to cover search/planning/agents/ethics only, zero overlap) | **Real gap, deliberately scoped lightly — see Section 2.1** |
| Responsible AI / data ethics | — (AI Foundations' bias/fairness lesson covers an adjacent but different discipline, per Phase 35's own note, re-confirmed) | **Real gap** |
| Communicating findings, practical workflow, portfolio/capstone reasoning | — | **Real gap** |

### 2.1 A real scope decision, documented not silent

`docs/content-library/courses.md`'s own blueprint entry for Data Science Foundations lists 4 modules with no predictive-modeling content at all, deferring that entirely to the separate, non-mandatory "Machine Learning Foundations" elective. But Phase 35's own Section 6 states this path's Advanced/Capstone project tiers "assume at least introductory ML," and this phase's own explicit objective requires the path to be "sufficient for a visitor starting from it, covering necessary skills logically start to finish" — which the literal 4-module blueprint doesn't fully satisfy on its own, since the mandatory path would otherwise end with zero predictive-modeling content.

**Resolution:** this course adds a 5th module, "Introduction to Predictive Modeling & Responsible Data Science," covering only the light, introductory concepts this path's own projects require (train/test split, overfitting, classification basics, precision/recall, responsible data science) — explicitly **not** the deeper, multi-algorithm-family content a future Machine Learning Foundations course would cover (multiple regression/classification algorithm families, ensembles, unsupervised learning, ML systems and pipelines). This keeps the mandatory path self-contained and coherent without duplicating or substituting for that still-unbuilt elective.

## 3. What was reused

| Course | Built | Position in path |
|---|---|---|
| Programming Foundations: Problem Solving with Python & JavaScript | Phase 36 | 1 |
| Database Design & SQL Mastery | Phase 37 | 2 |

No modules, lessons, quizzes, or projects were added to either course.

## 4. What was newly created

### 4.1 Course: Data Science Foundations: From Data to Decisions (`data-science-foundations-from-data-to-decisions`)

Per `docs/content-library/courses.md` entry #5 (extended with the 5th module per Section 2.1's documented decision). Category: `data-science` (new `Category` row). Instructor: the `e2e.instructor@phoenix.test` fixture, same convention as every prior new-course phase.

**5 modules, 18 lessons (13 content + 5 quiz), 5 quizzes, 25 questions, 2 projects:**

| Module | Real content | Explicitly avoids duplicating |
|---|---|---|
| 1. Data Collection, Cleaning & SQL for Analysts | The real data science workflow, honest data cleaning (missing values, duplicates, formatting, outliers), analyst-specific SQL (GROUP BY, aggregates) | **Database Design & SQL Mastery's SELECT/WHERE/JOIN content — confirmed absent by direct query, explicitly assumed as prerequisite** |
| 2. Statistics & Probability for Data Analysis | Descriptive statistics, probability/distributions/sampling, correlation and simple linear regression | — |
| 3. Hypothesis Testing & Experimentation | Hypothesis testing/p-values, A/B test design and analysis | — |
| 4. Data Visualization & Storytelling | Honest chart-type selection and design, plain-language communication | — |
| 5. Introduction to Predictive Modeling & Responsible Data Science | Train/test split, overfitting, classification and evaluation metrics (precision/recall), responsible data science (bias, fairness) | **Deliberately lighter than a full Machine Learning Foundations course would cover — see Section 2.1** |

All 25 questions are unique across all 5 quizzes — no repeated prompt, format, or phrasing (verified by direct duplicate-prompt scan, Section 5). Questions vary across conceptual, scenario-based, practical, terminology, reasoning, and interpretation types per this phase's explicit requirement.

**2 standalone projects** (matching this session's established "quality over quantity" precedent over the blueprint's literal "4 projects" planning figure), both requiring genuine analytical work, not "explain what you learned":
- **Exploratory Data Analysis & Findings Report** (Beginner/Intermediate) — a real data-cleaning plan for 4 described real dataset problems, descriptive-statistics reasoning, a correlation investigation with correct causal-inference limits, an honest visualization choice, and a plain-language report with an explicit limitation.
- **End-to-End Data Product: From Raw Data to a Business Recommendation** (Capstone) — a full workflow walkthrough for a described A/B test and churn-prediction scenario: hypothesis-test interpretation with random-assignment verification, train/test and overfitting reasoning, a justified precision/recall tradeoff decision grounded in real business cost, a specific bias-source identification with a concrete check, and an honest, appropriately-hedged business recommendation.

**Why this course is necessary for Data Scientist:** per Phase 35's own analysis, this was the path with the largest genuine gap of all 6 — none of the platform's existing courses, including AI Foundations (re-confirmed to cover search/planning/agents/ethics only), teach statistics, data cleaning, hypothesis testing, or classical ML concepts.

**Skills covered:** the real data science workflow, data cleaning, analyst SQL (aggregation), descriptive statistics, probability/distributions/sampling, correlation and regression, hypothesis testing, A/B testing, honest data visualization, plain-language communication of findings, introductory predictive modeling (train/test, overfitting, classification metrics), and responsible data science (bias and fairness).

### 4.2 Learning Path: Data Scientist (`data-scientist`)

No existing path was a real fit — confirmed by direct query before writing anything: none of the 7 existing paths contain this exact 3-course combination.

3 courses linked in the blueprint's specified sequence: Programming Foundations (1) → Database Design & SQL Mastery (2) → Data Science Foundations (3). The Machine Learning Foundations elective (explicitly not mandatory per the blueprint) was not linked as a required path course and remains unbuilt.

**This completes all 6 of the originally-named learning paths from Phase 35's scope** (Frontend Engineer, Backend Engineer, Full Stack Engineer, Cloud Engineer, Cyber Security Analyst, Data Scientist).

## 5. New verified resources

| Resource | Status | Used for |
|---|---|---|
| NumPy Documentation (`numpy.org/doc/stable/`) | 🟢 **New, live-verified this phase** | Referenced as the standard numerical-computing library underlying this course's data-manipulation concepts |
| pandas Documentation (`pandas.pydata.org/docs/`) | 🟢 **New, live-verified this phase** | Module 1, Lessons 1 and 3 |
| Python "statistics" module documentation (`docs.python.org/3/library/statistics.html`) | 🟢 **New, live-verified this phase** | Module 2, Lessons 1 and 3 |
| Seeing Theory (Brown University, `seeing-theory.brown.edu`) | 🟢 **New, live-verified this phase** | Module 2, Lesson 2; Module 3, Lesson 1 |
| "Fundamentals of Data Visualization" (Claus Wilke, free online, `clauswilke.com/dataviz/`) | 🟢 **New, live-verified this phase** | Module 4, Lesson 1 |
| scikit-learn Documentation (`scikit-learn.org/stable/`) | 🟢 **New, live-verified this phase** | Module 5, Lessons 1 and 3 |

6 new resources, all official (library/project documentation) or well-known, real, freely-available educational sources. No book, video, ISBN, or fabricated URL was used. One candidate resource (Matplotlib documentation, `matplotlib.org`) returned HTTP 403 (bot-blocked) on WebFetch and was correctly **not** cited as verified — the course instead cites the already-verified pandas and NumPy documentation plus the Wilke visualization book, all of which were successfully confirmed.

## 6. Database results

**Seed run 1** (`npx ts-node --transpile-only apps/api/prisma/seed-phase41-content.ts`):
```
Created course: Data Science Foundations: From Data to Decisions (data-science-foundations-from-data-to-decisions)
5 modules created, 18 lessons created, 5 quizzes created, 25 quiz questions created,
2 projects created (0 already existed), 1 learning path created, 3 path memberships created.
```

**Seed run 2** (idempotency check): `0 modules created, 0 lessons created, 0 quizzes created, 0 quiz questions created, 0 projects created (2 already existed), 0 learning path created, 0 path memberships created` — course, modules, projects, path, and memberships all reported "already exists, skipping." **Confirmed idempotent.**

**Record count comparison (direct query, before → after):**

| Field | Before | After | Δ | Matches design |
|---|---|---|---|---|
| courses | 45 | 46 | +1 | ✅ |
| modules | 69 | 74 | +5 | ✅ |
| lessons | 195 | 213 | +18 | ✅ |
| quizzes | 44 | 49 | +5 | ✅ |
| questions | 220 | 245 | +25 | ✅ |
| projects | 31 | 33 | +2 | ✅ |
| paths | 7 | 8 | +1 | ✅ |
| pathCourses | 24 | 27 | +3 | ✅ |

**Direct duplicate scan** (module titles, lesson titles scoped per module, quiz titles, question prompts scoped per quiz, project titles scoped per course, course slugs/titles platform-wide, learning-path slugs platform-wide, path-course membership pairs) — **zero duplicates found at every level.**

## 7. Cross-contamination check — all prior seeds re-run

Re-ran `seed-phase25`, `26`, `27`, `30`, `31`, `32`, `33`, `34`, `36`, `37`, `38`, `39`, `40` (in that order) after Phase 41's seed. Every one reported 0 new records created. Post-re-run record counts re-checked and found identical to the post-Phase-41 snapshot above. **Zero cross-contamination.**

## 8. Real learner journey (live API, no mocks)

Executed via direct HTTP calls against the real running backend, using a **freshly registered learner account** (`phase41.learner@phoenix.test`) for a genuine from-zero journey, split across 2 batches to respect the documented 10-quiz-submission/15-minute-per-user rate limit (discovered Phase 40).

1. **Register/Login** as the new learner — succeeded.
2. **Opened the Data Scientist learning path** — confirmed all 3 courses present, in the correct sequence.
3–6. **Opened each course, its modules, and its lessons in order** — confirmed real content for all 3 courses.
7. **Enrolled in course 1 (Programming Foundations)** and completed all its lessons.
8. **Deliberately wrong answers** on Programming Foundations' Module 1 quiz — `scorePercent: 0`, `passed: false`. Re-checked course progress: completion stayed at 19%, confirming **a failed attempt does not falsely raise completion.**
9. **Correct answers on all quizzes across all 3 courses** — each scored 100%, `passed: true`.
10. **Confirmed 100% completion and a brand-new certificate** for each course: Programming Foundations (`CERT-AF5508A8B0FA`), Database Design & SQL Mastery (`CERT-92735E198EA0`), Data Science Foundations (`CERT-AD2CC0AF668D`).
11. **Confirmed all 3 certificates exist, one per course, zero duplicates.**
12. **Re-triggered completion** on Data Science Foundations (resubmitted its already-passed final quiz) and re-checked certificates — **still exactly 1 certificate** for that course. **Confirmed: no duplicate certificate on re-trigger.**
13. **Opened the Data Science Foundations project list** — confirmed both real projects.
14. **Real project submission** on the capstone ("End-to-End Data Product") — a real, specific analysis covering hypothesis-test interpretation, train/test and overfitting reasoning, a justified precision/recall decision, a specific bias check, and an honest business recommendation.
15. **Learner self-evaluation attempt** — **`403 FORBIDDEN`, "Not authorized to modify this resource."** Confirmed blocked.
16. **Instructor login and evaluation** — `scorePercent: 94`, `passed: true`, real, specific written feedback (including a genuine, specific suggestion to make one check more quantitatively concrete).
17. **Confirmed the evaluation persisted and is re-readable** — a later `GET /projects/submissions/:id` (by the learner) returned `status: "evaluated"` with the exact score/passed/feedback from the instructor's evaluation.

**Course-to-course transition across all 3 courses confirmed working.**

### A real, transient error diagnosed during the journey (not a reproducible bug)

One quiz submission (Programming Foundations Module 3) returned a real `500 INTERNAL_SERVER_ERROR` mid-journey. Diagnosed per this phase's autonomous-fix rules: the backend server process itself remained healthy (`GET /settings/public` continued returning 200 throughout), and an immediate retry of the exact same request succeeded cleanly with the correct 100% score. This is consistent with the same class of transient Neon serverless-database blip encountered earlier in this same phase during initial DB inspection (a `PrismaClientInitializationError: Can't reach database server`, which also resolved on retry after a brief TCP-level wake-up delay) — not a reproducible defect in this phase's content or in the quiz-scoring logic. No code change was made, since the issue did not reproduce.

## 9. Test/build results — all actually run

- **Backend tests:** `npm run test` in `apps/api` → **28 suites, 241/241 tests passing.** Unchanged from Phase 40 (no backend logic touched this phase).
- **Backend tsc:** `npm run type-check` → clean, no errors.
- **Backend lint:** `npm run lint` → clean, no errors.
- **Backend build:** `npm run build` → clean, `dist/main.js` produced (stale `tsconfig.tsbuildinfo` cleared preemptively per the documented Phase 37 workaround).
- **Frontend tsc:** `npm run type-check` in `apps/web` → clean, no errors.
- **Frontend lint:** `npm run lint` → clean, "No ESLint warnings or errors."
- **Frontend build:** `npm run build` → clean, all routes built successfully (background execution due to length; full output read to completion, not assumed from the timeout).

## 10. Real remaining limitations

- The two architecture gaps documented in Phase 35 remain open, unaffected by this phase: `Certificate` has no `learningPathId` (a learner completing all 3 Data Scientist courses receives 3 separate course certificates, not one path-level certificate); `Project` has no `learningPathId` (no path-level capstone mechanism exists). Not touched this phase, per the explicit instruction not to change architecture unless directly necessary for this phase's own goal — it was not.
- The Machine Learning Foundations elective (explicitly optional per Phase 35's blueprint) was not built — this course's own Module 5 deliberately provides only the light, introductory predictive-modeling content this path's mandatory projects require, not a substitute for that deeper, separate course.
- Matplotlib documentation could not be live-verified (HTTP 403, bot-blocked) and was correctly not cited as a confirmed source.

## 11. What's next

**This phase completes all 6 of the originally-named learning paths from Phase 35's scope.** No named path from that original scope remains unbuilt. Any further learning-path work (e.g. a Machine Learning Foundations elective, or paths beyond Phase 35's original 6) would be a new, separate scope decision for the project owner, not an automatic continuation.

## 12. Explicitly not started

**Phase 42 was not started.** Per this phase's own scope, Phase 41 stops here after full completion, with no blocker encountered requiring project-owner input.

---

**Files created:** `apps/api/prisma/seed-phase41-content.ts`, this report, `docs/restore-point-phase41.md`.
**Files updated:** `docs/project-status.md`, `docs/known-issues.md`, `docs/next-session.md`, `docs/documentation-index.md`, `docs/content-library/phase27-content-inventory.md`, `docs/content-library/resource-verification-report.md`.
**Temporary files created and deleted after use:** `apps/api/inspect41.js`, `apps/api/count_records41.js`, `apps/api/dupe_check41.js`, `apps/api/journey41.js`, `apps/api/get_quiz3_p41.js`, `apps/api/get_last_quiz41.js`.
