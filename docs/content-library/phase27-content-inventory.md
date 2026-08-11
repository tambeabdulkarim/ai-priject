# Phase 27 Content Inventory

**Created:** Phase 27 (Educational Content Production & Platform Population), 2026-08-09. Every number below is pulled directly from the live database (not estimated from `docs/content-library/courses.md`'s original blueprint counts, which were planning estimates) — see `docs/phase27-educational-content-production-report.md` for the verification method.

**Status legend:** 🟢 **production-ready** (every module the course currently has is fully authored, quizzed, and verified — but see the per-course note on whether the *whole planned course* is complete or the *authored portion* is) · 🟡 **partially authored** (real, complete, non-filler modules exist; more planned modules remain unauthored) · ⚪ **planned** (blueprint entry only, nothing seeded).

---

## Prompt Engineer path

| Course | Modules (of planned) | Lessons | Quizzes | Questions | Projects | Books | Videos | Docs links | Status |
|---|---|---|---|---|---|---|---|---|---|
| Prompt Engineering: Mastering Large Language Models | 4 of 4 | 25 | 4 | 20 | 4 | 1 (🟡 needs verification) | 2 (🟢 verified) | 2 (🟢 verified) | 🟢 **production-ready — the one course this phase declares fully complete** |
| AI Foundations: From Theory to Application | 4 of 4 (🟢 **Phase 33**) | 17 | 4 | 20 | 3 | 1 (🟢 live-verified Phase 33, official AIMA site) | 3 (🟢 general-knowledge, unchanged) | 1 (🟢 live-verified Phase 33, NIST AI RMF) | 🟢 **production-ready as of Phase 33 — see `docs/phase33-ai-foundations-content-production-report.md`** |

**Prompt Engineering's 4 modules:** LLM Fundamentals & Prompt Design Patterns (8 lessons, Phase 25) · Few-Shot & Chain-of-Thought Techniques (5 lessons, Phase 27) · Retrieval-Augmented Generation (RAG) & Tool Calling (7 lessons, Phase 27) · Prompt Evaluation & Responsible Use (5 lessons, Phase 27).

**Prompt Engineering's 4 projects:** Prompt Pattern Library (Beginner, linked to a Module 1 lesson brief, Phase 25) · Evaluation Harness for a Prompted Task (Intermediate, linked, Phase 25) · RAG Pipeline with Citations (Advanced, **standalone Project row, Phase 27, real instructions, no source lesson**) · Production Prompt-Powered Feature — Capstone (Professional, **standalone Project row, Phase 27**).

## Frontend / Web path

| Course | Modules (of planned) | Lessons | Quizzes | Questions | Projects | Books | Videos | Docs links | Status |
|---|---|---|---|---|---|---|---|---|---|
| Programming Foundations: Problem Solving with Python & JavaScript | 4 of 4 (🟢 **Phase 36**) | 16 | 4 | 20 | 2 | 0 | 0 | 3 (🟢 all live-verified Phase 35/36: Python docs, Git docs, Python unittest docs) | 🟢 **production-ready as of Phase 36 — new course, closes the one gap Phase 35 found for Frontend Engineer — see `docs/phase36-frontend-engineer-content-production-report.md`** |
| UI/UX Design Foundations | 4 of 4 (🟢 **Phase 30**) | 19 | 4 | 20 | 3 | 2 (🟢 general-knowledge) | 2 (1🟢/1🟡 — Figma community page returned HTTP 403 on live fetch, inconclusive not negative) | 2 (🟢 both live-verified Phase 30: W3C WCAG 2.2 Quick Reference, Nielsen Norman Group's 10 Usability Heuristics) | 🟢 **production-ready as of Phase 30 — see `docs/phase30-uiux-content-production-report.md`** |
| Full-Stack Web Development with Next.js | 6 of 6 (🟢 **Phase 32**) | 25 | 6 | 30 | 6 | 2 (🟢 verified, incl. official free versions) | 3 (🟢 verified) | 10 (🟢 verified — MDN/Next.js/Prisma/PostgreSQL reused, React/TypeScript/Node.js/OWASP new Phase 32) | 🟢 **production-ready as of Phase 32 — see `docs/phase32-fullstack-content-production-report.md`** |

**Frontend / Web path status: this path is now the real, live "Frontend Engineer" path** (per Phase 35's blueprint and Phase 36's execution) — 3/3 courses production-ready, matching Phase 35's "1 new course + 2 reused" determination exactly.

## DevOps Engineer path

| Course | Modules (of planned) | Lessons | Quizzes | Questions | Projects | Books | Videos | Docs links | Status |
|---|---|---|---|---|---|---|---|---|---|
| Computer Networking Foundations | 3 of 3 (🟢 **Phase 34**) | 13 | 3 | 15 | 2 | 1 (🟡 unchanged NEEDS_VERIFICATION — Kurose & Ross) | 2 (🟡 not live-fetched, unchanged) | 2 (🟢 live-verified Phase 34: RFC 1035, RFC 9110) | 🟢 **production-ready as of Phase 34 — see `docs/phase34-networking-content-production-report.md`** |
| DevOps Foundations: CI/CD, Containers & Infrastructure | 5 of 5 (🟢 **Phase 31**) | 24 | 5 | 25 | 5 | 2 (🟢 general-knowledge) | 2 (🟢 verified) | 4 (🟢 all verified — Docker/Kubernetes reused, Terraform + Prometheus new Phase 31) | 🟢 **production-ready as of Phase 31 — see `docs/phase31-devops-content-production-report.md`** |

**DevOps Foundations' 5 projects:** Containerized App with Basic CI (Beginner, linked to a Module 1 lesson brief, Phase 25) · Full CI/CD to a Real Environment (Intermediate, linked, Phase 25) · Deploy and Scale a Service on Kubernetes (Intermediate, standalone, Phase 31) · Provision Infrastructure as Code (Advanced, standalone, Phase 31) · Observability Stack for a Real Service (Professional Capstone, standalone, Phase 31).

## Backend Engineer path (new — Phase 37)

| Course | Modules (of planned) | Lessons | Quizzes | Questions | Projects | Books | Videos | Docs links | Status |
|---|---|---|---|---|---|---|---|---|---|
| Programming Foundations: Problem Solving with Python & JavaScript | 4 of 4 (🟢 Phase 36) | 16 | 4 | 20 | 2 | 0 | 0 | 3 (🟢 verified) | 🟢 production-ready — **reused from the Frontend Engineer path, unchanged this phase** |
| Database Design & SQL Mastery | 4 of 4 (🟢 **Phase 37 — new course**) | 15 | 4 | 20 | 2 | 0 | 0 | 3 (🟢 all live-verified — PostgreSQL Docs + Prisma Docs reused Phase 25, "Use The Index, Luke!" new Phase 37) | 🟢 **production-ready as of Phase 37 — new course, the one remaining real gap Phase 35's analysis found for Backend Engineer — see `docs/phase37-backend-engineer-content-production-report.md`** |
| Full-Stack Web Development with Next.js | 6 of 6 (🟢 Phase 32) | 25 | 6 | 30 | 6 | 2 (🟢 verified) | 3 (🟢 verified) | 10 (🟢 verified) | 🟢 production-ready — **reused, unchanged this phase** |
| Computer Networking Foundations | 3 of 3 (🟢 Phase 34) | 13 | 3 | 15 | 2 | 1 (🟡 unchanged NEEDS_VERIFICATION) | 2 (🟡 not live-fetched) | 2 (🟢 verified) | 🟢 production-ready — **reused, unchanged this phase** |
| DevOps Foundations: CI/CD, Containers & Infrastructure | 5 of 5 (🟢 Phase 31) | 24 | 5 | 25 | 5 | 2 (🟢 general-knowledge) | 2 (🟢 verified) | 4 (🟢 verified) | 🟢 production-ready — **reused, unchanged this phase** |

**Database Design & SQL Mastery's 4 modules:** Relational Fundamentals & SQL Querying (3 lessons + quiz) · Schema Design & Normalization (3 lessons + quiz) · Indexing, Performance & Transactions (3 lessons + quiz) · NoSQL & Database Administration Basics (2 lessons + quiz).

**Database Design & SQL Mastery's 2 projects:** Design and Query a Real Schema (Beginner, standalone, Phase 37) · Refactor a Bad Schema (Capstone, standalone, Phase 37).

**Backend Engineer path status: this path is now the real, live "Backend Engineer" path** (per Phase 35's blueprint and Phase 37's execution) — 5/5 courses production-ready. **Note on Phase 35's own course count:** Phase 35's executive summary and priority-reasoning sections stated "3 new courses" for Backend Engineer, but its own detailed Section 3 course list only ever named 2 new courses (Programming Foundations, Database Design & SQL Mastery) — a genuine counting error in Phase 35's own document, confirmed by direct database inspection before this phase built anything (no plausible "3rd new course" exists anywhere in the schema or blueprint text). Programming Foundations was already built in Phase 36; Database Design & SQL Mastery is Phase 37's one new course. Full reasoning in `docs/phase37-backend-engineer-content-production-report.md`.

---

## Remaining 12 categories (Artificial Intelligence beyond AI Foundations, Cyber Security, Cloud Computing, Data Science, Machine Learning, Deep Learning, Networking beyond the seeded course, Databases, Mobile Development, Business & Freelancing, Entrepreneurship, Productivity, Career Preparation)

⚪ **Planned only.** Nothing seeded this phase. Per this phase's explicit scope-control instruction ("do not automatically populate all remaining paths if the phase would become superficial"), these were deliberately not touched — see `docs/phase27-educational-content-production-report.md` Section 12.

## Full Stack Engineer path (new — Phase 38, zero new content)

| Course | Modules (of planned) | Lessons | Quizzes | Questions | Projects | Books | Videos | Docs links | Status |
|---|---|---|---|---|---|---|---|---|---|
| Programming Foundations: Problem Solving with Python & JavaScript | 4 of 4 (🟢 Phase 36) | 16 | 4 | 20 | 2 | 0 | 0 | 3 (🟢 verified) | 🟢 production-ready — **reused, unchanged this phase** |
| Database Design & SQL Mastery | 4 of 4 (🟢 Phase 37) | 15 | 4 | 20 | 2 | 0 | 0 | 3 (🟢 verified) | 🟢 production-ready — **reused, unchanged this phase** |
| UI/UX Design Foundations | 4 of 4 (🟢 Phase 30) | 19 | 4 | 20 | 3 | 2 (🟢) | 2 (1🟢/1🟡) | 2 (🟢 verified) | 🟢 production-ready — **reused, unchanged this phase** |
| Full-Stack Web Development with Next.js | 6 of 6 (🟢 Phase 32) | 25 | 6 | 30 | 6 | 2 (🟢) | 3 (🟢) | 10 (🟢 verified) | 🟢 production-ready — **reused, unchanged this phase; this path consumes the full course, both tracks** |
| DevOps Foundations: CI/CD, Containers & Infrastructure | 5 of 5 (🟢 Phase 31) | 24 | 5 | 25 | 5 | 2 (🟢) | 2 (🟢) | 4 (🟢 verified) | 🟢 production-ready — **reused, unchanged this phase** |

**Full Stack Engineer path status: this path is now the real, live "Full Stack Engineer" path** (per Phase 35's blueprint and Phase 38's execution) — 5/5 courses production-ready. **Zero new courses, modules, lessons, quizzes, or projects were created this phase** — direct inspection confirmed both courses Phase 35 flagged as "new" for this path (Programming Foundations, Database Design & SQL Mastery) were already built, for other paths, in Phases 36 and 37. This phase's only new content is the `LearningPath` row itself plus 5 course memberships. Full reasoning in `docs/phase38-fullstack-learning-path-production-report.md`.

## Cloud Engineer path (new — Phase 39, 1 new course)

| Course | Modules (of planned) | Lessons | Quizzes | Questions | Projects | Books | Videos | Docs links | Status |
|---|---|---|---|---|---|---|---|---|---|
| Programming Foundations: Problem Solving with Python & JavaScript | 4 of 4 (🟢 Phase 36) | 16 | 4 | 20 | 2 | 0 | 0 | 3 (🟢 verified) | 🟢 production-ready — **reused, unchanged this phase** |
| Computer Networking Foundations | 3 of 3 (🟢 Phase 34) | 13 | 3 | 15 | 2 | 1 (🟡) | 2 (🟡) | 2 (🟢 verified) | 🟢 production-ready — **reused, unchanged this phase** |
| Cloud Computing Foundations: AWS, Azure & GCP | 5 of 5 (🟢 **Phase 39 — new course**) | 18 | 5 | 25 | 2 | 0 | 0 | 5 (🟢 all live-verified Phase 39: NIST SP 800-145, AWS Overview whitepaper, Azure docs, GCP docs, AWS Well-Architected Framework) | 🟢 **production-ready as of Phase 39 — new course, the one remaining real gap Phase 35's analysis found for Cloud Engineer — see `docs/phase39-cloud-engineer-path-production-report.md`** |
| DevOps Foundations: CI/CD, Containers & Infrastructure | 5 of 5 (🟢 Phase 31) | 24 | 5 | 25 | 5 | 2 (🟢) | 2 (🟢) | 4 (🟢 verified) | 🟢 production-ready — **reused, unchanged this phase** |

**Cloud Computing Foundations' 5 modules:** Cloud Fundamentals & Shared Responsibility (2 lessons + quiz) · Compute & Storage Services (3 lessons + quiz) · Cloud Networking & IAM (2 lessons + quiz) · Infrastructure as Code & Cost Management (2 lessons + quiz — explicitly does NOT re-teach DevOps Foundations Module 4's Terraform/general IaC content) · Multi-Cloud & Cloud-Native Architecture (2 lessons + quiz).

**Cloud Computing Foundations' 2 projects:** Static Site on Cloud Storage with a CDN (Beginner, standalone, Phase 39) · Secure, Monitored Multi-Tier Cloud Architecture (Capstone, standalone, Phase 39 — requires real compute/network/IAM/IaC/reliability/cost reasoning plus an honest AWS Well-Architected 6-pillar self-evaluation).

**Cloud Engineer path status: this path is now the real, live "Cloud Engineer" path** (per Phase 35's blueprint and Phase 39's execution) — 4/4 courses production-ready, matching Phase 35's own "2 new + 2 reused" course-count claim exactly (no correction needed this time, unlike Phase 37's Backend Engineer count error). Full reasoning in `docs/phase39-cloud-engineer-path-production-report.md`.

## Cyber Security Analyst path (new — Phase 40, 1 new course)

| Course | Modules (of planned) | Lessons | Quizzes | Questions | Projects | Books | Videos | Docs links | Status |
|---|---|---|---|---|---|---|---|---|---|
| Programming Foundations: Problem Solving with Python & JavaScript | 4 of 4 (🟢 Phase 36) | 16 | 4 | 20 | 2 | 0 | 0 | 3 (🟢 verified) | 🟢 production-ready — **reused, unchanged this phase** |
| Computer Networking Foundations | 3 of 3 (🟢 Phase 34) | 13 | 3 | 15 | 2 | 1 (🟡) | 2 (🟡) | 2 (🟢 verified) | 🟢 production-ready — **reused, unchanged this phase** |
| Cyber Security Fundamentals: Defending Modern Systems | 5 of 5 (🟢 **Phase 40 — new course**) | 15 | 5 | 25 | 2 | 0 | 0 | 5 (🟢 all live-verified: NIST Cybersecurity Framework, NIST SP 800-61 Rev. 3, MITRE ATT&CK, NIST Crypto Standards new Phase 40; OWASP Top Ten reused Phase 32) | 🟢 **production-ready as of Phase 40 — new course, the one remaining real gap Phase 35's analysis found for Cyber Security Analyst — see `docs/phase40-cyber-security-analyst-path-production-report.md`** |

**Cyber Security Fundamentals' 5 modules:** Security Fundamentals & the CIA Triad (2 lessons + quiz) · Network Security (2 lessons + quiz) · Application Security/OWASP Top 10 (2 lessons + quiz — explicitly analyst-focused, not a duplicate of Full-Stack Web Dev's developer-focused OWASP lesson) · Cryptography Basics & Identity/Access Management (2 lessons + quiz) · Incident Response & Ethical Hacking Fundamentals (2 lessons + quiz).

**Cyber Security Fundamentals' 2 projects:** Threat Model and Harden a Small Web Application (Beginner/Intermediate, standalone, Phase 40) · Incident Response Tabletop: Investigate and Contain a Simulated Breach (Capstone, standalone, Phase 40).

**Cyber Security Analyst path status: this path is now the real, live "Cyber Security Analyst" path** (per Phase 35's blueprint and Phase 40's execution) — 3/3 courses production-ready, matching Phase 35's own "1 new + 2 reused" course-count claim exactly (no correction needed, unlike Phase 37's Backend Engineer count error). Full reasoning in `docs/phase40-cyber-security-analyst-path-production-report.md`.

## Data Scientist path (new — Phase 41, 1 new course)

| Course | Modules (of planned) | Lessons | Quizzes | Questions | Projects | Books | Videos | Docs links | Status |
|---|---|---|---|---|---|---|---|---|---|
| Programming Foundations: Problem Solving with Python & JavaScript | 4 of 4 (🟢 Phase 36) | 16 | 4 | 20 | 2 | 0 | 0 | 3 (🟢 verified) | 🟢 production-ready — **reused, unchanged this phase** |
| Database Design & SQL Mastery | 4 of 4 (🟢 Phase 37) | 15 | 4 | 20 | 2 | 0 | 0 | 3 (🟢 verified) | 🟢 production-ready — **reused, unchanged this phase** |
| Data Science Foundations: From Data to Decisions | 5 of 4 planned (🟢 **Phase 41 — new course, +1 module beyond blueprint, documented scope extension**) | 18 | 5 | 25 | 2 | 0 | 0 | 6 (🟢 all live-verified Phase 41: NumPy, pandas, Python statistics module, Seeing Theory, Fundamentals of Data Visualization, scikit-learn) | 🟢 **production-ready as of Phase 41 — new course, the one remaining real gap Phase 35's analysis found for Data Scientist — see `docs/phase41-data-science-content-production-report.md`** |

**Data Science Foundations' 5 modules:** Data Collection, Cleaning & SQL for Analysts (3 lessons + quiz) · Statistics & Probability for Data Analysis (3 lessons + quiz) · Hypothesis Testing & Experimentation (2 lessons + quiz) · Data Visualization & Storytelling (2 lessons + quiz) · Introduction to Predictive Modeling & Responsible Data Science (3 lessons + quiz — a documented addition beyond `courses.md`'s literal 4-module blueprint, since the mandatory path otherwise had zero predictive-modeling content despite its own Advanced/Capstone projects assuming some; deliberately lighter than a future, separate Machine Learning Foundations elective would be).

**Data Science Foundations' 2 projects:** Exploratory Data Analysis & Findings Report (Beginner/Intermediate, standalone, Phase 41) · End-to-End Data Product: From Raw Data to a Business Recommendation (Capstone, standalone, Phase 41).

**Data Scientist path status: this path is now the real, live "Data Scientist" path** (per Phase 35's blueprint and Phase 41's execution) — 3/3 courses production-ready. **This completes all 6 of Phase 35's originally-named learning paths** (Frontend Engineer, Backend Engineer, Full Stack Engineer, Cloud Engineer, Cyber Security Analyst, Data Scientist). Full reasoning in `docs/phase41-data-science-content-production-report.md`.

## Learning Paths

| Path | Slug | Courses | Status |
|---|---|---|---|
| Prompt Engineer | `prompt-engineer` | 2 (both production-ready — Prompt Engineering Phase 27, AI Foundations Phase 33) | 🟢 The path itself is `published` (real, live-queryable) — both component courses are now fully production-ready. |
| Frontend / Web | `frontend-web` | 2 (both production-ready — UI/UX Design Foundations Phase 30, Full-Stack Web Development with Next.js Phase 32) | 🟢 Path is published; both component courses are now fully production-ready. |
| DevOps Engineer | `devops-engineer` | 2 (both production-ready — DevOps Foundations Phase 31, Computer Networking Foundations Phase 34) | 🟢 Path is published; both component courses are now fully production-ready. |
| Backend Engineer | `backend-engineer` | 5 (all production-ready — Programming Foundations Phase 36, Database Design & SQL Mastery Phase 37, Full-Stack Web Dev Phase 32, Networking Phase 34, DevOps Foundations Phase 31) | 🟢 Path is published; all 5 component courses are production-ready. |
| Full Stack Engineer | `full-stack-engineer` | 5 (all production-ready — Programming Foundations Phase 36, Database Design & SQL Mastery Phase 37, UI/UX Design Foundations Phase 30, Full-Stack Web Dev Phase 32, DevOps Foundations Phase 31) | 🟢 Path is published; all 5 component courses are production-ready (zero new content needed, Phase 38). |
| Cloud Engineer | `cloud-engineer` | 4 (all production-ready — Programming Foundations Phase 36, Computer Networking Foundations Phase 34, Cloud Computing Foundations Phase 39, DevOps Foundations Phase 31) | 🟢 Path is published; all 4 component courses are production-ready. |
| Cyber Security Analyst | `cyber-security-analyst` | 3 (all production-ready — Programming Foundations Phase 36, Computer Networking Foundations Phase 34, Cyber Security Fundamentals Phase 40) | 🟢 Path is published; all 3 component courses are production-ready. |
| Data Scientist | `data-scientist` | 3 (all production-ready — Programming Foundations Phase 36, Database Design & SQL Mastery Phase 37, Data Science Foundations Phase 41) | 🟢 **New Phase 41.** Path is published; all 3 component courses are production-ready. **This is the 6th and final path from Phase 35's original scope — no named path remains unbuilt.** |

## Resource Verification Summary (this phase's additions/reuses)

| Resource | Type | Status |
|---|---|---|
| OpenAI API docs (`developers.openai.com/api/docs/overview`) | Docs | 🟢 Reused, live-verified Phase 25 |
| Anthropic API docs (`platform.claude.com/docs`) | Docs | 🟢 Reused, live-verified Phase 25 |
| Docker docs (`docs.docker.com`) | Docs | 🟢 Reused, live-verified Phase 25 |
| "Prompt Engineering for Generative AI" (Phoenix & Taylor, O'Reilly) | Book | 🟡 Unchanged `NEEDS_VERIFICATION` status from Phase 25 — real per general knowledge, not live-confirmed |
| Figma community (`figma.com/community`) | Video/design resource | 🟡 Unchanged `NEEDS_VERIFICATION` — HTTP 403 on live fetch (bot-blocked, inconclusive) |

No new ISBN, video URL, or documentation link was fabricated this phase. Every new lesson's "Reading"/"Documentation links" fields cite only resources already verified (or already honestly flagged `NEEDS_VERIFICATION`) in `docs/content-library/resource-verification-report.md` — no new unverified claim was introduced.

## Duplication Check

Every module/lesson/project title added this phase was checked against the existing database before creation (via the seed script's own `findFirst` idempotency guard, and independently confirmed by direct query — see the production report's Database/Seed Results section). Zero duplicate courses, modules, lessons, quizzes, or projects exist after this phase.
