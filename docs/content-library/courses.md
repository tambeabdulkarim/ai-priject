# Phoenix Content Library — Courses

**Status:** Master blueprint, Phase 24. One flagship course per category (18 total) is fully specified below — the primary, canonical course for that category. Each course is broken into modules (used by `lessons.md` to derive the lesson-by-lesson breakdown). Additional non-flagship courses per category are noted as "Future Course Backlog" at the end of this document — real, named, scoped ideas, not filler, but not yet fully speced to the lesson level (that's future work, tracked in `content-roadmap.md`).

**Format per course:** Title · Description · Level · Hours · Lessons · Projects · Certificate · Required Skills (entry) · Tags · Module breakdown.

---

## 1. Programming Foundations: Problem Solving with Python & JavaScript

**Description:** A from-zero introduction to programming using two languages side by side — Python for its readability and JavaScript because it's unavoidable on the web — so learners understand which ideas are universal (variables, control flow, functions, data structures) versus language-specific syntax. Ends with learners comfortable reading unfamiliar code and writing their own from a blank file.
**Level:** Beginner · **Hours:** 60 · **Lessons:** 42 · **Projects:** 4 (1 per module) · **Certificate:** Yes, course-level
**Required skills (entry):** none — true zero starting point
**Tags:** `programming`, `python`, `javascript`, `fundamentals`, `beginner`

**Modules:**
1. Programming Basics (variables, types, operators, control flow) — 10 lessons
2. Functions & Program Structure — 8 lessons
3. Data Structures (lists/arrays, dictionaries/objects, sets) — 12 lessons
4. Object-Oriented Basics, Git, and Testing Fundamentals — 12 lessons

---

## 2. AI Foundations: From Theory to Application

**Description:** Covers what AI actually is (and isn't) — search and planning, knowledge representation, intelligent agents — before touching machine learning specifically, so learners have a grounded vocabulary and can evaluate AI claims critically rather than by hype.
**Level:** Intermediate · **Hours:** 45 · **Lessons:** 30 · **Projects:** 3 · **Certificate:** Yes
**Required skills (entry):** Programming Foundations
**Tags:** `ai`, `artificial-intelligence`, `search`, `agents`, `ethics`

**Modules:**
1. Foundations & History of AI — 6 lessons
2. Search & Planning Algorithms — 8 lessons
3. Knowledge Representation & Intelligent Agents — 8 lessons
4. AI Ethics, Safety & Applied AI Survey — 8 lessons

---

## 3. Cyber Security Fundamentals: Defending Modern Systems

**Description:** A defender-first introduction to security: the CIA triad, common vulnerability classes, cryptography basics, and incident response, with hands-on labs against an intentionally vulnerable sample application (never real production systems).
**Level:** Intermediate · **Hours:** 70 · **Lessons:** 48 · **Projects:** 5 · **Certificate:** Yes
**Required skills (entry):** Programming Foundations; Computer Networking Foundations recommended before Module 2
**Tags:** `security`, `cybersecurity`, `owasp`, `cryptography`, `incident-response`

**Modules:**
1. Security Fundamentals & the CIA Triad — 8 lessons
2. Network Security — 10 lessons
3. Application Security (OWASP Top 10) — 12 lessons
4. Cryptography Basics & Identity/Access Management — 10 lessons
5. Incident Response & Ethical Hacking Fundamentals — 8 lessons

---

## 4. Cloud Computing Foundations: AWS, Azure & GCP

**Description:** Provider-agnostic cloud fundamentals first (IaaS/PaaS/SaaS, shared responsibility model), then hands-on modules mirrored across the three major providers so learners can transfer knowledge rather than being locked into one vendor's terminology.
**Level:** Intermediate · **Hours:** 65 · **Lessons:** 44 · **Projects:** 4 · **Certificate:** Yes
**Required skills (entry):** Programming Foundations; Computer Networking Foundations recommended
**Tags:** `cloud`, `aws`, `azure`, `gcp`, `infrastructure`

**Modules:**
1. Cloud Fundamentals & Shared Responsibility — 6 lessons
2. Compute & Storage Services — 12 lessons
3. Cloud Networking & IAM — 12 lessons
4. Infrastructure as Code & Cost Management — 8 lessons
5. Multi-Cloud & Cloud-Native Architecture — 6 lessons

---

## 5. Data Science Foundations: From Data to Decisions

**Description:** Treats data science as a communication discipline as much as a technical one — every technical module ends with "how do you explain this finding honestly to someone who doesn't do statistics."
**Level:** Intermediate · **Hours:** 50 · **Lessons:** 36 · **Projects:** 4 · **Certificate:** Yes
**Required skills (entry):** Programming Foundations
**Tags:** `data-science`, `statistics`, `sql`, `visualization`, `analytics`

**Modules:**
1. Data Collection, Cleaning & SQL for Analysts — 10 lessons
2. Exploratory Data Analysis & Statistics — 10 lessons
3. Data Visualization & Storytelling — 8 lessons
4. Experimentation & A/B Testing — 8 lessons

---

## 6. Machine Learning Foundations: Algorithms That Learn

**Description:** Builds classical ML algorithms from first principles (including implementing a couple from scratch before using a library), so learners understand what's actually happening rather than only calling `.fit()`.
**Level:** Intermediate–Advanced · **Hours:** 60 · **Lessons:** 40 · **Projects:** 5 · **Certificate:** Yes
**Required skills (entry):** Programming Foundations, Data Science Foundations, basic statistics
**Tags:** `machine-learning`, `ml`, `supervised-learning`, `model-evaluation`, `responsible-ai`

**Modules:**
1. Supervised Learning I (Regression) — 8 lessons
2. Supervised Learning II (Classification, Trees, Ensembles) — 10 lessons
3. Unsupervised Learning — 6 lessons
4. Model Evaluation, Validation & Feature Engineering — 8 lessons
5. ML Systems, Pipelines & Responsible ML — 8 lessons

---

## 7. Deep Learning Foundations: Neural Networks in Practice

**Description:** Goes from a single perceptron to a working transformer-based model, with every architecture motivated by a real limitation of the previous one, so the progression makes sense rather than feeling like a list of buzzwords.
**Level:** Advanced · **Hours:** 55 · **Lessons:** 38 · **Projects:** 4 · **Certificate:** Yes
**Required skills (entry):** Machine Learning Foundations
**Tags:** `deep-learning`, `neural-networks`, `cnn`, `transformers`, `mlops`

**Modules:**
1. Neural Network Fundamentals & Backpropagation — 8 lessons
2. Convolutional Networks (Vision) — 8 lessons
3. Sequence Models & Transformers — 10 lessons
4. Transfer Learning & Generative Models (basics) — 6 lessons
5. Model Deployment & Inference Optimization — 6 lessons

---

## 8. Prompt Engineering: Mastering Large Language Models

**Description:** Treats prompting as an engineering discipline with testable, reproducible outputs — not trial and error. Ends with a working RAG pipeline and a real evaluation harness, not just a collection of "good prompts."
**Level:** Beginner–Intermediate · **Hours:** 40 · **Lessons:** 28 · **Projects:** 4 · **Certificate:** Yes
**Required skills (entry):** Programming Foundations
**Tags:** `prompt-engineering`, `llm`, `rag`, `ai`, `genai`

**Modules:**
1. LLM Fundamentals & Prompt Design Patterns — 8 lessons
2. Few-Shot & Chain-of-Thought Techniques — 6 lessons
3. Retrieval-Augmented Generation (RAG) & Tool Calling — 8 lessons
4. Prompt Evaluation & Responsible Use — 6 lessons

---

## 9. DevOps Foundations: CI/CD, Containers & Infrastructure

**Description:** Builds one real pipeline incrementally across the whole course — by the end, learners have taken a sample application from "runs on my machine" to "deploys automatically, monitored, on Kubernetes."
**Level:** Intermediate–Advanced · **Hours:** 70 · **Lessons:** 46 · **Projects:** 5 · **Certificate:** Yes
**Required skills (entry):** Programming Foundations, Computer Networking Foundations
**Tags:** `devops`, `cicd`, `docker`, `kubernetes`, `sre`

**Modules:**
1. CI/CD Fundamentals — 8 lessons
2. Containers (Docker) — 10 lessons
3. Container Orchestration (Kubernetes) — 12 lessons
4. Infrastructure as Code & Configuration Management — 8 lessons
5. Monitoring, Observability & SRE Basics — 8 lessons

---

## 10. Computer Networking Foundations

**Description:** Grounds every abstract model (OSI, TCP/IP) in a concrete, observable exercise — learners run real packet captures and traceroutes rather than only memorizing layer diagrams.
**Level:** Beginner–Intermediate · **Hours:** 25 · **Lessons:** 18 · **Projects:** 2 · **Certificate:** Yes
**Required skills (entry):** none
**Tags:** `networking`, `tcp-ip`, `dns`, `http`, `troubleshooting`

**Modules:**
1. OSI/TCP-IP Models & IP Addressing — 6 lessons
2. Routing, Switching & DNS — 6 lessons
3. HTTP/HTTPS, VPNs & Troubleshooting — 6 lessons

---

## 11. Database Design & SQL Mastery

**Description:** Starts from a deliberately bad schema and refactors it live across the course, so normalization and indexing feel like solving real problems rather than abstract rules.
**Level:** Beginner–Intermediate · **Hours:** 35 · **Lessons:** 24 · **Projects:** 3 · **Certificate:** Yes
**Required skills (entry):** Programming Foundations
**Tags:** `databases`, `sql`, `postgresql`, `schema-design`, `nosql`

**Modules:**
1. Relational Fundamentals & SQL Querying — 8 lessons
2. Schema Design & Normalization — 6 lessons
3. Indexing, Performance & Transactions — 6 lessons
4. NoSQL & Database Administration Basics — 4 lessons

---

## 12. UI/UX Design Foundations

**Description:** Balances craft (visual design fundamentals) with process (research, testing) — learners leave with both a portfolio piece and a repeatable design process, not just a pretty mockup.
**Level:** Beginner–Intermediate · **Hours:** 35 · **Lessons:** 26 · **Projects:** 3 · **Certificate:** Yes
**Required skills (entry):** none
**Tags:** `ui`, `ux`, `design`, `accessibility`, `figma`

**Modules:**
1. Design Fundamentals (color, typography, layout) — 6 lessons
2. User Research & Wireframing — 6 lessons
3. Prototyping, Interaction Design & Accessibility — 8 lessons
4. Design Systems & Usability Testing — 6 lessons

---

## 13. Mobile App Development with React Native

**Description:** Builds one real cross-platform app end-to-end, then contrasts it against native-only constraints so learners understand what "cross-platform" actually trades off.
**Level:** Intermediate · **Hours:** 60 · **Lessons:** 40 · **Projects:** 4 · **Certificate:** Yes
**Required skills (entry):** Programming Foundations, JavaScript fundamentals from Web Development
**Tags:** `mobile`, `react-native`, `ios`, `android`, `app-store`

**Modules:**
1. Mobile Fundamentals & Cross-Platform Setup — 6 lessons
2. Core UI Patterns (Navigation, Lists, Forms) — 10 lessons
3. State Management & Offline Handling — 10 lessons
4. Platform Constraints & App Store Deployment — 8 lessons
5. Capstone Build Sprint — 6 lessons

---

## 14. Full-Stack Web Development with Next.js

**Description:** Phoenix's own flagship web course, deliberately mirroring real production patterns (schema-per-domain backend, component-based frontend, real auth, real deployment) rather than toy-app patterns learners have to unlearn later.
**Level:** Beginner–Advanced · **Hours:** 110 · **Lessons:** 72 · **Projects:** 6 · **Certificate:** Yes
**Required skills (entry):** Programming Foundations
**Tags:** `web-development`, `nextjs`, `react`, `nodejs`, `fullstack`

**Modules:**
1. HTML, CSS & Responsive Layout — 10 lessons
2. JavaScript & TypeScript Fundamentals — 12 lessons
3. Frontend Frameworks (React) — 14 lessons
4. Backend Web Frameworks & REST API Design — 14 lessons
5. Full-Stack Frameworks (Next.js) — 14 lessons
6. Web Performance & Security Basics — 8 lessons

---

## 15. Freelancing Foundations: Building a Client Business

**Description:** Written for someone who already has a marketable skill and needs the business side — pricing, contracts, communication — not another skills course.
**Level:** Beginner · **Hours:** 15 · **Lessons:** 12 · **Projects:** 2 · **Certificate:** Yes
**Required skills (entry):** at least one marketable skill from another category
**Tags:** `freelancing`, `business`, `contracts`, `pricing`

**Modules:**
1. Finding & Pricing Clients — 4 lessons
2. Contracts, Scope & Communication — 4 lessons
3. Portfolio, Invoicing & Scaling — 4 lessons

---

## 16. Entrepreneurship Foundations: From Idea to Startup

**Description:** Runs on one learner-chosen idea across the whole course — validated, scoped into an MVP, and pitched by the end, rather than studying case studies about other companies exclusively.
**Level:** Beginner–Intermediate · **Hours:** 30 · **Lessons:** 20 · **Projects:** 3 · **Certificate:** Yes
**Required skills (entry):** none
**Tags:** `entrepreneurship`, `startups`, `mvp`, `business-model`

**Modules:**
1. Idea Validation & Business Models — 6 lessons
2. MVP Strategy & Go-to-Market — 8 lessons
3. Fundraising Fundamentals & Startup Metrics — 6 lessons

---

## 17. Productivity Systems for Knowledge Workers

**Description:** Short and deliberately practical — every lesson ends with a system the learner implements that week, not just theory.
**Level:** Beginner · **Hours:** 10 · **Lessons:** 8 · **Projects:** 1 · **Certificate:** Yes
**Required skills (entry):** none
**Tags:** `productivity`, `time-management`, `focus`, `habits`

**Modules:**
1. Time Management & Deep Work — 4 lessons
2. Goal Setting, Automation & Habits — 4 lessons

---

## 18. Career Preparation: Resumes, Interviews & Job Search

**Description:** Uses the learner's own completed path/portfolio as raw material throughout — resume, interview stories, and negotiation practice are all built from real evidence the learner already has by this point.
**Level:** Beginner–Intermediate · **Hours:** 20 · **Lessons:** 14 · **Projects:** 2 · **Certificate:** Yes
**Required skills (entry):** at least one completed learning path or equivalent portfolio
**Tags:** `career`, `interviews`, `resume`, `negotiation`, `job-search`

**Modules:**
1. Resume & Portfolio Writing — 4 lessons
2. Technical & Behavioral Interview Preparation — 6 lessons
3. Salary Negotiation & Job Search Strategy — 4 lessons

---

## Duplication Check

All 18 course titles, module names, and tag sets were checked pairwise for overlap. No two flagship courses cover the same module content — where two paths share a subject (e.g. "cloud security" appears in both Cyber Security Fundamentals and Cloud Computing Foundations), each course covers it from its own category's core lens (defender-first vs. infrastructure-first) and `learning-paths.md` explicitly marks the second occurrence as a **subset/elective module**, not a duplicate full course. See `quality-standards.md` for the standing duplication-prevention rule.

## Future Course Backlog (named, scoped, not yet lesson-level speced)

Real, specific second-tier courses identified for each category, to be fully speced in a future content phase (tracked in `content-roadmap.md`): *Advanced Python for Data Engineers* (Programming), *Applied NLP with Transformers* (AI), *Penetration Testing in Practice* (Cyber Security), *Kubernetes at Scale* (Cloud/DevOps), *Time Series Forecasting* (Data Science), *MLOps: Productionizing Models* (Machine Learning), *Generative Image Models in Practice* (Deep Learning), *Building AI Agents & Tool Use* (Prompt Engineering), *Terraform in Depth* (DevOps), *Network Security Monitoring* (Networking), *PostgreSQL Performance Tuning* (Databases), *Design Systems at Scale* (UI/UX), *Native iOS with Swift* (Mobile), *TypeScript in Depth* (Web Development), *Pricing Strategy for Freelancers* (Business), *Fundraising Deep Dive* (Entrepreneurship), *Team Productivity & Async Culture* (Productivity), *Technical Leadership Interviews* (Career Preparation).
