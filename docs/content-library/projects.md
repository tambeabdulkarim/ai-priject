# Phoenix Content Library — Practical Projects

**Status:** Master blueprint, Phase 24. Every learning path (`learning-paths.md`) gets a 4-tier project sequence: Beginner → Intermediate → Advanced → Professional Capstone. These are distinct from the smaller per-module projects referenced in `courses.md`/`lessons.md` (e.g. "Temperature Converter") — path-level projects are larger, portfolio-grade, and assessed against the certificate rubric in `certificates.md`.

**Design rule applied throughout:** every project has a stated real-world scenario, explicit deliverables, and an explicit evaluation focus — no "build a thing" without a reason a real employer would care about it.

---

## 1. AI Engineer

- **Beginner — Sentiment Classifier API:** train a classical ML text-classification model and serve it behind a simple REST endpoint. *Evaluation focus:* correct train/test split, no data leakage, basic API correctness.
- **Intermediate — Image Classifier with Transfer Learning:** fine-tune a pretrained CNN on a custom small dataset and evaluate it properly (confusion matrix, not just accuracy). *Evaluation focus:* correct use of transfer learning, honest evaluation metrics.
- **Advanced — RAG-Powered Document Assistant:** build a retrieval-augmented generation system over a real document set (e.g. a product's own documentation) with citations back to source. *Evaluation focus:* grounding correctness, hallucination rate, retrieval quality.
- **Professional Capstone — End-to-End AI Feature:** design, train, deploy, and monitor a complete AI-powered feature (model + API + basic monitoring dashboard) for a scenario of the learner's choice, presented as if pitching it to a product team. *Evaluation focus:* production-readiness, monitoring, honest limitations documentation.

## 2. Backend Engineer

- **Beginner — Task API:** a CRUD REST API for a task-tracking app with proper validation and error handling.
- **Intermediate — Multi-User API with Auth:** add real authentication/authorization (roles, permissions) and a normalized relational schema to the Beginner project.
- **Advanced — Rate-Limited, Cached Public API:** add rate limiting, caching, pagination, and API versioning to a larger dataset-backed API; write load-test evidence of correct behavior under stress.
- **Professional Capstone — Production-Grade Service:** a complete backend service with CI/CD, containerized deployment, structured logging, and a health-check endpoint — modeled on the same standards Phoenix's own `apps/api` was held to. *Evaluation focus:* real deployment, real observability, not just passing tests locally.

## 3. Frontend Engineer

- **Beginner — Responsive Landing Page:** a fully responsive, accessible marketing page built from a design file, no framework required.
- **Intermediate — Component-Based Dashboard:** a data dashboard built with a frontend framework, real client-side state, and at least 3 reusable components.
- **Advanced — Full CRUD App Against a Real API:** a frontend application that consumes a real (learner's own or provided) REST API, with optimistic UI updates and proper error/loading states.
- **Professional Capstone — Performance-Optimized Production App:** a polished, accessible, performance-audited application (Core Web Vitals-level review) deployed to a real hosting provider. *Evaluation focus:* accessibility, performance, real UX polish.

## 4. Full Stack Engineer

- **Beginner — Personal Blog Platform:** a simple full-stack app (posts, comments) with a database, API, and frontend.
- **Intermediate — Marketplace MVP:** a two-sided marketplace (listings + basic transactions, no real payment processing required) with authentication and role-based access.
- **Advanced — Real-Time Collaboration Feature:** add a real-time feature (e.g. live updates via websockets/polling) to the Intermediate project, with proper state synchronization.
- **Professional Capstone — Production SaaS Slice:** a complete, deployed, small SaaS-style product slice — auth, database, API, frontend, deployment, and monitoring — explicitly modeled on Phoenix's own architecture patterns (schema-per-domain backend, component-based frontend). *Evaluation focus:* end-to-end ownership and architectural soundness.

## 5. Data Scientist

- **Beginner — Exploratory Analysis Report:** a full EDA + cleaning pass on a real public dataset, delivered as a clear written report for a non-technical reader.
- **Intermediate — A/B Test Design & Analysis:** design a statistically sound experiment for a stated business question, simulate or use provided data, and report results with correct uncertainty framing.
- **Advanced — Predictive Model with Business Recommendation:** build a validated predictive model and translate it into a specific, actionable business recommendation (not just a model score).
- **Professional Capstone — End-to-End Data Product:** a complete analysis-to-dashboard pipeline on a real dataset, presented as if to a company's leadership team, including caveats about data quality and confidence. *Evaluation focus:* rigor, honesty about uncertainty, communication clarity.

## 6. Cloud Engineer

- **Beginner — Static Site on Cloud Storage + CDN:** deploy a static site using cloud storage and a CDN, with a custom domain and HTTPS.
- **Intermediate — Auto-Scaling Web App:** deploy a web application behind a load balancer with auto-scaling rules, provisioned entirely as code.
- **Advanced — Multi-Tier Secure Architecture:** a 3-tier architecture (web/app/data) with proper network segmentation, least-privilege IAM, and secrets management.
- **Professional Capstone — Cost-Optimized, Monitored Production Environment:** a complete cloud environment with IaC, monitoring/alerting, a documented disaster-recovery plan, and a cost-optimization writeup with real tradeoffs explained. *Evaluation focus:* security posture, cost-awareness, operational readiness.

## 7. Cyber Security Analyst

- **Beginner — Vulnerability Assessment Report:** run an authorized scan against a provided lab environment and write a clear, prioritized vulnerability report.
- **Intermediate — Secure Code Review & Remediation:** find and fix real OWASP Top 10 vulnerabilities in a provided intentionally-vulnerable sample application.
- **Advanced — Incident Response Simulation:** run a full incident-response process against a simulated breach scenario, from detection to postmortem.
- **Professional Capstone — Security Assessment of a Full Application:** a complete security assessment (network + application + IAM review) of a provided multi-tier sample system, delivered as a professional-grade report with prioritized, actionable remediation steps. *Evaluation focus:* thoroughness, correct prioritization, professional reporting quality.

## 8. DevOps Engineer

- **Beginner — Containerized App with Basic CI:** containerize an application and set up a CI pipeline that runs tests on every push.
- **Intermediate — Full CI/CD to a Real Environment:** extend the CI pipeline to CD, deploying automatically to a real (staging) environment on merge.
- **Advanced — Kubernetes Deployment with Observability:** deploy the application to Kubernetes with proper health checks, resource limits, and a monitoring/alerting stack.
- **Professional Capstone — Complete Platform for a Team:** a full internal developer platform slice — IaC, CI/CD, container orchestration, monitoring, and a documented incident-response runbook — as if handing it to a real engineering team. *Evaluation focus:* reproducibility, documentation quality, operational maturity.

## 9. Prompt Engineer

- **Beginner — Prompt Pattern Library:** a tested library of 10+ reusable prompt templates across different task types (summarization, extraction, classification, generation).
- **Intermediate — Evaluation Harness for a Prompted Task:** build a systematic evaluation set (inputs + expected properties) for a chosen task and use it to compare 3 different prompt designs objectively.
- **Advanced — RAG Pipeline with Citations:** a retrieval-augmented pipeline grounded in a real document set, returning verifiable citations, with a measured hallucination rate.
- **Professional Capstone — Production Prompt-Powered Feature:** a complete, tested, documented LLM-powered feature (e.g. a support-ticket triager or a document summarizer) with a written evaluation report and honest limitations section. *Evaluation focus:* reliability, systematic evaluation (not vibes-based), honest documentation of failure modes.

---

## Duplication Check

All 36 path-level projects were checked pairwise for scenario overlap. Two pairs share a surface theme (Backend Engineer's "Task API" and Full Stack Engineer's "Personal Blog Platform" are both CRUD apps) but are differentiated by explicit evaluation focus and by which layer of the stack each path's projects are scoped to (Backend Engineer's stays API-only; Full Stack Engineer's spans the full stack) — this is intentional layering, not duplication, and is documented here per `quality-standards.md`'s duplication-prevention rule.
