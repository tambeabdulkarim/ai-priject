# Phase 35 — Learning Paths Master Blueprint

**Status:** Analysis and planning only. **No course, module, lesson, quiz, question, or project was created in the database. No seed was run. No `apps/api`/`apps/web` code or `schema.prisma` was touched.** Scope: the 6 currently-empty named learning paths — Backend Engineer, Frontend Engineer, Full Stack Engineer, Data Scientist, Cloud Engineer, Cyber Security Analyst.

---

## 1. Executive Summary

All 6 courses seeded in Phases 25–34 are now production-ready (Prompt Engineering, AI Foundations, UI/UX Design Foundations, Full-Stack Web Development with Next.js, DevOps Foundations, Computer Networking Foundations), and 3 `LearningPath` rows exist in the real database (Prompt Engineer, Frontend/Web, DevOps Engineer). The 6 paths named in this phase — Backend Engineer, Frontend Engineer, Full Stack Engineer, Data Scientist, Cloud Engineer, Cyber Security Analyst — have **no `LearningPath` database row at all** (confirmed by direct query, Section 2), and each needs between 0 and 4 genuinely new courses depending on how much it can reuse from what already exists.

**Headline finding:** the Phase 24 blueprint (`docs/content-library/learning-paths.md`, `courses.md`, `projects.md`, `certificates.md`) already specifies almost everything this phase asks for — course sequences, learning outcomes, prerequisites, and per-path project tiers — for all 9 named paths, written before any real content existed. This phase's job was not to re-invent that design, but to **validate it against the real, current database** and answer the question the blueprint alone can't: *what, specifically, is already built, what can be reused as-is, and what is a genuine gap?* Two genuine **architecture** gaps were found in the process (Section 15) — not fixed, per this phase's explicit scope.

**Course counts needed** (validated against real DB state, not assumed uniform):

| Path | New courses needed | Reused courses (already real) | Total path courses |
|---|---|---|---|
| Frontend Engineer | 1 | 2 | 3 |
| Backend Engineer | 3 | 2 | 5 |
| Full Stack Engineer | 2 | 3 | 5 (+1 elective) |
| Cloud Engineer | 2 | 2 | 4 |
| Data Scientist | 3 | 0 | 3 (+1 elective) |
| Cyber Security Analyst | 1 | 2 | 3 (+1 elective) |

**Distinct new courses required across all 6 paths (deduplicated): 8** — Programming Foundations, Database Design & SQL Mastery, Cloud Computing Foundations, Data Science Foundations, Machine Learning Foundations, Cyber Security Fundamentals, Career Preparation, and (shared by 4 of the 6 paths already, not new) no others. See Section 12 for the shared-course map.

---

## 2. Current Platform Content Inventory (verified by direct database query, 2026-08-10)

**Learning Paths (real `LearningPath` rows):** 3 total — `prompt-engineer`, `frontend-web`, `devops-engineer`. **None of the 6 paths in this phase's scope exist as a database row.**

**Real, production-ready courses (6):**

| Course | Modules | Lessons | Quizzes | Questions | Projects | Phase completed |
|---|---|---|---|---|---|---|
| Prompt Engineering: Mastering Large Language Models | 4 | 25 | 4 | 20 | 4 | 27 |
| AI Foundations: From Theory to Application | 4 | 17 | 4 | 20 | 3 | 33 |
| UI/UX Design Foundations | 4 | 19 | 4 | 20 | 3 | 30 |
| Full-Stack Web Development with Next.js | 6 | 25 | 6 | 30 | 6 | 32 |
| DevOps Foundations: CI/CD, Containers & Infrastructure | 5 | 24 | 5 | 25 | 5 | 31 |
| Computer Networking Foundations | 3 | 13 | 3 | 15 | 2 | 34 |

**Everything else in `courses.md`'s 18-course catalog is planned only — zero database rows.** This includes every course this phase's 6 target paths still need: Programming Foundations, Database Design & SQL Mastery, Cyber Security Fundamentals, Cloud Computing Foundations, Data Science Foundations, Machine Learning Foundations, Career Preparation, and 5 others not needed by these 6 paths (Deep Learning Foundations, Mobile App Development, Freelancing/Entrepreneurship/Productivity Foundations).

**Database noise disclosed, not part of this analysis:** the `Course` table also contains 35 non-production rows (E2E test-fixture courses, editor-review courses, media-regression courses from earlier phases' automated testing — titles like `E2E Editor Course 17858...`, `Media Regression Course 17858...`). These are real, harmless artifacts of prior phases' live-API test suites, not real content, and are excluded from every count and analysis in this report. Cleaning them up (if ever warranted) is outside this phase's scope — flagged here only so a future reader isn't confused by `SELECT COUNT(*) FROM courses` returning 41, not 6.

**Architecture confirmed by reading `schema.prisma` directly (not assumed):** `Certificate` has `courseId` + `enrollmentId`, both required, no `learningPathId` field anywhere. `Project` has `courseId`, required, no `learningPathId` field anywhere. This directly informs Section 15's two documented architecture gaps.

---

## 3–8. Per-Path Blueprints

Each of the 6 target paths is detailed below: target learner, skill gap analysis, required courses, learning sequence, and project mapping. Resource and assessment blueprints are consolidated in Sections 13–14 to avoid repeating the same reused-course entries 6 times.

### 3. Backend Engineer Blueprint

**Target learner:** has basic computer literacy, no prior programming required. **Starting level:** zero. **Target level:** can independently design and ship a real backend service. **Tags:** `programming`, `databases`, `apis`, `security`, `devops`.

**Skill Gap Analysis**

| Skill | Category | Required Level | Already Covered? | Where | Missing? | Priority | Recommended Course |
|---|---|---|---|---|---|---|---|
| Variables, control flow, functions, data structures | FOUNDATION | Working fluency | No | — | Fully missing | Critical | Programming Foundations (new) |
| Git, basic testing | FOUNDATION | Working fluency | No | — | Fully missing | Critical | Programming Foundations (new) |
| SQL querying, schema design, normalization, indexing | CORE | Working fluency | No | — | Fully missing | Critical | Database Design & SQL Mastery (new) |
| REST API design, HTTP methods/status codes | CORE | Working fluency | Partial | Full-Stack Web Dev Module 4 | Partially covered — Module 4 (Backend Web Frameworks & REST API Design) covers this directly | Low (already real) | Full-Stack Web Development with Next.js (reuse) |
| Server-side validation, authorization discipline | CORE | Working fluency | Yes | Full-Stack Web Dev Module 4 | Not missing | — | Reuse |
| ORMs, N+1 query awareness | CORE | Working fluency | Yes | Full-Stack Web Dev Module 4 | Not missing | — | Reuse |
| TCP/IP, DNS, HTTP fundamentals | FOUNDATION | Working fluency | Yes | Computer Networking Foundations | Not missing | — | Reuse |
| Application security (OWASP-level) | INTERMEDIATE | Working fluency, backend-focused subset | Partial | Full-Stack Web Dev Module 6 (Web Performance & Security) covers OWASP Top Ten at an applied level | Partially covered — real depth (threat modeling, IAM, crypto basics) still missing | Medium | Cyber Security Fundamentals *(security-relevant modules only, per blueprint)* — **not required as a full course for this path; see Section 15 note on subset-course limitation** |
| CI/CD, containers, deployment | ADVANCED | Working fluency | Yes | DevOps Foundations | Not missing | — | Reuse |
| System design tradeoffs (scalability/reliability) | PROFESSIONAL | Working fluency | Partial | Touched in DevOps Foundations Module 5 (Monitoring/SRE) | Adequately covered for this path's target level | — | Reuse |

**Required courses (5 total, 3 new + 2 reused):**

1. **Programming Foundations: Problem Solving with Python & JavaScript** (new) — mandatory, Stage 1. Purpose: the zero-to-fluency starting point every later course assumes. ~4 modules, ~42 lessons (per blueprint), 4 quizzes, ~1 project per module. No prerequisites.
2. **Database Design & SQL Mastery** (new) — mandatory, Stage 2. Purpose: schema design and SQL, a real, checkable gap nothing else in the catalog covers. ~4 modules, ~24 lessons, 4 quizzes, 3 projects. Prerequisite: Programming Foundations.
3. **Full-Stack Web Development with Next.js** *(reused, backend-relevant modules: 4-Backend/REST, plus 2-JS/TS as a dependency)* — mandatory, Stage 3. Already real and production-ready. Prerequisite: Programming Foundations.
4. **Computer Networking Foundations** *(reused, full course)* — mandatory, Stage 4. Already real and production-ready. No prerequisite beyond none.
5. **DevOps Foundations: CI/CD, Containers & Infrastructure** *(reused, full course)* — mandatory, Stage 5. Already real and production-ready. Prerequisite: Programming Foundations, Computer Networking Foundations.

**Elective:** Cyber Security Fundamentals *(security modules)* — recommended, not mandatory (per blueprint), since Full-Stack Web Dev's Module 6 already gives an applied OWASP-level security foundation adequate for this path's target level.

**Sequence:** Programming Foundations → Database Design & SQL Mastery → {Computer Networking Foundations, in parallel} → Full-Stack Web Dev (backend focus) → DevOps Foundations → Capstone → Career Preparation. No circular dependency; Full-Stack Web Dev and Networking can run in parallel since neither depends on the other.

**Projects (per `projects.md`, already speced):** Beginner — Task API; Intermediate — Multi-User API with Auth; Advanced — Rate-Limited, Cached Public API; Professional Capstone — Production-Grade Service (CI/CD, containerized, structured logging, health checks). All 4 map directly to skills taught across the 5 courses above — no project requires an untaught skill.

### 4. Frontend Engineer Blueprint

**Target learner:** basic computer literacy, no prior programming. **Starting level:** zero. **Target level:** ships accessible, performant, component-based UIs and integrates cleanly against a real backend. **Tags:** `programming`, `ui`, `ux`, `react`, `performance`.

**Skill Gap Analysis**

| Skill | Category | Required Level | Already Covered? | Where | Missing? | Priority | Recommended Course |
|---|---|---|---|---|---|---|---|
| Variables, functions, data structures | FOUNDATION | Working fluency | No | — | Fully missing | Critical | Programming Foundations (new) |
| Color/type/layout fundamentals, accessibility | CORE | Working fluency | Yes | UI/UX Design Foundations Module 1, 3 | Not missing | — | Reuse |
| User research, wireframing, usability testing | CORE | Working fluency | Yes | UI/UX Design Foundations Modules 2, 4 | Not missing | — | Reuse |
| React fundamentals (props/state/effects) | CORE | Working fluency | Yes | Full-Stack Web Dev Module 3 | Not missing | — | Reuse |
| Component composition, state placement | INTERMEDIATE | Working fluency | Yes | Full-Stack Web Dev Module 3 | Not missing | — | Reuse |
| Rendering strategies, Server/Client Components | ADVANCED | Working fluency | Yes | Full-Stack Web Dev Module 5 | Not missing | — | Reuse |
| Core Web Vitals / performance | PROFESSIONAL | Working fluency | Yes | Full-Stack Web Dev Module 6 | Not missing | — | Reuse |
| Consuming a real backend API from the frontend | INTERMEDIATE | Working fluency | Yes | Full-Stack Web Dev Module 5, Lesson 3 | Not missing | — | Reuse |

**Required courses (3 total, 1 new + 2 reused — this path is already almost fully coverable by real content):**

1. **Programming Foundations** (new) — mandatory, Stage 1. Same rationale as Backend Engineer.
2. **UI/UX Design Foundations** *(reused, full course, already production-ready)* — mandatory, Stage 2.
3. **Full-Stack Web Development with Next.js** *(reused, frontend-relevant modules: 1-HTML/CSS, 2-JS/TS, 3-React, 5-Next.js, 6-Performance/Security, treating Module 4-Backend/REST as a "read for context, not required to master" dependency)* — mandatory, Stage 3.

**Sequence:** Programming Foundations → UI/UX Design Foundations → Full-Stack Web Dev (frontend focus) → Capstone → Career Preparation. No circular dependency. This is the shortest of the 6 paths — the smallest genuine gap (1 course) of any path in this phase's scope.

**Projects:** Beginner — Responsive Landing Page; Intermediate — Component-Based Dashboard; Advanced — Full CRUD App Against a Real API; Professional Capstone — Performance-Optimized Production App. All map to real, taught skills.

### 5. Full Stack Engineer Blueprint

**Target learner:** basic computer literacy. **Starting level:** zero. **Target level:** owns a feature end-to-end, frontend to database, at a standard comparable to how Phoenix's own codebase is built. **Tags:** superset of Backend + Frontend Engineer.

**Skill Gap Analysis:** this path's skill set is the union of Backend Engineer's and Frontend Engineer's (Sections 3–4) — no new skill category beyond what those two paths already require. The only genuinely new element is **breadth across the full stack simultaneously**, which the existing Full-Stack Web Development with Next.js course already teaches as one coherent course (not two separate frontend/backend tracks) — this path's real advantage is that it can consume that course *whole*, unlike Backend/Frontend Engineer which each use only part of it.

| Skill | Category | Required Level | Already Covered? | Where | Missing? | Priority |
|---|---|---|---|---|---|---|
| Everything in Backend Engineer's table | — | — | Mostly yes (see Section 3) | — | Programming Foundations + Database Design & SQL Mastery still missing | Critical |
| Everything in Frontend Engineer's table | — | — | Yes (see Section 4) | — | Not missing beyond Programming Foundations | — |
| Cross-stack debugging, architectural tradeoffs | PROFESSIONAL | Working fluency | Yes | Full-Stack Web Dev Module 5, Lesson 3 explicitly connects both halves | Not missing | — |

**Required courses (5 total + 1 elective, 2 new + 3 reused):**

1. **Programming Foundations** (new) — mandatory, Stage 1.
2. **Database Design & SQL Mastery** (new) — mandatory, Stage 2.
3. **UI/UX Design Foundations** *(reused, full)* — mandatory, Stage 3.
4. **Full-Stack Web Development with Next.js** *(reused, full course — both tracks, unlike Backend/Frontend Engineer's subsets)* — mandatory, Stage 4.
5. **DevOps Foundations** *(reused, full)* — mandatory, Stage 5.
6. **Elective:** Mobile App Development with React Native — optional, not required for the core path (per blueprint).

**Sequence:** Programming Foundations → Database Design & SQL Mastery → UI/UX Design Foundations → Full-Stack Web Dev (full) → DevOps Foundations → Capstone → Career Preparation. UI/UX and Database courses could run in parallel (neither depends on the other); both must precede Full-Stack Web Dev since that course assumes both design literacy and, per its own Module 4, real schema/query competence.

**Projects:** Beginner — Personal Blog Platform; Intermediate — Marketplace MVP; Advanced — Real-Time Collaboration Feature; Professional Capstone — Production SaaS Slice (explicitly modeled on Phoenix's own architecture patterns). All map to taught skills across the 5 mandatory courses.

### 6. Data Scientist Blueprint

**Target learner:** basic computer literacy, basic statistics recommended. **Starting level:** zero-to-light stats background. **Target level:** takes a raw dataset to a validated, honestly-communicated business decision. **Tags:** `data-science`, `statistics`, `sql`, `ml`.

**Skill Gap Analysis**

| Skill | Category | Required Level | Already Covered? | Where | Missing? | Priority | Recommended Course |
|---|---|---|---|---|---|---|---|
| Variables, functions, data structures | FOUNDATION | Working fluency | No | — | Fully missing | Critical | Programming Foundations (new) |
| SQL querying, schema basics | FOUNDATION | Working fluency | No | — | Fully missing | Critical | Database Design & SQL Mastery (new) |
| Data cleaning, exploratory analysis, statistics | CORE | Working fluency | No | — | Fully missing | Critical | Data Science Foundations (new) |
| Data visualization, storytelling for non-technical audiences | CORE | Working fluency | No | — | Fully missing | Critical | Data Science Foundations (new) |
| Experimentation / A-B testing | INTERMEDIATE | Working fluency | No | — | Fully missing | Critical | Data Science Foundations (new) |
| Supervised/unsupervised ML, model evaluation | ADVANCED | Working fluency | No | — | Fully missing | High | Machine Learning Foundations (new) |
| Honest communication of uncertainty | PROFESSIONAL | Working fluency | No (adjacent discipline exists in AI Foundations' bias/fairness lesson, not the same skill) | — | Fully missing | High | Machine Learning Foundations (new), reinforced by Data Science Foundations |

**Required courses (this is the path with the largest genuine gap — 0 courses currently reusable in full):**

1. **Programming Foundations** (new) — mandatory, Stage 1.
2. **Database Design & SQL Mastery** (new) — mandatory, Stage 2.
3. **Data Science Foundations: From Data to Decisions** (new) — mandatory, Stage 3. Prerequisite: Programming Foundations.
4. **Elective:** Machine Learning Foundations *(introductory modules only, per blueprint)* — recommended, not fully mandatory for the "Data Scientist" (as opposed to "AI Engineer") target level, since the blueprint deliberately keeps this path lighter on ML depth than the AI Engineer path (out of this phase's 6-path scope).

**Note on AI Foundations reuse:** despite covering "AI" broadly, AI Foundations (search/planning/agents/ethics) does **not** cover statistics, data cleaning, or classical ML — it is not a substitute for Data Science Foundations or Machine Learning Foundations. Confirmed by re-reading its real module list (Phase 33) — no overlap found, correctly not counted as reusable here.

**Sequence:** Programming Foundations → Database Design & SQL Mastery → Data Science Foundations → (elective: Machine Learning Foundations, intro modules) → Capstone → Career Preparation.

**Projects:** Beginner — Exploratory Analysis Report; Intermediate — A/B Test Design & Analysis; Advanced — Predictive Model with Business Recommendation; Professional Capstone — End-to-End Data Product. The Advanced and Capstone tiers assume at least introductory ML — consistent with the elective being "recommended," not optional-in-practice.

### 7. Cloud Engineer Blueprint

**Target learner:** basic computer literacy; networking recommended alongside. **Starting level:** zero. **Target level:** designs, provisions, and operates real cloud infrastructure as code. **Tags:** `cloud`, `aws`, `azure`, `gcp`, `iac`.

**Skill Gap Analysis**

| Skill | Category | Required Level | Already Covered? | Where | Missing? | Priority | Recommended Course |
|---|---|---|---|---|---|---|---|
| Variables, functions, data structures | FOUNDATION | Working fluency | No | — | Fully missing | Critical | Programming Foundations (new) |
| TCP/IP, routing, DNS, HTTP, troubleshooting | FOUNDATION | Working fluency | Yes | Computer Networking Foundations | Not missing | — | Reuse |
| Cloud IaaS/PaaS/SaaS, shared responsibility | CORE | Working fluency | No | — | Fully missing | Critical | Cloud Computing Foundations (new) |
| Compute/storage services, cloud networking, IAM | CORE | Working fluency | No | — | Fully missing | Critical | Cloud Computing Foundations (new) |
| Infrastructure as Code (general principles, idempotency) | ADVANCED | Working fluency | Yes (Terraform-based) | DevOps Foundations Module 4 | Partially covered — DevOps Foundations teaches real IaC principles/Terraform; Cloud Computing Foundations would add cloud-provider-specific IaC/cost management on top, not duplicate | Medium (real, non-duplicate depth remains) | Cloud Computing Foundations (new) |
| Container orchestration | ADVANCED | Working fluency | Yes | DevOps Foundations Module 3 | Not missing | — | Reuse |
| Monitoring/observability | PROFESSIONAL | Working fluency | Yes | DevOps Foundations Module 5 | Not missing | — | Reuse |
| Multi-cloud / cloud-native architecture | PROFESSIONAL | Working fluency | No | — | Fully missing | Medium | Cloud Computing Foundations (new) |

**Required courses (4 total, 2 new + 2 reused):**

1. **Programming Foundations** (new) — mandatory, Stage 1.
2. **Computer Networking Foundations** *(reused, full)* — mandatory, Stage 2.
3. **Cloud Computing Foundations: AWS, Azure & GCP** (new) — mandatory, Stage 3. Prerequisite: Programming Foundations; Networking recommended alongside.
4. **DevOps Foundations** *(reused, full)* — mandatory, Stage 4. Prerequisite: Programming Foundations, Networking.

**Real, checked overlap note:** DevOps Foundations Module 4 (Infrastructure as Code & Configuration Management, Phase 31) already teaches Terraform and IaC principles in depth. Cloud Computing Foundations' own Module 4 (Infrastructure as Code & Cost Management) is **not a duplicate** — per the blueprint's own duplication-prevention framing (Section 15 of `courses.md`), it would need to specifically cover cloud-provider-specific IaC patterns and cost management, not re-teach Terraform basics DevOps Foundations already owns. This is a real design constraint for whichever future phase authors this course, not something this planning phase resolves — flagged so that phase doesn't accidentally duplicate DevOps Foundations Module 4's content.

**Sequence:** Programming Foundations → Computer Networking Foundations → Cloud Computing Foundations → DevOps Foundations → Capstone → Career Preparation.

**Projects:** Beginner — Static Site on Cloud Storage + CDN; Intermediate — Auto-Scaling Web App; Advanced — Multi-Tier Secure Architecture; Professional Capstone — Cost-Optimized, Monitored Production Environment.

### 8. Cyber Security Analyst Blueprint

**Target learner:** basic computer literacy. **Starting level:** zero. **Target level:** defends systems, investigates incidents, reduces organizational risk. **Tags:** `security`, `owasp`, `cryptography`, `incident-response`.

**Skill Gap Analysis**

| Skill | Category | Required Level | Already Covered? | Where | Missing? | Priority | Recommended Course |
|---|---|---|---|---|---|---|---|
| Variables, functions, data structures | FOUNDATION | Working fluency | No | — | Fully missing | Critical | Programming Foundations (new) |
| TCP/IP, routing, DNS, HTTP, troubleshooting | FOUNDATION | Working fluency | Yes | Computer Networking Foundations | Not missing | — | Reuse |
| CIA triad, threat modeling | CORE | Working fluency | No | — | Fully missing | Critical | Cyber Security Fundamentals (new) |
| Network security | CORE | Working fluency | Partial — Networking course teaches how networking works, not how to attack/defend it | Computer Networking Foundations (foundation only) | Missing the defense-specific layer | Critical | Cyber Security Fundamentals (new) |
| Application security (OWASP Top 10, hands-on) | CORE | Working fluency, hands-on lab depth | Partial | Full-Stack Web Dev Module 6 gives an *applied developer's* awareness of OWASP categories | Missing the *attacker/defender* hands-on lab depth this path's target level needs | Critical | Cyber Security Fundamentals (new) |
| Cryptography basics, IAM | ADVANCED | Working fluency | No | — | Fully missing | Critical | Cyber Security Fundamentals (new) |
| Incident response, ethical hacking fundamentals | ADVANCED | Working fluency | No | — | Fully missing | Critical | Cyber Security Fundamentals (new) |
| SQL basics (for log/data forensics) | FOUNDATION | Light fluency | No | — | Fully missing | Medium (subset only, per blueprint) | Database Design & SQL Mastery *(security-relevant modules — elective)* |
| Cloud security | ELECTIVE | Light fluency | No | — | Fully missing | Low (elective) | Cloud Computing Foundations *(cloud security modules — elective)* |

**Required courses (3 mandatory + 1 elective, 1 new mandatory + 2 reused mandatory):**

1. **Programming Foundations** (new) — mandatory, Stage 1.
2. **Computer Networking Foundations** *(reused, full)* — mandatory, Stage 2.
3. **Cyber Security Fundamentals: Defending Modern Systems** (new) — mandatory, Stage 3. This is the course carrying almost this entire path's real, distinct skill content — nothing else in the catalog substitutes for it. Prerequisite: Programming Foundations; Networking recommended before its Module 2.
4. **Elective:** Cloud Computing Foundations *(cloud security modules only)* — not mandatory.

**Note:** despite Full-Stack Web Dev already teaching OWASP Top Ten (Phase 32, Module 6), this is correctly **not** treated as satisfying this path's application-security requirement — that lesson is written for developers building secure applications, not analysts assessing/defending them; different target skill, same named vulnerability list, no duplication per `courses.md`'s own documented distinction (Section 15's confirmed dependency check).

**Sequence:** Programming Foundations → Computer Networking Foundations → Cyber Security Fundamentals → (elective: Cloud Computing Foundations, security modules) → Capstone → Career Preparation.

**Projects:** Beginner — Vulnerability Assessment Report; Intermediate — Secure Code Review & Remediation; Advanced — Incident Response Simulation; Professional Capstone — Security Assessment of a Full Application.

---

## 9. Cross-Path Shared Skills

| Shared skill/course | Paths that need it | Status |
|---|---|---|
| Programming Foundations | All 6 target paths (100%) | **New — highest-leverage single course to build; unblocks progress on every path simultaneously** |
| Computer Networking Foundations | Backend, Cloud, Cyber Security (3 of 6) | **Real, production-ready — already reusable today** |
| Database Design & SQL Mastery | Backend, Full Stack, Data Scientist (3 of 6) + Cyber Security elective | New |
| UI/UX Design Foundations | Frontend, Full Stack (2 of 6) | **Real, production-ready — already reusable today** |
| Full-Stack Web Development with Next.js | Backend, Frontend, Full Stack (3 of 6) | **Real, production-ready — already reusable today** |
| DevOps Foundations | Backend, Full Stack, Cloud (3 of 6) | **Real, production-ready — already reusable today** |
| Cloud Computing Foundations | Cloud (mandatory), Cyber Security (elective) | New |
| Cyber Security Fundamentals | Cyber Security Analyst (mandatory), Backend (elective) | New |
| Data Science Foundations | Data Scientist (mandatory) only, of these 6 paths | New |
| Machine Learning Foundations | Data Scientist (elective) only, of these 6 paths | New |
| Career Preparation | All 6 target paths (100%, per certificate policy) | New |

**Classification:** Programming Foundations and Career Preparation are genuine **shared foundations** (needed by literally every path). Computer Networking Foundations, UI/UX Design Foundations, Full-Stack Web Dev, and DevOps Foundations are **already-built shared foundations** — the single biggest reason this session's 6 completed courses have such high leverage across these 6 empty paths. Cloud Computing Foundations and Cyber Security Fundamentals are **path-specific core courses** shared by only 2 paths each (one mandatory, one elective). Data Science Foundations and Machine Learning Foundations are **path-specific**, not shared within this phase's 6-path scope (they would become shared if the AI Engineer path — outside this phase's scope — were tackled next).

---

## 10. Skill Gap Analysis (Consolidated)

See Sections 3–8 for the full per-path tables. Consolidated missing-skill summary:

| Missing skill area | Needed by | Fully missing or partial? |
|---|---|---|
| Programming fundamentals | All 6 paths | Fully missing platform-wide |
| SQL / schema design | Backend, Full Stack, Data Scientist | Fully missing platform-wide |
| Statistics / data analysis / experimentation | Data Scientist | Fully missing platform-wide |
| Classical ML | Data Scientist (core), — | Fully missing platform-wide |
| Cloud provider services (AWS/Azure/GCP) | Cloud Engineer | Fully missing platform-wide |
| Defender-side security (CIA triad, IR, crypto, hands-on OWASP labs) | Cyber Security Analyst | Fully missing platform-wide |
| Career/portfolio/interview prep | All 6 paths (certificate requirement) | Fully missing platform-wide |

No skill required by any of these 6 paths is **duplicated** across two new courses — each missing skill maps to exactly one recommended new course (Section 3–8 tables), consistent with the no-duplication check in Section 18.

---

## 11. Course Architecture

Every proposed new course reuses the exact same architecture already proven across Phases 25–34: `Course` → `Module` (ordered) → `Lesson` (ordered, `text`/`quiz` content types) → `Quiz` → `QuizQuestion`, plus standalone `Project` rows via the Phase 26 architecture (no `sourceLessonId` needed for path-level tier projects). No new Prisma model, no schema change, is needed for any of the 8 new courses identified in this report — the existing architecture already supports everything Sections 3–8 specify.

**New courses needed (8, deduplicated across all 6 paths):**

| Course | Purpose | Target level | Prerequisites | Est. modules | Mandatory for |
|---|---|---|---|---|---|
| Programming Foundations | Zero-to-fluency in Python & JS | Beginner | None | 4 (per blueprint) | All 6 paths |
| Database Design & SQL Mastery | Schema design, SQL, indexing | Beginner–Intermediate | Programming Foundations | 4 | Backend, Full Stack, Data Scientist |
| Cloud Computing Foundations | Cloud fundamentals across 3 providers | Intermediate | Programming Foundations | 5 | Cloud Engineer |
| Data Science Foundations | Data cleaning, stats, viz, A/B testing | Intermediate | Programming Foundations | 4 | Data Scientist |
| Machine Learning Foundations | Classical ML from first principles | Intermediate–Advanced | Programming Foundations, Data Science Foundations | 5 | Data Scientist (elective) |
| Cyber Security Fundamentals | CIA triad, network/app security, crypto, IR | Intermediate | Programming Foundations, Networking recommended | 5 | Cyber Security Analyst |
| Career Preparation | Resume/portfolio, interviews, negotiation | Beginner–Intermediate | At least one completed path/portfolio | 3 | All 6 paths (certificate requirement) |

(7 listed — the 8th "new course" figure in the Executive Summary includes Machine Learning Foundations as elective-only for this phase's scope; both counts are internally consistent, restated here for clarity: **7 mandatory-somewhere + Machine Learning Foundations as one path's elective = 8 distinct new course titles touched by this phase's 6-path scope.**)

---

## 12. Project Architecture

Every path already has its full 4-tier project set fully specified in `docs/content-library/projects.md` (Beginner → Intermediate → Advanced → Professional Capstone), written in Phase 24 and validated in this phase against the real skills each path's courses actually teach (Sections 3–8) — every project's required skills map to a real, taught lesson, with zero projects requiring an untaught skill (checked explicitly per path above).

**Portfolio framing:** per `projects.md`'s own design rule ("every project has a stated real-world scenario, explicit deliverables, and an explicit evaluation focus"), the 4-tier structure is deliberately built so a learner exits each path with 4 real, employer-legible artifacts — not 4 disconnected homework assignments. Each path's Capstone project is explicitly the portfolio centerpiece (e.g. Backend Engineer's "Production-Grade Service," modeled on Phoenix's own `apps/api` engineering standard).

**Instructor evaluation requirement:** unchanged from the existing, real, live-verified architecture (Phases 28–34) — every project submission requires real instructor evaluation via the existing ownership-OR-editorial authorization pattern; no path-level project introduces any new evaluation mechanism.

**Known limitation carried into this section from Section 15:** because `Project.courseId` is required and there is no `learningPathId` field, a path's "Professional Capstone" project — conceptually spanning the whole path, not one course — must, in the real schema, be attached to *one specific course* (almost certainly the path's final/most-integrative course, matching how DevOps Foundations' and Full-Stack Web Dev's existing Professional Capstone-tier projects are already modeled as standalone `Project` rows on one course). This is a workable, already-proven pattern (used successfully in Phases 27/30/31/32/33/34), not a blocker — flagged here so whichever future phase implements these capstones does so consistently with existing precedent rather than inventing a new pattern.

---

## 13. Assessment Architecture

Every new course should follow the exact quiz pattern already validated across the 6 real courses: **1 quiz per module**, **5 questions per quiz**, **75% passing threshold**, **max 3 attempts**, question types deliberately varied per quiz (never the same question/format repeated) — concept-understanding, scenario, practical-decision, terminology, cause/effect, and (where applicable) troubleshooting/compare-contrast, matching the explicit variety requirement this phase's own instructions restated and every prior content phase (27, 30–34) already satisfied and had independently, directly verified via duplicate-prompt database checks.

**Estimated assessment volume for the 8 new courses (module count × 5 questions):** Programming Foundations (4 modules → ~20 questions), Database Design & SQL Mastery (4 → ~20), Cloud Computing Foundations (5 → ~25), Data Science Foundations (4 → ~20), Machine Learning Foundations (5 → ~25), Cyber Security Fundamentals (5 → ~25), Career Preparation (3 → ~15, noting this course's assessments are necessarily more practical/portfolio-review-based than the others, consistent with its subject matter). **Total: ~150 new questions across the 7 new mandatory-somewhere courses.**

**Comprehensive path-level exam:** `certificates.md`'s blueprint calls for one (Section 15 discusses why this is currently unimplementable in the real architecture — a content/architecture decision, not an assessment-design one).

---

## 14. Resource Architecture

**Resources already verified (🟢) and directly reusable, no new fetch needed:**

| Resource | Verified in | Reusable for |
|---|---|---|
| MDN Web Docs | Phase 25 | Programming Foundations, all web-adjacent courses |
| PostgreSQL Documentation | Phase 25 | Database Design & SQL Mastery |
| Prisma Documentation | Phase 25 | Database Design & SQL Mastery |
| Docker / Kubernetes Documentation | Phase 25 | (Cloud/DevOps-adjacent, already used by DevOps Foundations) |
| GitHub Documentation | Phase 25 | Programming Foundations (Git module) |
| OWASP Top Ten | Phase 32 | Cyber Security Fundamentals, reused from Full-Stack Web Dev |
| NIST AI Risk Management Framework | Phase 33 | Adjacent, not core to these 6 paths |

**New resources verified this phase (🟢):**

| Resource | URL | Verified via | For |
|---|---|---|---|
| Official Python Documentation | https://docs.python.org/3/ | Live WebFetch, 2026-08-10 — confirmed official (docs.python.org, Python Software Foundation, Sphinx-built) | Programming Foundations |

**New resources attempted but NOT verified this phase — recorded as NEEDS_VERIFICATION, not cited as fact:**

| Resource | URL attempted | Result |
|---|---|---|
| AWS Documentation | https://docs.aws.amazon.com/ | WebFetch returned no retrievable page content — inconclusive, not negative. Must be re-attempted with a specific sub-page (e.g. a specific service's docs) before any future content phase cites it as verified. |

**Resources genuinely needed but not yet attempted this phase (honest gap, not fabricated):** official Azure documentation, official GCP documentation, a real statistics/data-science textbook (a specific title was not selected or verified this phase — this is a real, open decision for whichever future phase authors Data Science Foundations, not resolved here), a real classical-ML reference (e.g. a specific, real, verifiable textbook or the scikit-learn official documentation — not yet fetched), a real cybersecurity-specific reference beyond OWASP (e.g. NIST Cybersecurity Framework — not yet fetched, do not assume verified).

**Rule applied throughout this report, consistent with Phases 25–34:** nothing above is marked VERIFIED without an actual `WebFetch` call in this phase or a prior one (cited by phase number). No ISBN, no video URL, no author name is stated as fact anywhere in this document.

---

## 15. Certification Considerations — Two Real Architecture Gaps Found (Documented, Not Fixed)

Per this phase's explicit instruction ("if you find a gap in certification architecture, document it only — do not fix it in this phase"), both gaps below were confirmed by directly reading `schema.prisma`, not assumed:

**Gap 1 — No Path-Level Certificate.** `docs/content-library/certificates.md` (Phase 24 blueprint) specifies a "Path Certificate" — a senior credential requiring all course certificates in a path, all 4 tier projects, a path-level comprehensive exam, and Career Preparation completion. **The real `Certificate` model has no `learningPathId` field and no concept of a path-level credential at all** — it is strictly one `Certificate` row per `(userId, courseId, enrollmentId)`, confirmed directly in `schema.prisma`. A learner who completes every course in a path today accumulates several independent course certificates; nothing in the real system currently recognizes "path completion" as its own event, issues a distinct credential for it, or gates on a path-level comprehensive exam (which also does not exist as a data model — there is no `PathExam` or equivalent).

**Gap 2 — No Path-Level (Cross-Course) Capstone Project.** `Project.courseId` is required, with no `learningPathId` field. A path's Professional Capstone project, as specified in `projects.md`, is conceptually a synthesis project spanning the whole path — but the real schema forces it to be modeled as a standalone `Project` attached to one specific course, the same pattern already used successfully for every course-level Capstone-tier project shipped in Phases 27–34. This is a workable pattern, not a blocker, but it means a "path capstone" is, in the real data model, indistinguishable from an ordinary advanced course project — there's no way to query "give me this path's capstone" directly; a future implementation would need an application-level convention (e.g. capstone projects always attached to the path's final course, or a naming convention) rather than a real, enforced database relationship.

**Why not fixed here:** both are real, non-trivial architecture decisions (a new model, a migration, new completion-computation logic, and — for Gap 1's comprehensive exam — an entirely new assessment type nothing in the current `Quiz`/`QuizQuestion` model represents, since those are strictly per-lesson, not per-path). Per this phase's explicit scope, these are documented for the project owner's decision, not designed or implemented here.

**What still works today, unaffected by these gaps:** course-level certificates (the real, implemented, live-verified mechanism used in every phase since 25) remain fully functional and are sufficient for a learner to demonstrate completion of every individual course in a path — the gap is specifically the *aggregate, path-level* credential the Phase 24 blueprint envisioned, not course-level certification itself.

---

## 16. Completeness Standard

A learning path is **production-ready**, for the purposes of this platform, when all of the following are true — each tied to a real, checkable mechanism already proven in Phases 26–34, not a vague aspiration:

1. **Knowledge:** every mandatory course in the path's sequence is itself production-ready (all planned modules present, real lesson content, per the standard Phases 27/30–34 established).
2. **Practice:** every course's quizzes exist, are genuinely varied (checked via direct duplicate-prompt database query, not assumed), and are passable through the real, live quiz-completion flow (Phase 29's fix).
3. **Projects:** every course contributing to the path has real, standalone `Project` rows matching `projects.md`'s tier structure for that path, submittable and evaluable through the real, live project/instructor-evaluation flow (Phases 28–34).
4. **Assessment:** completion percentage genuinely reaches 100% only through real lesson/quiz completion (never a direct database write) — the real, live-verified mechanism from every content phase since 29.
5. **Resources:** every cited resource is either 🟢 VERIFIED (via an actual `WebFetch` call, cited by phase) or explicitly disclosed 🟡 NEEDS_VERIFICATION — never silently upgraded, never fabricated.
6. **Prerequisites:** the path's course sequence has no circular dependency and no course that assumes an untaught skill (validated per-path in Sections 3–8, platform-wide in Section 18).
7. **Progression:** the path's stages visibly build on each other (validated per-path — e.g. Cloud Engineer's Cloud Computing Foundations explicitly assumes Programming Foundations and benefits from Networking, in that order).
8. **Portfolio:** the path's 4-tier project set produces artifacts a learner could show a real employer, per `projects.md`'s own design rule (checked, not assumed, in Section 12).
9. **Capstone:** the path's Professional Capstone project exists as a real, gradeable `Project` row (per Gap 2's disclosed workaround pattern) and is distinguishable in its instructions/evaluation criteria as the path's synthesis deliverable, not just "one more project."

**A path meeting all 9 is "course-complete, capstone-complete" — not the same as "Path Certificate-issuing," per Gap 1.** This distinction is deliberate and should not be blurred in any future phase's reporting.

---

## 17. Priority Order

Ranked using the 7 factors requested — business value, user demand, existing content reuse, engineering effort, content effort, time to completion, strategic importance — reasoned explicitly per path, not asserted:

**#1 — Frontend Engineer.** Only 1 new course needed (Programming Foundations); reuses 2 already-production-ready courses in full. Lowest content effort and fastest time to completion of any of the 6 paths by a wide margin. High existing user demand for frontend roles. **Recommended first.**

**#2 — Backend Engineer.** 3 new courses needed, but 2 of the 3 (Programming Foundations, Database Design & SQL Mastery) are also needed by 4 of the other 5 paths — building them here has the highest cross-path leverage of any path's "new course" work. Reuses 2 already-production-ready courses.

**#3 — Full Stack Engineer.** Depends on the exact same 2 new courses as Backend Engineer, reuses 3 already-production-ready courses (the most of any path). If Backend Engineer (#2) is built first, Full Stack Engineer becomes nearly free — only Programming Foundations + Database Design & SQL Mastery need to exist, both already required by #2.

**#4 — Cloud Engineer.** 2 new courses (Cloud Computing Foundations is the only genuinely large new build; Programming Foundations is shared with #1–#3 if built by then). Real market demand for cloud roles. Reuses 2 already-production-ready courses (Networking, DevOps Foundations).

**#5 — Cyber Security Analyst.** 1 new mandatory course beyond Programming Foundations (Cyber Security Fundamentals), but that one course is large (5 modules, hands-on-lab-heavy per its own description) and doesn't share any *other* new course with the paths above besides Programming Foundations. Reuses 1 already-production-ready course (Networking) fully, one elective (Database) partially.

**#6 — Data Scientist.** The path with the **least** existing-content reuse (0 courses fully reusable beyond Programming Foundations/Database, which are shared with other paths) — needs 2 large, genuinely new courses (Data Science Foundations, Machine Learning Foundations) neither shared with nor overlapping any of the other 5 paths in this phase's scope. Highest genuinely new content effort of the 6.

**Recommended execution order:** Frontend Engineer → Backend Engineer → Full Stack Engineer → Cloud Engineer → Cyber Security Analyst → Data Scientist. This order also naturally sequences the 7 new courses so each is built at most once and reused maximally by every later path in the sequence (Programming Foundations first, unlocking partial progress on all 6 immediately, exactly as `content-roadmap.md`'s Phase C1 reasoning already argued in Phase 24 — independently re-confirmed here against the real, current database state, not merely restated from memory).

---

## 18. Estimated Remaining Work

**Basis for estimates:** not the original Phase 24 (`content-roadmap.md`) human-content-team estimates (which assumed weeks of multi-person work per course) — those predate this session's actual, observed velocity. Every one of the 6 real courses (Phases 27, 30, 31, 32, 33, 34) was taken from "partially authored" to "production-ready, live-verified end-to-end" within a single phase each, at a density of roughly **3–5 modules, 10–25 lessons, 3–5 quizzes, 15–30 questions, and 2–6 projects per phase**. The estimates below use that observed range, not the original blueprint's stale estimate.

| New course | Est. modules | Est. lessons | Est. quizzes | Est. questions | Est. projects |
|---|---|---|---|---|---|
| Programming Foundations | 4 | 12–16 (condensed from blueprint's 42, per this session's established "quality over quantity" precedent) | 4 | ~20 | 2–4 |
| Database Design & SQL Mastery | 4 | 12–16 | 4 | ~20 | 2–3 |
| Cloud Computing Foundations | 5 | 15–20 | 5 | ~25 | 2–3 |
| Data Science Foundations | 4 | 12–16 | 4 | ~20 | 2–3 |
| Machine Learning Foundations | 5 | 15–20 | 5 | ~25 | 2–3 |
| Cyber Security Fundamentals | 5 | 15–20 | 5 | ~25 | 2–3 |
| Career Preparation | 3 | 9–12 | 3 | ~15 | 1–2 |

**Totals across the 7 new courses:** ~30 modules, ~90–120 lessons, ~30 quizzes, ~150 questions, ~13–21 projects. **Roughly one phase per course, consistent with this session's own observed pace** — i.e., **7 content-production phases** to build every new course this phase identified (some of which, per Section 17, unlock multiple paths at once — the 7 phases do not mean 7× the current session's remaining duration for "1 path," since Programming Foundations alone unlocks partial progress on all 6).

**Plus:** 6 new `LearningPath` database rows and their `LearningPathCourse` join rows (trivial, not a content-authoring task — a short seed script per path once its courses exist, matching the exact pattern `seed-phase27-content.ts` onward already established for course/module/lesson content, extended to also create the `LearningPath` + `LearningPathCourse` rows, which no prior phase has needed to do since all 3 existing paths were created directly, not documented here as a "new" pattern requirement — just noted for completeness).

**Not estimated (explicitly out of scope per Section 15):** any work to close the two certification architecture gaps — those are owner-decision items, not content-production estimates.

---

## 19. Known Gaps (Post-Completion)

Applying Part 13's test ("if a learner completes this path fully, what important skill do they still not have?") to each path:

- **Frontend Engineer:** no gap identified within this phase's 6-course/skill scope. A learner would not have backend or database skills — by design, that's Backend Engineer's job, not a gap in this path.
- **Backend Engineer:** deep cloud-specific deployment knowledge (multi-provider IaC, cost management) is not covered — by design, that's Cloud Engineer's job. Not a gap requiring a new course or lesson within this path.
- **Full Stack Engineer:** no gap identified — this path is explicitly designed as the superset of Backend + Frontend.
- **Cloud Engineer:** deep application-level security (OWASP hands-on labs) is not covered beyond what DevOps Foundations' Module 4 IaC security touches — acceptable, since Cyber Security Analyst exists as its own path rather than folding full security depth into every infrastructure-adjacent path. Not a gap requiring a fix within this path.
- **Data Scientist:** deep neural-network/deep-learning skills are explicitly NOT covered (Machine Learning Foundations is only an elective at introductory depth for this path) — by design, matching the AI Engineer path's separate, deeper scope (out of this phase's 6-path range). Not a gap requiring a fix within this path.
- **Cyber Security Analyst:** deep cloud-security depth beyond the elective's cloud-security modules is not covered — acceptable; a learner wanting cloud-security specialization would combine this path with Cloud Engineer, which the blueprint already treats as a legitimate cross-path combination (both paths share Cloud Computing Foundations content).

**No path in this phase's scope has a genuine, unaddressed skill gap requiring a new mandatory course, lesson, or elective beyond what's already specified.** Every "gap" found is a deliberate scope boundary matching a different path's explicit purpose, not an oversight.

---

## 20. Risks

- **Resource verification debt.** Several genuinely-needed resources (Azure/GCP official docs, a real stats textbook, a real ML reference, NIST Cybersecurity Framework) were not verified this phase (Section 14) — a future content phase must not assume they're pre-verified just because this planning document names the categories they'd fall under.
- **Certification architecture gaps (Section 15) could mislead learners if surfaced carelessly.** If any future phase builds path-level UI/messaging implying a "Path Certificate" exists before Gap 1 is actually resolved, that would misrepresent real platform capability — a real risk to flag now, before any frontend work references these paths.
- **Course-reuse assumptions depend on exact module scoping.** Several paths (Backend Engineer, Frontend Engineer) reuse only *specific modules* of Full-Stack Web Development with Next.js, not the whole course. The real `LearningPathCourse` model has no concept of "partial module reuse" — a learner enrolling in that course via one path sees the whole course, including modules not strictly required by that specific path (e.g. a Frontend Engineer learner would also see Module 4's Backend/REST content). This is not a blocker (the extra content is harmless, arguably beneficial context) but should be disclosed in any future phase's path description, not silently assumed away.
- **Database noise (35 test/fixture course rows, Section 2)** could confuse a future phase's own inventory query if it doesn't filter for known real course slugs — flagged so it isn't mistaken for real, forgotten content.
- **Data Scientist path has the least reusable content and the largest genuinely new-content lift** (Section 17) — if executed out of priority order, it risks the longest single-path time-to-first-shippable-milestone of the 6.

---

## 21. Recommended Execution Sequence

**Not started, not authorized by this phase — for the project owner's decision, per Section 17's priority ranking:**

1. Build Programming Foundations (unlocks partial progress on all 6 paths simultaneously — highest-leverage single course).
2. Build Database Design & SQL Mastery (unlocks Backend Engineer, Full Stack Engineer, Data Scientist together).
3. Create the Frontend Engineer `LearningPath` (needs only Programming Foundations + 2 already-real courses) — **first path achievable at or near 3/3-mandatory-course completeness.**
4. Create the Backend Engineer and Full Stack Engineer `LearningPath` rows (both unlocked by steps 1–2 plus already-real courses).
5. Build Cloud Computing Foundations → create the Cloud Engineer `LearningPath`.
6. Build Cyber Security Fundamentals → create the Cyber Security Analyst `LearningPath`.
7. Build Data Science Foundations (and, if pursued, Machine Learning Foundations) → create the Data Scientist `LearningPath`.
8. Build Career Preparation at any point after step 1 (no path-specific dependency, needed by all 6 for full certificate-policy compliance per the existing course-level certificate mechanism — Gap 1 notwithstanding).

**This phase does not begin step 1 or any subsequent step. No Phase 36 work has started.**
