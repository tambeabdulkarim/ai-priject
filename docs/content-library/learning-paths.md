# Phoenix Content Library — Learning Paths

**Status:** Master blueprint, Phase 24. A learning path is a staged sequence of courses (from `courses.md`) plus tier projects (from `projects.md`) that takes a learner from zero (or from a stated prerequisite) to job-ready in a defined role, ending in a path certificate (requirements in `certificates.md`).

Every path below follows the same structure: **Stage 0 (prerequisite, if any) → Stage 1–N (core courses, in order) → Capstone Project → Career Preparation → Certificate.**

---

## 1. AI Engineer

**Target role:** builds and ships production AI/ML features — not a research scientist role.
**Total estimated duration:** 9–12 months (full-time equivalent: 4–5 months)
**Entry prerequisite:** Programming Foundations (category 2)

| Stage | Course (from `courses.md`) | Category | Est. hours |
|---|---|---|---|
| 1 | Programming Foundations: Problem Solving with Python & JavaScript | Programming | 60 |
| 2 | Database Design & SQL Mastery | Databases | 35 |
| 3 | Data Science Foundations: From Data to Decisions | Data Science | 50 |
| 4 | AI Foundations: From Theory to Application | Artificial Intelligence | 45 |
| 5 | Machine Learning Foundations: Algorithms That Learn | Machine Learning | 60 |
| 6 | Deep Learning Foundations: Neural Networks in Practice | Deep Learning | 55 |
| 7 | Prompt Engineering: Mastering Large Language Models | Prompt Engineering | 30 |
| 8 | DevOps Foundations *(model deployment modules only — see course notes)* | DevOps | 20 (subset) |
| Capstone | AI Engineer Capstone (see `projects.md`) | — | 40 |
| Closing | Career Preparation: Resumes, Interviews & Job Search | Career Preparation | 20 |

**Learning outcomes (path-level):** design, train, evaluate, and deploy a machine learning or deep learning model as a real, callable service; build an LLM-powered feature using sound prompt-engineering and RAG practices; explain the tradeoffs between classical ML and deep learning for a given problem; ship a model behind a monitored production endpoint, not just a notebook.

---

## 2. Backend Engineer

**Target role:** designs and builds server-side systems, APIs, and data layers.
**Total estimated duration:** 6–8 months (full-time equivalent: 3–4 months)
**Entry prerequisite:** none beyond basic computer literacy

| Stage | Course | Category | Est. hours |
|---|---|---|---|
| 1 | Programming Foundations: Problem Solving with Python & JavaScript | Programming | 60 |
| 2 | Database Design & SQL Mastery | Databases | 35 |
| 3 | Full-Stack Web Development with Next.js *(backend/API modules)* | Web Development | 40 (subset) |
| 4 | Computer Networking Foundations | Networking | 25 |
| 5 | Cyber Security Fundamentals *(application security modules)* | Cyber Security | 20 (subset) |
| 6 | DevOps Foundations: CI/CD, Containers & Infrastructure | DevOps | 60 |
| Capstone | Backend Engineer Capstone (see `projects.md`) | — | 40 |
| Closing | Career Preparation: Resumes, Interviews & Job Search | Career Preparation | 20 |

**Learning outcomes:** design a normalized database schema and write efficient SQL; build a REST API with authentication, validation, and proper error handling; containerize and deploy a backend service through a real CI/CD pipeline; secure an API against the OWASP Top 10; reason about scalability and reliability tradeoffs in a system design.

---

## 3. Frontend Engineer

**Target role:** builds user-facing web interfaces with strong UX and performance awareness.
**Total estimated duration:** 5–7 months (full-time equivalent: 3 months)
**Entry prerequisite:** none beyond basic computer literacy

| Stage | Course | Category | Est. hours |
|---|---|---|---|
| 1 | Programming Foundations: Problem Solving with Python & JavaScript | Programming | 60 |
| 2 | UI/UX Design Foundations | UI/UX | 35 |
| 3 | Full-Stack Web Development with Next.js *(frontend modules)* | Web Development | 70 (subset) |
| Capstone | Frontend Engineer Capstone (see `projects.md`) | — | 35 |
| Closing | Career Preparation: Resumes, Interviews & Job Search | Career Preparation | 20 |

**Learning outcomes:** build accessible, responsive, component-based interfaces; manage complex client-side state correctly; apply core UX and design-system thinking to real UI decisions; optimize a frontend application for real-world performance (Core Web Vitals level understanding); integrate a frontend cleanly against a real backend API.

---

## 4. Full Stack Engineer

**Target role:** owns a feature end-to-end, frontend to database.
**Total estimated duration:** 9–11 months (full-time equivalent: 5 months)
**Entry prerequisite:** none beyond basic computer literacy — this path supersets Backend Engineer + Frontend Engineer

| Stage | Course | Category | Est. hours |
|---|---|---|---|
| 1 | Programming Foundations: Problem Solving with Python & JavaScript | Programming | 60 |
| 2 | Database Design & SQL Mastery | Databases | 35 |
| 3 | UI/UX Design Foundations | UI/UX | 35 |
| 4 | Full-Stack Web Development with Next.js *(full course, both tracks)* | Web Development | 110 |
| 5 | DevOps Foundations: CI/CD, Containers & Infrastructure | DevOps | 60 |
| Elective | Mobile App Development with React Native *(optional)* | Mobile Development | 60 |
| Capstone | Full Stack Engineer Capstone (see `projects.md`) | — | 50 |
| Closing | Career Preparation: Resumes, Interviews & Job Search | Career Preparation | 20 |

**Learning outcomes:** ship a complete application — UI, API, database, auth, deployment — as a single owned unit; make sound architectural tradeoffs across the whole stack; debug an issue across the frontend/backend/database boundary; collaborate on a codebase using the same patterns Phoenix itself uses (schema-per-domain backend, component-based frontend).

---

## 5. Data Scientist

**Target role:** turns data into decisions; builds and validates statistical/ML models for analysis.
**Total estimated duration:** 8–10 months (full-time equivalent: 4–5 months)
**Entry prerequisite:** Programming Foundations; basic statistics recommended

| Stage | Course | Category | Est. hours |
|---|---|---|---|
| 1 | Programming Foundations: Problem Solving with Python & JavaScript | Programming | 60 |
| 2 | Database Design & SQL Mastery | Databases | 35 |
| 3 | Data Science Foundations: From Data to Decisions | Data Science | 50 |
| 4 | Machine Learning Foundations: Algorithms That Learn | Machine Learning | 60 |
| Elective | Deep Learning Foundations *(introductory modules)* | Deep Learning | 20 (subset) |
| Capstone | Data Scientist Capstone (see `projects.md`) | — | 40 |
| Closing | Career Preparation: Resumes, Interviews & Job Search | Career Preparation | 20 |

**Learning outcomes:** take a raw, messy dataset to a validated, communicated finding; design and analyze a proper A/B test; build and validate a predictive model without leaking information from the future; present a data-driven recommendation to a non-technical stakeholder with honest uncertainty framing.

---

## 6. Cloud Engineer

**Target role:** designs, provisions, and operates cloud infrastructure.
**Total estimated duration:** 6–8 months (full-time equivalent: 3–4 months)
**Entry prerequisite:** Programming Foundations; Networking Foundations recommended alongside

| Stage | Course | Category | Est. hours |
|---|---|---|---|
| 1 | Programming Foundations: Problem Solving with Python & JavaScript | Programming | 60 |
| 2 | Computer Networking Foundations | Networking | 25 |
| 3 | Cloud Computing Foundations: AWS, Azure & GCP | Cloud Computing | 65 |
| 4 | DevOps Foundations: CI/CD, Containers & Infrastructure | DevOps | 60 |
| Capstone | Cloud Engineer Capstone (see `projects.md`) | — | 40 |
| Closing | Career Preparation: Resumes, Interviews & Job Search | Career Preparation | 20 |

**Learning outcomes:** design a secure, cost-aware cloud architecture on at least one major provider; provision infrastructure entirely as code, reviewable and reproducible; implement least-privilege identity and access management; design for horizontal scalability and graceful failure; operate a workload with real monitoring and alerting.

---

## 7. Cyber Security Analyst

**Target role:** defends systems, investigates incidents, and reduces organizational risk.
**Total estimated duration:** 8–10 months (full-time equivalent: 4–5 months)
**Entry prerequisite:** Programming Foundations, Computer Networking Foundations

| Stage | Course | Category | Est. hours |
|---|---|---|---|
| 1 | Programming Foundations: Problem Solving with Python & JavaScript | Programming | 60 |
| 2 | Computer Networking Foundations | Networking | 25 |
| 3 | Database Design & SQL Mastery *(security-relevant modules)* | Databases | 15 (subset) |
| 4 | Cyber Security Fundamentals: Defending Modern Systems | Cyber Security | 70 |
| Elective | Cloud Computing Foundations *(cloud security modules)* | Cloud Computing | 15 (subset) |
| Capstone | Cyber Security Analyst Capstone (see `projects.md`) | — | 40 |
| Closing | Career Preparation: Resumes, Interviews & Job Search | Career Preparation | 20 |

**Learning outcomes:** apply the CIA triad and threat-modeling to a real system; identify, exploit (in an authorized lab), and remediate common vulnerability classes; run a structured incident-response process end-to-end; explain and apply core cryptography correctly; understand baseline compliance obligations (e.g. GDPR-level awareness) without practicing law.

---

## 8. DevOps Engineer

**Target role:** builds and operates the delivery pipeline and platform other engineers rely on.
**Total estimated duration:** 6–8 months (full-time equivalent: 3–4 months)
**Entry prerequisite:** Programming Foundations, Computer Networking Foundations

| Stage | Course | Category | Est. hours |
|---|---|---|---|
| 1 | Programming Foundations: Problem Solving with Python & JavaScript | Programming | 60 |
| 2 | Computer Networking Foundations | Networking | 25 |
| 3 | Cloud Computing Foundations: AWS, Azure & GCP | Cloud Computing | 65 |
| 4 | DevOps Foundations: CI/CD, Containers & Infrastructure | DevOps | 70 |
| Capstone | DevOps Engineer Capstone (see `projects.md`) | — | 40 |
| Closing | Career Preparation: Resumes, Interviews & Job Search | Career Preparation | 20 |

**Learning outcomes:** design a CI/CD pipeline that catches real problems before production; containerize and orchestrate workloads correctly at a professional standard; write Infrastructure-as-Code that's safe to review and roll back; build monitoring/alerting that reflects real user impact, not noise; run a blameless incident postmortem.

---

## 9. Prompt Engineer

**Target role:** designs, tests, and productionizes prompts and LLM-powered workflows.
**Total estimated duration:** 3–4 months (full-time equivalent: 6–8 weeks) — the fastest path in the library
**Entry prerequisite:** Programming Foundations *(a lightweight version is acceptable — this path is intentionally the most accessible AI-adjacent path)*

| Stage | Course | Category | Est. hours |
|---|---|---|---|
| 1 | Programming Foundations *(fundamentals modules only)* | Programming | 30 (subset) |
| 2 | AI Foundations: From Theory to Application *(LLM-focused modules)* | Artificial Intelligence | 20 (subset) |
| 3 | Prompt Engineering: Mastering Large Language Models | Prompt Engineering | 40 |
| Capstone | Prompt Engineer Capstone (see `projects.md`) | — | 30 |
| Closing | Career Preparation: Resumes, Interviews & Job Search | Career Preparation | 20 |

**Learning outcomes:** design prompts that are reliable and reproducible, not lucky; apply few-shot, chain-of-thought, and structured-output techniques appropriately; build a working RAG pipeline grounded in real source documents; write systematic evaluations for prompt/output quality; correctly and honestly explain an LLM's limitations to stakeholders who may be over-trusting it.

---

## Path Comparison at a Glance

| Path | Duration (FT equiv.) | Entry difficulty | Core categories |
|---|---|---|---|
| Prompt Engineer | 6–8 weeks | Beginner | Programming, AI, Prompt Engineering |
| Productivity/Freelancing/Entrepreneurship *(non-technical tracks, not full "paths" — see `categories.md`)* | 2–6 weeks each | Beginner | Standalone |
| Frontend Engineer | 3 months | Beginner | Programming, UI/UX, Web Dev |
| Backend Engineer | 3–4 months | Beginner | Programming, Databases, Web Dev, DevOps |
| Cloud Engineer | 3–4 months | Beginner–Intermediate | Networking, Cloud, DevOps |
| DevOps Engineer | 3–4 months | Intermediate | Networking, Cloud, DevOps |
| Data Scientist | 4–5 months | Intermediate | Programming, Databases, Data Science, ML |
| Cyber Security Analyst | 4–5 months | Intermediate | Networking, Databases, Cyber Security |
| Full Stack Engineer | 5 months | Beginner–Intermediate | Programming, Databases, UI/UX, Web Dev, DevOps |
| AI Engineer | 4–5 months | Intermediate–Advanced | Programming, Databases, Data Science, AI, ML, Deep Learning, Prompt Engineering |
