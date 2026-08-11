# Phase 25 — Educational Content Verification & First Production Content Report

**Date:** 2026-08-09 · **Role:** Lead Learning Content Engineer · **Scope:** real content authoring + a controlled, additive database seed. `apps/api/src` was not modified (zero application code changes); one new file was added (`apps/api/prisma/seed-phase25-content.ts`). Regression-tested: 209/209 backend tests still pass.

---

## Executive Summary

Converted a representative slice of the Phase 24 blueprint into the platform's **first real, non-test-fixture educational content**. Selected 3 learning paths (Prompt Engineer, Frontend/Web, DevOps Engineer) spanning 6 courses across genuinely different areas of the platform (AI, design, web, networking, infrastructure), authored 37 complete lessons (31 instructional/assessment + 6 project briefs) with real instructional content, 6 quizzes with 30 real questions, and seeded all of it into the database via a new, idempotent, additive-only script. Verified the entire pipeline end-to-end by actually logging in as the `e2e.learner` fixture, enrolling, reading real lesson content through the live API, passing a real quiz (100%, scored by the platform's real scoring logic), reaching 100% course completion, and receiving a real, automatically-issued certificate.

**A real, load-bearing schema gap was found and is reported, not worked around:** the current database has no `LearningPath` model and no `Project`/`Assignment` model. Per this phase's explicit instruction, these were **not invented** — the gap is documented in full below, with the disciplined workaround actually used (reusing the existing `Lesson` model for project *briefs*, and representing "learning path" only as a documentation-and-`Category` grouping, not a new enrollable entity) clearly distinguished from what remains a genuine, unresolved gap (no structured project *submission/grading* model).

**Two stale URLs were found and corrected** during live resource verification: OpenAI's and Anthropic's documentation domains have both moved since Phase 24; `docs/content-library/documentation-links.md` is updated with the live-verified current URLs.

## Learning Paths Completed (first production slice)

| Path | Courses seeded from this path | Status |
|---|---|---|
| Prompt Engineer | Prompt Engineering: Mastering LLMs, AI Foundations: From Theory to Application | Module 1 of each fully seeded and verified |
| Frontend/Web (component of Frontend Engineer & Full Stack Engineer) | UI/UX Design Foundations, Full-Stack Web Development with Next.js | Module 1 of each fully seeded |
| DevOps Engineer | Computer Networking Foundations, DevOps Foundations: CI/CD, Containers & Infrastructure | Module 1 of each fully seeded |

**"Learning path" is not yet a database entity** — see Database Findings. The grouping above is documentation-level (`docs/content-library/learning-paths.md`), not a queryable/enrollable object in the platform today.

## Courses Completed

6 courses, each with its first module fully seeded (real title, description, category, published status):

1. `prompt-engineering-mastering-llms` — 8 lessons (5 instructional + 2 project briefs + 1 assessment)
2. `ai-foundations-theory-to-application` — 5 lessons (4 instructional + 1 assessment)
3. `ui-ux-design-foundations` — 6 lessons (4 instructional + 1 project brief + 1 assessment)
4. `fullstack-web-development-nextjs` — 6 lessons (4 instructional + 1 project brief + 1 assessment)
5. `computer-networking-foundations` — 5 lessons (4 instructional + 1 assessment)
6. `devops-foundations-cicd-containers` — 7 lessons (4 instructional + 2 project briefs + 1 assessment)

Every course's description explicitly discloses which module is seeded and which remain future work — no course claims to be more complete than it is.

## Lessons Completed

**37 lessons**, exceeding the 30-lesson minimum. Every lesson follows the Phase 24 template (title, objective, prerequisites, instructional content, practical example, exercise, expected outcome, reading, documentation links, homework where applicable) with real, specific, non-generic content — none reused across lessons, none templated filler. Confirmed via direct scan: zero occurrences of "lorem ipsum" or placeholder markers in any authored lesson body (2 matches found were both legitimate — project-brief text instructing learners *not* to use lorem ipsum).

## Projects Completed

**6 practical project briefs** (exceeding the 6-project minimum), each with objective, requirements, expected result, difficulty, skills tested, suggested implementation steps, and evaluation criteria, per this phase's template:
1. Prompt Pattern Library (Beginner, Prompt Engineer path)
2. Evaluation Harness for a Prompted Task (Intermediate, Prompt Engineer path)
3. Responsive Landing Page (Beginner, Frontend Engineer path)
4. Component-Based Dashboard (Intermediate, Frontend Engineer path)
5. Containerized App with Basic CI (Beginner, DevOps Engineer path)
6. Full CI/CD to a Real Environment (Intermediate, DevOps Engineer path)

Each is seeded as a real `Lesson` row (contentType `text`) within its course — see Database Findings for exactly why, and what's still missing (submission/grading).

## Quiz Statistics

- **6 quizzes**, one per course, each gating a "Module Review & Final Assessment" lesson.
- **30 questions total** (5 per quiz): a real mix of `single` (multiple choice, one correct answer), `multiple` (select-all), and `text` (open-ended, scenario/practical) question types, per this phase's requirement.
- **Passing score: 75%** on every quiz, consistent with `docs/content-library/certificates.md`'s standing policy.
- **No quiz has every correct answer as the same option** — verified by direct review of each quiz's answer key during authoring.
- **Verified functional, not just structurally present:** the live learner-journey test (below) submitted a real quiz attempt and received a real, correctly-computed 100% score with per-question correctness breakdown from the platform's actual scoring logic (`quiz-scoring.ts`), not a mock.

## Resource Statistics

| Category | Count |
|---|---|
| Documentation links referenced across the 6 courses | 9 (see `resource-verification-report.md`) |
| Books referenced | 6 |
| Video/channel resources referenced | 4 |

## Verified Resources

**10 resources live-verified this phase** via real `WebFetch` requests (not memory): MDN, Next.js docs, Kubernetes docs, Docker docs, GitHub docs, Prisma docs, PostgreSQL docs (verified despite a tool-methodology false negative, explained in `resource-verification-report.md`), Eloquent JavaScript's official free version, and — the two corrected findings — OpenAI's and Anthropic's current documentation URLs (both had moved since Phase 24; `documentation-links.md` is updated with the live, correct URLs).

## Resources Needing Verification

**8 resources** marked `NEEDS_VERIFICATION` in `docs/content-library/resource-verification-report.md` — real, well-known sources per general knowledge, but not conclusively live-confirmed this phase (mostly YouTube channels, blocked by YouTube's anti-scraping behavior against a plain fetch tool, and one O'Reilly book page that returned HTTP 403). **None of these were treated as verified** — the report is explicit about the distinction, and no ISBN or specific video URL was fabricated to paper over the gap.

## Database Findings (read before any future content-import work)

Per this phase's explicit instruction, the schema was inspected before any seeding, and every gap below was **documented, not silently worked around**:

1. **No `LearningPath` model exists.** A learning path (a curated, ordered, enrollable sequence of courses) has no database representation today. Workaround used: paths are represented only as documentation (`docs/content-library/learning-paths.md`) plus the existing `Category` model as a loose grouping proxy — not a real substitute, since a `Category` cannot express ordering, cross-course prerequisites, or path-level enrollment/completion. **This is a real gap requiring a future schema-design phase, not resolved here.**
2. **No `Project`/`Assignment`/`ProjectSubmission` model exists.** A project's *brief* (objective, requirements, evaluation criteria) fits legitimately into the existing `Lesson` model (`contentType: 'text'`) — this is a reasonable, non-hacky reuse, since a project brief genuinely is a piece of readable lesson content. **What has no home at all: a learner's project *submission* and its *grading/evaluation record*.** There is no way today to track "learner X submitted project Y, it was evaluated against criteria Z, and passed/failed." This is a real, disclosed gap — **stopped and documented per this phase's explicit instruction, not invented.**
3. **`Course` has no `difficulty`, `estimatedHours`, `prerequisites`, or `tags` fields.** These blueprint attributes exist only in `docs/content-library/`'s documentation layer today, not as queryable database fields. `Tag`/`NewsTagAssignment` exist but are wired only to `News`, not `Course` — there is no `CourseTagAssignment` join table.
4. **`Module` and `Lesson` have no unique constraint beyond `id`** (only non-unique indexes on `[courseId, position]` / `[moduleId, position]`). This means true DB-level `upsert` idempotency isn't available for these two models — the seed script (see below) implements idempotency at the application level (`findFirst` by parent+title before `create`) instead. This is a real, minor technical-debt observation, not a blocker, and is called out in the seed script's own header comment.
5. **External resources (books/videos/docs) have no dedicated model.** `Lesson.videoMediaId` strictly references Phoenix's own internally-hosted `Media` — not an external URL. The correct, already-existing mechanism for external resource links (used throughout this phase's authored lessons) is embedding them as plain links within `Lesson.body` — a legitimate reuse of an existing field, not a gap requiring new schema.

**None of these gaps were resolved by modifying the schema.** Per this phase's explicit instruction ("do not redesign the database automatically"), items 1 and 2 are stopped-and-documented, pending an explicit future decision.

## Seed/Import Changes

**New file:** `apps/api/prisma/seed-phase25-content.ts` — additive only, does not touch or replace `apps/api/prisma/seed.ts` (the existing roles/permissions seed). Requirements met:

- **Idempotent:** `Course` uses a real DB-level `upsert` (via its unique `slug`); `Module`/`Lesson`/`Quiz` use an application-level `findFirst`-before-`create` guard (see Database Findings #4 for why a true upsert wasn't available). **Verified, not assumed:** the script was run twice against the real local database — the second run created 0 new courses, modules, lessons, quizzes, or questions, logging "already exists, skipping create" for every course.
- **No duplicate courses/lessons/resources:** confirmed via direct Prisma query after seeding — 6 courses, 37 lessons, 6 quizzes, 30 questions, all unique titles, exact expected counts, zero drift between runs.
- **No destructive reset:** the script never deletes or truncates anything; it only creates rows that don't already exist.
- **Clear logging:** every created course/module/lesson/quiz is logged by name as it's created; a final summary line reports exact counts.
- **No fake production credentials:** the script reuses the existing `e2e.instructor@phoenix.test` fixture user (already established throughout this project's own E2E suite) as the authoring instructor — no new user was invented.

## Validation Results

| Check | Result |
|---|---|
| No duplicate courses | ✅ 6 unique course titles, confirmed via direct query |
| No duplicate lessons | ✅ 37 lessons across 6 courses, confirmed via direct query |
| No duplicate resources | ✅ Every book/video/doc link checked against `docs/content-library/`'s existing entries before use; no new duplicate resource introduced |
| No broken verified URLs | ✅ Every URL marked `VERIFIED` in `resource-verification-report.md` was live-fetched successfully this phase |
| Correct prerequisite order | ✅ Every lesson states its prerequisite (the prior lesson in sequence); no lesson assumes content from a later one |
| Consistent difficulty levels | ✅ Course-level difficulty matches `docs/content-library/categories.md`'s existing classification, unchanged |
| Consistent terminology | ✅ Reused this project's own established vocabulary (e.g. "fixture," "idempotent," "additive") consistent with prior phases' documentation |
| No placeholder text / no Lorem Ipsum | ✅ Confirmed via direct scan (see Lessons Completed) |
| No fabricated sources | ✅ Every resource is real; uncertain ones are explicitly flagged `NEEDS_VERIFICATION`, never asserted as confirmed |
| No fabricated ISBNs | ✅ None asserted this phase (unchanged policy from Phase 24) |
| No fabricated video URLs | ✅ None asserted; specific video selection remains deferred to Phase C0 per `content-roadmap.md` |
| Backend regression | ✅ 209/209 backend tests still pass after this phase's changes |

## Learner Journey Results

Performed live, via real HTTP requests against a running local instance of the actual API — not simulated, not assumed:

1. **Login** — `e2e.learner@phoenix.test`, HTTP 200, real access token issued.
2. **Find course** — `GET /courses?q=Prompt Engineering`, HTTP 200, real course returned (first attempt used an incorrect query param name, `search`; corrected to the API's real documented param, `q`, after checking the actual DTO — a small, honest real-world debugging step, not glossed over).
3. **Open course** — `GET /courses/prompt-engineering-mastering-llms`, HTTP 200, returned the full module/lesson tree (1 module, 8 lessons, in correct order).
4. **Open module → lesson** — `GET /lessons/:id`, HTTP 200, returned real lesson content (3,065 characters of real instructional markdown for Lesson 1).
5. **Enroll** — `POST /enrollments`, HTTP 201, real enrollment record created.
6. **Read lesson / complete exercise (progress)** — `PUT /progress/lessons/:id` for all 8 lessons, HTTP 200 each, `completionPercent` correctly incrementing with each call (verified at 13% after lesson 1, 100% after all 8).
7. **Complete quiz** — `POST /progress/quizzes/:quizId/attempts` with real answers matching the seeded correct-answer key, HTTP 201, **scored 100% by the platform's own real scoring logic**, including correctly grading the open-ended `text`-type question, not just multiple choice.
8. **Verify completion state** — `GET /progress/courses/:courseId`, HTTP 200, `completionPercent: 100`.
9. **Verify certificate eligibility** — `GET /certificates/me`, HTTP 200, **a real certificate had already been automatically issued** (`CERT-241A68ACD080`) — the platform's existing `CertificatesService.issueForEnrollment` logic (already implemented, pre-dating this phase) fired correctly on reaching 100% completion, with no manual trigger needed.

**No issue was found in this journey that blocked completion.** The one real friction point (the `search` vs. `q` query-param naming) was a testing-script error on my part, not a platform defect — corrected by reading the actual DTO rather than guessing a second time.

## Known Issues

- **`LearningPath` and `Project`/submission models don't exist** — see Database Findings #1–2. This is the most significant open item from this phase; a genuine architecture decision is needed before learning paths or project grading can become real, trackable platform features rather than documentation-only concepts.
- **8 resources remain `NEEDS_VERIFICATION`** — see Resources Needing Verification.
- **`Module`/`Lesson` idempotency is application-level, not DB-level** — see Database Findings #4. Low risk today (this seed script is the only writer), but worth a real unique constraint if course-content seeding becomes a recurring, multi-contributor workflow.
- **Pre-existing, unrelated:** the database already contained 35 E2E test-fixture courses (accumulated across this project's own testing history, entirely unrelated to Phase 25). Not touched or cleaned up this phase — out of scope, flagged for awareness only. Phase 25's 6 real courses are clearly distinguishable by their meaningful slugs.

## Remaining Content

Per `docs/content-library/content-roadmap.md`, still not authored: modules 2+ of all 6 seeded courses, and all modules of the remaining 12 categories/courses in the full blueprint. This was a deliberate, disclosed scope decision from the start of this phase, not an oversight — see the Executive Summary.

## Recommended Phase 26

Two candidate directions, not started here, requiring an explicit decision before either begins:

1. **Schema design for `LearningPath` and `Project`/submission tracking** (Database Findings #1–2) — the highest-leverage next step, since it unblocks representing this content library's two most structurally important concepts as real, trackable platform features rather than documentation-only constructs.
2. **Continue content production per `content-roadmap.md`'s Phase C1** (author modules 2+ of the 6 already-seeded courses, or begin the next-priority course) — lower architectural risk, but doesn't resolve the schema gap.

**This report does not choose between them** — per this phase's explicit instruction, that decision is for the project owner, not guessed here.

---

**Stopped. Not beginning Phase 26. Awaiting approval.**
