# Phoenix Content Library — Categories

**Status:** Master blueprint, Phase 24. Not yet implemented in the database — no seed data, no application code changed. This document defines the 18 top-level content categories that structure everything else in `docs/content-library/`.

**How to read this document:** each category lists its subcategories, the learning path(s) it feeds into (full detail in `learning-paths.md`), its flagship course (full detail in `courses.md`), prerequisites, and learning outcomes. Difficulty and duration are estimates for the *category as a whole* (i.e., going from zero to job-ready in that category) — individual course-level estimates are in `courses.md`.

---

## 1. Artificial Intelligence

**Subcategories:** AI Foundations & History · Search & Planning Algorithms · Knowledge Representation & Reasoning · Intelligent Agents · AI Ethics & Safety · Applied AI (Vision, Speech, Recommendation Systems)

**Feeds into:** AI Engineer path, Prompt Engineer path
**Flagship course:** *AI Foundations: From Theory to Application*
**Prerequisites:** Programming Foundations (category 2); basic linear algebra and probability are strongly recommended, not required to start
**Difficulty:** Intermediate → Advanced (progression)
**Estimated duration (category, zero to job-ready):** 4–6 months alongside Machine Learning and Deep Learning
**Learning outcomes:** explain how AI systems represent problems and search for solutions; distinguish symbolic AI from statistical/learning-based AI; evaluate an AI system's capabilities and limitations without overclaiming; design a basic intelligent agent for a bounded problem; articulate core AI safety and ethics considerations before shipping an AI feature.

## 2. Programming

**Subcategories:** Programming Fundamentals (variables, control flow, functions) · Data Structures & Algorithms · Object-Oriented Programming · Functional Programming · Version Control (Git) · Testing & Debugging · Software Design Principles

**Feeds into:** every technical path (foundation category — Backend, Frontend, Full Stack, Data Scientist, Cloud, DevOps, Cyber Security, AI Engineer, Prompt Engineer all assume this category first)
**Flagship course:** *Programming Foundations: Problem Solving with Python & JavaScript*
**Prerequisites:** none — this is the true entry point of the entire library
**Difficulty:** Beginner → Intermediate
**Estimated duration:** 2–3 months to a solid foundation
**Learning outcomes:** write, read, and debug programs in at least one language fluently; choose an appropriate data structure for a given problem; explain time/space complexity at a basic level; use Git for version control in a real workflow; write and run automated tests for your own code.

## 3. Cyber Security

**Subcategories:** Security Fundamentals & CIA Triad · Network Security · Application Security (OWASP Top 10) · Cryptography Basics · Identity & Access Management · Incident Response · Ethical Hacking & Penetration Testing Fundamentals · Security Compliance (GDPR, SOC 2 awareness)

**Feeds into:** Cyber Security Analyst path
**Flagship course:** *Cyber Security Fundamentals: Defending Modern Systems*
**Prerequisites:** Programming Foundations; Networking Foundations (category 10) strongly recommended before Network Security subcategory
**Difficulty:** Intermediate → Advanced
**Estimated duration:** 5–7 months to analyst-ready
**Learning outcomes:** apply the CIA triad to real system designs; identify and remediate OWASP Top 10 vulnerabilities in a sample application; explain symmetric vs. asymmetric cryptography and where each applies; run a structured incident-response process for a simulated breach; perform a basic authorized penetration test against a lab environment.

## 4. Cloud Computing

**Subcategories:** Cloud Fundamentals (IaaS/PaaS/SaaS) · Compute Services · Storage Services · Networking in the Cloud · Identity & Access Management (Cloud) · Infrastructure as Code · Cost Management & Optimization · Multi-Cloud & Cloud-Native Architecture

**Feeds into:** Cloud Engineer path, DevOps Engineer path
**Flagship course:** *Cloud Computing Foundations: AWS, Azure & GCP*
**Prerequisites:** Programming Foundations; Networking Foundations recommended
**Difficulty:** Intermediate
**Estimated duration:** 3–5 months to a first cloud certification level
**Learning outcomes:** explain the shared responsibility model; provision and secure compute/storage/networking resources on at least one major cloud provider; write basic Infrastructure-as-Code definitions; estimate and control cloud spend; design a simple cloud-native, horizontally scalable architecture.

## 5. Data Science

**Subcategories:** Data Collection & Cleaning · Exploratory Data Analysis · Statistics for Data Science · Data Visualization · SQL for Analysts · Feature Engineering · Experimentation & A/B Testing · Data Storytelling & Communication

**Feeds into:** Data Scientist path
**Flagship course:** *Data Science Foundations: From Data to Decisions*
**Prerequisites:** Programming Foundations; Databases Foundations (category 11) recommended alongside
**Difficulty:** Intermediate
**Estimated duration:** 4–6 months to a portfolio-ready analyst level
**Learning outcomes:** clean and validate a real-world messy dataset; run and interpret an exploratory data analysis; design a statistically valid A/B test; build a clear, honest data visualization for a non-technical audience; communicate a data-driven recommendation with appropriate caveats about uncertainty.

## 6. Machine Learning

**Subcategories:** Supervised Learning · Unsupervised Learning · Model Evaluation & Validation · Feature Engineering for ML · Classical ML Algorithms (regression, trees, SVM, ensembles) · ML Systems & Pipelines · Responsible ML (bias, fairness)

**Feeds into:** AI Engineer path, Data Scientist path
**Flagship course:** *Machine Learning Foundations: Algorithms That Learn*
**Prerequisites:** Programming Foundations, Data Science Foundations; basic statistics required
**Difficulty:** Intermediate → Advanced
**Estimated duration:** 4–6 months
**Learning outcomes:** frame a real problem as a supervised or unsupervised learning task; train, validate, and tune a classical ML model without overfitting; select an appropriate evaluation metric for a given business problem; build a reproducible ML pipeline from raw data to prediction; identify and mitigate an obvious source of bias in a trained model.

## 7. Deep Learning

**Subcategories:** Neural Network Fundamentals · Convolutional Neural Networks (Vision) · Recurrent Networks & Sequence Models · Transformers & Attention · Transfer Learning · Model Deployment & Inference Optimization · Generative Models (basics)

**Feeds into:** AI Engineer path
**Flagship course:** *Deep Learning Foundations: Neural Networks in Practice*
**Prerequisites:** Machine Learning Foundations; comfort with Python and basic calculus/linear algebra
**Difficulty:** Advanced
**Estimated duration:** 3–5 months, after Machine Learning
**Learning outcomes:** explain forward/backward propagation and why deep networks can learn complex functions; build and train a CNN for an image task and a transformer-based model for a text task; apply transfer learning to a new task with limited data; deploy a trained model behind a real inference endpoint; recognize the resource/cost tradeoffs of different model architectures.

## 8. Prompt Engineering

**Subcategories:** LLM Fundamentals · Prompt Design Patterns · Few-Shot & Chain-of-Thought Techniques · Retrieval-Augmented Generation (RAG) · Function/Tool Calling · Prompt Evaluation & Testing · Responsible AI Use & Limitations

**Feeds into:** Prompt Engineer path, AI Engineer path
**Flagship course:** *Prompt Engineering: Mastering Large Language Models*
**Prerequisites:** Programming Foundations; AI Foundations recommended, not required
**Difficulty:** Beginner → Intermediate (the most accessible entry point into the AI category cluster)
**Estimated duration:** 6–10 weeks
**Learning outcomes:** design reliable, reproducible prompts for a defined task; apply few-shot and chain-of-thought techniques to improve output quality; build a basic RAG pipeline that grounds model output in real documents; write systematic evaluations for prompt quality rather than relying on spot-checking; correctly describe an LLM's real limitations (hallucination, knowledge cutoffs, lack of guaranteed correctness) to a non-technical stakeholder.

## 9. DevOps

**Subcategories:** CI/CD Fundamentals · Containers (Docker) · Container Orchestration (Kubernetes) · Infrastructure as Code · Configuration Management · Monitoring & Observability · Site Reliability Engineering Basics · DevSecOps

**Feeds into:** DevOps Engineer path, Cloud Engineer path
**Flagship course:** *DevOps Foundations: CI/CD, Containers & Infrastructure*
**Prerequisites:** Programming Foundations, Networking Foundations; Cloud Computing Foundations recommended alongside
**Difficulty:** Intermediate → Advanced
**Estimated duration:** 4–6 months
**Learning outcomes:** design and implement a real CI/CD pipeline; containerize an application correctly (multi-stage builds, minimal images); deploy and manage a workload on Kubernetes; write Infrastructure-as-Code that's reviewable and reproducible; set up meaningful monitoring/alerting rather than noisy dashboards; run a basic incident postmortem.

## 10. Networking

**Subcategories:** Networking Fundamentals (OSI/TCP-IP models) · IP Addressing & Subnetting · Routing & Switching · DNS · HTTP/HTTPS & Web Protocols · VPNs & Network Security Basics · Network Troubleshooting

**Feeds into:** Cyber Security Analyst path, Cloud Engineer path, DevOps Engineer path
**Flagship course:** *Computer Networking Foundations*
**Prerequisites:** none beyond basic computer literacy — can be taken alongside Programming Foundations
**Difficulty:** Beginner → Intermediate
**Estimated duration:** 6–10 weeks
**Learning outcomes:** explain the OSI and TCP/IP models and where common protocols sit; design a subnetting scheme for a small network; explain how DNS resolution actually works end-to-end; diagnose a basic connectivity problem using standard tools (ping, traceroute, packet capture); explain the HTTPS handshake at a working level.

## 11. Databases

**Subcategories:** Relational Database Fundamentals · SQL Querying · Database Design & Normalization · Indexing & Query Performance · Transactions & Concurrency · NoSQL Databases · Database Administration Basics

**Feeds into:** Backend Engineer path, Full Stack Engineer path, Data Scientist path, Cyber Security Analyst path (security subcategory)
**Flagship course:** *Database Design & SQL Mastery*
**Prerequisites:** Programming Foundations
**Difficulty:** Beginner → Intermediate
**Estimated duration:** 6–10 weeks
**Learning outcomes:** design a normalized relational schema for a real application; write correct, efficient SQL for common query patterns; explain how an index affects query performance and when to add one; explain transaction isolation levels and a concrete scenario where the wrong one causes a bug; choose between a relational and a NoSQL store for a given use case with real justification.

## 12. UI / UX

**Subcategories:** Design Fundamentals (color, typography, layout) · User Research · Wireframing & Prototyping · Interaction Design · Accessibility (a11y) · Design Systems · Usability Testing

**Feeds into:** Frontend Engineer path, Full Stack Engineer path
**Flagship course:** *UI/UX Design Foundations*
**Prerequisites:** none — this category can be started immediately, no programming background required
**Difficulty:** Beginner → Intermediate
**Estimated duration:** 2–3 months
**Learning outcomes:** conduct a basic user research interview and synthesize findings; wireframe and prototype a real interface at increasing fidelity; apply WCAG-level accessibility basics to a design; build and use a small design system consistently; run a usability test and translate findings into design changes.

## 13. Mobile Development

**Subcategories:** Mobile Fundamentals (platform differences) · Cross-Platform Development · Native iOS Basics · Native Android Basics · Mobile UI Patterns · State Management · App Store Deployment

**Feeds into:** Full Stack Engineer path (as an elective specialization)
**Flagship course:** *Mobile App Development with React Native*
**Prerequisites:** Programming Foundations, Web Development Foundations (JavaScript) recommended
**Difficulty:** Intermediate
**Estimated duration:** 3–4 months
**Learning outcomes:** build a cross-platform mobile app with a shared codebase; implement common mobile UI patterns correctly (navigation, lists, forms, offline state); manage app state in a mobile context; handle platform-specific constraints (permissions, lifecycle); prepare and submit a real app for store review.

## 14. Web Development

**Subcategories:** HTML & CSS Fundamentals · JavaScript Fundamentals · Frontend Frameworks (React) · Backend Web Frameworks (Node.js/Express, or equivalent) · REST & API Design · Full-Stack Frameworks (Next.js) · Web Performance · Web Security Basics

**Feeds into:** Frontend Engineer path, Backend Engineer path, Full Stack Engineer path
**Flagship course:** *Full-Stack Web Development with Next.js*
**Prerequisites:** Programming Foundations
**Difficulty:** Beginner → Advanced (this category spans the widest range)
**Estimated duration:** 5–8 months, zero to full-stack job-ready
**Learning outcomes:** build a semantic, accessible, responsive web page from scratch; write idiomatic modern JavaScript/TypeScript; build a component-based frontend application with real state management; design and implement a REST API with proper validation and error handling; ship a real full-stack application with authentication, a database, and a deployed production build.

## 15. Business & Freelancing

**Subcategories:** Freelance Fundamentals · Finding & Pricing Clients · Contracts & Scope Management · Client Communication · Portfolio Building · Invoicing & Taxes (general principles, not jurisdiction-specific legal/tax advice) · Scaling a Freelance Practice

**Feeds into:** standalone track, complements every technical path
**Flagship course:** *Freelancing Foundations: Building a Client Business*
**Prerequisites:** at least one marketable technical or creative skill (from any other category)
**Difficulty:** Beginner
**Estimated duration:** 4–6 weeks
**Learning outcomes:** write a scope-of-work that protects both you and the client; price a project using at least two different pricing models and justify the choice; run a client discovery call that surfaces real requirements; build a portfolio that demonstrates outcomes, not just tasks; set up a basic, repeatable invoicing workflow.

## 16. Entrepreneurship

**Subcategories:** Idea Validation · Business Models · Minimum Viable Product (MVP) Strategy · Fundraising Fundamentals (general concepts only) · Go-to-Market Strategy · Startup Metrics · Team Building & Early Hiring

**Feeds into:** standalone track
**Flagship course:** *Entrepreneurship Foundations: From Idea to Startup*
**Prerequisites:** none required; a technical or domain background is helpful but not mandatory
**Difficulty:** Beginner → Intermediate
**Estimated duration:** 2–3 months
**Learning outcomes:** validate a business idea against real evidence before building; choose and articulate a business model with clear unit economics; scope and ship an MVP that tests the riskiest assumption first; explain the fundamentals of how startup fundraising works (stages, dilution, terms) without giving specific legal/financial advice; define and track the 2–3 metrics that actually matter for your stage.

## 17. Productivity

**Subcategories:** Time Management Systems · Focus & Deep Work · Goal Setting & Tracking · Tools & Automation · Habit Formation · Team & Async Communication Productivity

**Feeds into:** standalone track, complements every path
**Flagship course:** *Productivity Systems for Knowledge Workers*
**Prerequisites:** none
**Difficulty:** Beginner
**Estimated duration:** 2–4 weeks
**Learning outcomes:** choose and run a personal task-management system consistently; protect and use focused work time deliberately; set goals with real, checkable success criteria; automate at least one repetitive personal workflow; communicate asynchronously in a way that respects others' focus time.

## 18. Career Preparation

**Subcategories:** Resume & Portfolio Writing · Technical Interview Preparation · Behavioral Interview Preparation · Salary Negotiation · Job Search Strategy · Personal Branding & Networking · First 90 Days on the Job

**Feeds into:** capstone/closing track for every technical path
**Flagship course:** *Career Preparation: Resumes, Interviews & Job Search*
**Prerequisites:** at least one completed learning path or equivalent portfolio of work
**Difficulty:** Beginner → Intermediate
**Estimated duration:** 4–6 weeks, typically run in parallel with the final stage of a technical path
**Learning outcomes:** write a resume and portfolio that lead with outcomes and evidence; solve and explain a technical interview problem out loud, under time pressure; answer behavioral questions using a structured method (e.g. STAR); negotiate an offer using real market data rather than guesswork; plan a deliberate first-90-days approach for a new role.

---

## Category Dependency Map (summary)

```
Programming (2) ─┬─→ Web Development (14) ─┬─→ Mobile Development (13)
                  │                          └─→ UI/UX (12) [parallel entry, no prereq]
                  ├─→ Databases (11)
                  ├─→ Networking (10) ─┬─→ Cyber Security (3)
                  │                     └─→ Cloud Computing (4) ─→ DevOps (9)
                  ├─→ Data Science (5) ─→ Machine Learning (6) ─→ Deep Learning (7)
                  │                                             └─→ Artificial Intelligence (1)
                  └─→ Prompt Engineering (8) [lightest prereq chain in the AI cluster]

Business & Freelancing (15), Entrepreneurship (16), Productivity (17) — no technical prerequisite, can be taken anytime
Career Preparation (18) — capstone, taken after or alongside the final stage of any technical path
```

This map is authoritative for sequencing course prerequisites in `courses.md` and stage ordering in `learning-paths.md`.
