# Phase 40 — Cyber Security Analyst Learning Path Production Report

**Date:** 2026-08-11. **Scope:** execute Phase 35's Cyber Security Analyst recommendation — build only the real, remaining content gap, create the `cyber-security-analyst` `LearningPath`, and verify the full journey live against the running API. No schema changes, no certificate-rule changes, no business-logic changes. Executed autonomously end-to-end per this phase's explicit execution mode, with no intermediate approval stops.

---

## 1. What existed before Phase 40

Directly queried before writing anything:

- **Courses (real, production):** 10 — Prompt Engineering, AI Foundations, UI/UX Design Foundations, Full-Stack Web Development with Next.js, Computer Networking Foundations, DevOps Foundations (Phases 25–34), Programming Foundations (Phase 36), Database Design & SQL Mastery (Phase 37), Cloud Computing Foundations (Phase 39).
- **Learning Paths (real, production):** 6 — `prompt-engineer`, `frontend-web`, `devops-engineer`, `backend-engineer`, `full-stack-engineer`, `cloud-engineer`. No `cyber-security-analyst` path existed.
- Baseline record counts (direct query, immediately before this phase's seed):
  `{"courseCount":44,"moduleCount":64,"lessonCount":180,"quizCount":39,"questionCount":195,"projectCount":29,"pathCount":6,"pathCourseCount":21}`

## 2. Skill matrix and why only 1 course was needed

Per `docs/content-library/phase35-learning-path-master-blueprint.md` Section 8, Cyber Security Analyst needs 3 mandatory courses ("1 new mandatory + 2 reused mandatory") + 1 non-mandatory elective: Programming Foundations (reused), Computer Networking Foundations (reused, full), Cyber Security Fundamentals: Defending Modern Systems (new), plus an optional Cloud Computing Foundations security-modules elective (explicitly not mandatory, not built).

Before writing anything, all existing content that could plausibly serve this path was inspected directly:

| Skill required | Where taught | Coverage | Real gap? |
|---|---|---|---|
| Variables, functions, data structures | Programming Foundations (Phase 36) | Full | None — already built, reusable |
| TCP/IP, routing, DNS, HTTP, troubleshooting | Computer Networking Foundations (Phase 34) | Full | None |
| CIA triad, threat modeling | — | None | **Real gap** |
| Network security (attacking/defending, not just how networking works) | — | None — Networking course teaches the mechanics, not the defense layer | **Real gap** |
| Application security (OWASP Top 10, analyst/hands-on depth) | Full-Stack Web Dev Module 6 | Partial — that lesson is written for a developer building secure applications | **Real gap — different target skill, confirmed by directly reading that lesson's real content (3344 characters) before writing anything** |
| Cryptography basics, IAM | — | None | **Real gap** |
| Incident response, ethical hacking fundamentals | — | None | **Real gap** |

**Conclusion:** exactly one genuinely new course was needed — Cyber Security Fundamentals: Defending Modern Systems. This matches Phase 35's own blueprint count exactly (1 new course for this path) — no correction to Phase 35's own document was needed, the same accurate-as-written outcome as Phase 39's Cloud Engineer path.

**Real, checked duplication note:** Full-Stack Web Development with Next.js already teaches the OWASP Top Ten (Phase 32, Module 6, "Common Web Security Vulnerabilities & Mitigations") — confirmed by directly querying and reading that lesson's real content before writing this course. That lesson is written for a developer building secure applications; this course's Module 3 is written for an analyst assessing/defending applications they didn't build — same named vulnerability list, a genuinely different target skill and depth (hands-on defender/assessor verification vs. applied-developer prevention awareness), exactly as `docs/content-library/courses.md`'s own Section 15 duplication-prevention rule requires and as Phase 35's blueprint explicitly pre-validated.

## 3. What was reused

| Course | Built | Position in path |
|---|---|---|
| Programming Foundations: Problem Solving with Python & JavaScript | Phase 36 | 1 |
| Computer Networking Foundations | Phase 34 | 2 |

No modules, lessons, quizzes, or projects were added to either course.

## 4. What was newly created

### 4.1 Course: Cyber Security Fundamentals: Defending Modern Systems (`cyber-security-fundamentals-defending-modern-systems`)

Per `docs/content-library/courses.md` entry #3. Category: `security` (new `Category` row). Instructor: the `e2e.instructor@phoenix.test` fixture, same convention as every prior new-course phase. All hands-on content is explicitly scoped to an intentionally vulnerable sample application, never real production systems — stated in the course description and reinforced in every relevant lesson.

**5 modules, 15 lessons (10 content + 5 quiz), 5 quizzes, 25 questions, 2 projects:**

| Module | Real content | Explicitly avoids duplicating |
|---|---|---|
| 1. Security Fundamentals & the CIA Triad | Confidentiality/Integrity/Availability, STRIDE threat modeling | — |
| 2. Network Security | Attacking/defending the same TCP/IP/DNS/HTTP concepts Networking taught, firewalls, segmentation, defense in depth | Computer Networking Foundations' general mechanics (explicitly assumed as prerequisite, applies those concepts to attack/defense instead of re-teaching them) |
| 3. Application Security (OWASP Top 10) | The same OWASP list from an analyst's verification lens — hands-on injection and broken-access-control testing methodology | **Full-Stack Web Dev Module 6's developer-prevention lesson — explicitly scoped as a different target skill, confirmed by direct comparison** |
| 4. Cryptography Basics & Identity/Access Management | Encryption vs. hashing vs. signing, authentication vs. authorization, MFA | — |
| 5. Incident Response & Ethical Hacking Fundamentals | The 5-phase incident response lifecycle, ethical hacking methodology (recon/scanning/exploitation/reporting), authorization as the legal/ethical line | — |

All 25 questions are unique across all 5 quizzes — no repeated prompt, format, or phrasing (verified by direct duplicate-prompt scan, Section 5). Questions vary across conceptual, scenario-based, practical, and terminology types per this phase's explicit requirement.

**2 standalone projects** (matching this session's established "quality over quantity" precedent over the blueprint's literal "5 projects" planning figure), both requiring genuine analytical reasoning, not command-copying:
- **Threat Model and Harden a Small Web Application** (Beginner/Intermediate) — a real CIA triad analysis, a 5+-threat STRIDE model, defense-in-depth design, and access-control enforcement reasoning for a described application.
- **Incident Response Tabletop: Investigate and Contain a Simulated Breach** (Capstone) — a simulated incident (compromised employee account, unsalted MD5 password storage) requiring a full walkthrough of Detection & Analysis, Containment (with explicit evidence-preservation reasoning), a real cryptography weakness analysis, an authentication-vs-authorization determination, Eradication/Recovery, and Lessons Learned.

**Why this course is necessary for Cyber Security Analyst:** none of the reused courses teach the CIA triad, threat modeling, defense-oriented network security, analyst-level application security verification, cryptography, IAM, or incident response — this is, per Phase 35's own blueprint, "the course carrying almost this entire path's real, distinct skill content."

**Skills covered:** CIA triad and threat modeling (STRIDE), network security (attack/defense lens), application security verification (OWASP, analyst methodology), cryptography fundamentals (encryption/hashing/signing), identity and access management (authentication/authorization/MFA), incident response lifecycle, and ethical hacking methodology and legal/ethical boundaries.

### 4.2 Learning Path: Cyber Security Analyst (`cyber-security-analyst`)

No existing path was a real fit — confirmed by direct query before writing anything: none of the 6 existing paths contain this exact 3-course combination.

3 courses linked in the blueprint's specified sequence: Programming Foundations (1) → Computer Networking Foundations (2) → Cyber Security Fundamentals (3). The Cloud Computing Foundations elective (security modules only) is explicitly not mandatory per the blueprint and was not linked as a required path course.

## 5. New verified resources

| Resource | Status | Used for |
|---|---|---|
| NIST Cybersecurity Framework (`nist.gov/cyberframework`) | 🟢 **New, live-verified this phase** | Module 1, Lesson 1; Module 2, Lesson 1 |
| NIST SP 800-61 Revision 3, "Incident Response Recommendations..." (`csrc.nist.gov/pubs/sp/800/61/r3/final`) | 🟢 **New, live-verified this phase** — note: Rev. 2 was checked first and found withdrawn/superseded; the current Rev. 3 was verified and cited instead | Module 5, Lesson 1 |
| MITRE ATT&CK (`attack.mitre.org`) | 🟢 **New, live-verified this phase** | Module 5, Lesson 2 |
| NIST Cryptographic Standards and Guidelines (`csrc.nist.gov/projects/cryptographic-standards-and-guidelines`) | 🟢 **New, live-verified this phase** | Module 4, Lesson 1 |
| OWASP Top Ten (`owasp.org/www-project-top-ten/`) | 🟢 Reused, already live-verified Phase 32 | Module 3, Lesson 1 |

All 5 are official, standards-body/foundation-published sources. No book, video, ISBN, or fabricated URL was used. A real correction was caught and handled during verification: NIST SP 800-61 Revision 2 was found to be withdrawn (superseded April 2025) when first checked — the current Revision 3 was fetched and verified instead, rather than citing the withdrawn version.

## 6. Database results

**Seed run 1** (`npx ts-node --transpile-only apps/api/prisma/seed-phase40-content.ts`):
```
Created course: Cyber Security Fundamentals: Defending Modern Systems (cyber-security-fundamentals-defending-modern-systems)
5 modules created, 15 lessons created, 5 quizzes created, 25 quiz questions created,
2 projects created (0 already existed), 1 learning path created, 3 path memberships created.
```

**Seed run 2** (idempotency check): `0 modules created, 0 lessons created, 0 quizzes created, 0 quiz questions created, 0 projects created (2 already existed), 0 learning path created, 0 path memberships created` — course, modules, projects, path, and memberships all reported "already exists, skipping." **Confirmed idempotent.**

**A real bug was found and fixed during this phase's own build process, before the seed was ever run:** the first `tsc` type-check attempt failed with ~50 syntax errors, traced to 2 instances of literal backticks used for inline-code formatting inside template-literal lesson bodies ("`/api/admin/users`", "`/api/orders/:id`", "`bcrypt(password + salt)`") — the exact same recurring gotcha documented from Phases 31/34/36/37. Fixed by replacing all 3 with double quotes, confirmed by a clean `tsc --noEmit` before running the seed. This is exactly the kind of "ordinary programming error, fixable via existing patterns" this phase's autonomous-execution rules call for diagnosing and fixing without stopping.

**Record count comparison (direct query, before → after):**

| Field | Before | After | Δ | Matches design |
|---|---|---|---|---|
| courses | 44 | 45 | +1 | ✅ |
| modules | 64 | 69 | +5 | ✅ |
| lessons | 180 | 195 | +15 | ✅ |
| quizzes | 39 | 44 | +5 | ✅ |
| questions | 195 | 220 | +25 | ✅ |
| projects | 29 | 31 | +2 | ✅ |
| paths | 6 | 7 | +1 | ✅ |
| pathCourses | 21 | 24 | +3 | ✅ |

**Direct duplicate scan** (module titles, lesson titles scoped per module, quiz titles, question prompts scoped per quiz, project titles scoped per course, course slugs/titles platform-wide, learning-path slugs platform-wide, path-course membership pairs) — **zero duplicates found at every level.**

## 7. Cross-contamination check — all prior seeds re-run

Re-ran `seed-phase25`, `26`, `27`, `30`, `31`, `32`, `33`, `34`, `36`, `37`, `38`, `39` (in that order) after Phase 40's seed. Every one reported 0 new records created. Post-re-run record counts re-checked and found identical to the post-Phase-40 snapshot above. **Zero cross-contamination.**

## 8. Real learner journey (live API, no mocks)

Executed via direct HTTP calls against the real running backend, using a **freshly registered learner account** (`phase40.learner@phoenix.test`) for a genuine from-zero journey.

1. **Register/Login** as the new learner — succeeded.
2. **Opened the Cyber Security Analyst learning path** — confirmed all 3 courses present, in the correct sequence.
3–6. **Opened each course, its modules, and its lessons in order** — confirmed real content for all 3 courses.
7. **Enrolled in course 1 (Programming Foundations)** and completed all its lessons.
8. **Deliberately wrong answers** on Programming Foundations' Module 1 quiz — `scorePercent: 0`, `passed: false`. Re-checked course progress: completion stayed at 19%, confirming **a failed attempt does not falsely raise completion.**
9. **Correct answers on all quizzes across all 3 courses** — each scored 100%, `passed: true`.
10. **Confirmed 100% completion and a brand-new certificate** for each course: Programming Foundations (`CERT-1F52F61B17AC`), Computer Networking Foundations (`CERT-2C3BFBE8089D`), Cyber Security Fundamentals (`CERT-5B1A80A8C9BE`).
11. **Confirmed all 3 certificates exist, one per course, zero duplicates.**
12. **Re-triggered completion** on Cyber Security Fundamentals (resubmitted its already-passed final quiz) and re-checked certificates — **still exactly 1 certificate** for that course. **Confirmed: no duplicate certificate on re-trigger.**
13. **Opened the Cyber Security Fundamentals project list** — confirmed both real projects.
14. **Real project submission** on the capstone ("Incident Response Tabletop") — a real, structured 5-phase incident-response walkthrough plus cryptography and IAM analysis grounded in the specific scenario's technical details (unsalted MD5, the specific attack pattern).
15. **Learner self-evaluation attempt** — **`403 FORBIDDEN`, "Not authorized to modify this resource."** Confirmed blocked.
16. **Instructor login and evaluation** — `scorePercent: 95`, `passed: true`, real, specific written feedback (including a genuine, specific critique about a still-open authorization question in the submission).
17. **Confirmed the evaluation persisted and is re-readable** — a later `GET /projects/submissions/:id` (by the learner) returned `status: "evaluated"` with the exact score/passed/feedback from the instructor's evaluation.

**Course-to-course transition across all 3 courses confirmed working.**

### Real, load-bearing rate limit discovered and diagnosed during this phase (not a bug — documented platform behavior)

Quiz-attempt submission (`POST /progress/quizzes/:quizId/attempts`) is deliberately rate-limited to **10 requests per 15 minutes per user** — confirmed by reading the real route decorator (`apps/api/src/modules/progress/progress.controller.ts`, `@Throttle({ default: { limit: 10, ttl: 900_000 } })`, with its own inline comment citing `docs/16-API-CONTRACT.md`: "10 requests / 15 min per user"). This is a genuine, intentional anti-brute-force control, tighter than the platform's general 120-req/60s default — earlier phases' journeys (37, 38) apparently stayed under it by coincidence of pacing; Phase 40's single learner account submitting quizzes across all 3 courses in quick succession exceeded it partway through course 3. Diagnosed by reading the actual source (not guessed), and resolved by waiting a genuine, full 15-minute window before resuming — not by any workaround or code change. No quiz/lesson state was lost during the wait; already-passed quizzes were correctly detected and skipped, not resubmitted, on resume.

## 9. Test/build results — all actually run

- **Backend tests:** `npm run test` in `apps/api` → **28 suites, 241/241 tests passing.** Unchanged from Phase 39 (no backend logic touched this phase).
- **Backend tsc:** `npm run type-check` → clean, no errors (after fixing the backtick issue in Section 6).
- **Backend lint:** `npm run lint` → clean, no errors.
- **Backend build:** `npm run build` → clean, `dist/main.js` produced (stale `tsconfig.tsbuildinfo` cleared preemptively per the documented Phase 37 workaround).
- **Frontend tsc:** `npm run type-check` in `apps/web` → clean, no errors.
- **Frontend lint:** `npm run lint` → clean, "No ESLint warnings or errors."
- **Frontend build:** `npm run build` → clean, all routes built successfully (background execution due to length; full output read to completion, not assumed from the timeout).

## 10. Real remaining limitations

- The two architecture gaps documented in Phase 35 remain open, unaffected by this phase: `Certificate` has no `learningPathId` (a learner completing all 3 Cyber Security Analyst courses receives 3 separate course certificates, not one path-level certificate); `Project` has no `learningPathId` (no path-level capstone mechanism exists). Not touched this phase, per the explicit instruction not to fix these unless directly necessary for this phase's own goal — they were not.
- No new architectural gap was found this phase — Phase 40 completed without hitting any of the 6 real-blocker conditions this phase's own execution rules defined.
- The Cloud Computing Foundations security-modules elective (explicitly optional per Phase 35's blueprint) was not built — consistent with the blueprint's own "not mandatory" framing, not an oversight.

## 11. What paths remain incomplete after Phase 40

1 of the original 6 named learning paths from Phase 35's blueprint remains unbuilt: **Data Scientist** — per Phase 35's own Section 6, this is the path with the largest genuine gap (0 courses currently reusable in full, 3 new courses needed: Programming Foundations — already built — Data Science Foundations, and an elective Machine Learning Foundations).

## 12. Explicitly not started

**Phase 41 was not started.** Per this phase's own scope, Phase 40 stops here after full completion, with no blocker encountered requiring project-owner input.

---

**Files created:** `apps/api/prisma/seed-phase40-content.ts`, this report, `docs/restore-point-phase40.md`.
**Files updated:** `docs/project-status.md`, `docs/known-issues.md`, `docs/next-session.md`, `docs/documentation-index.md`, `docs/content-library/phase27-content-inventory.md`, `docs/content-library/resource-verification-report.md`.
**Temporary files created and deleted after use:** `apps/api/inspect40.js`, `apps/api/count_records40.js`, `apps/api/dupe_check40.js`, `apps/api/journey40.js`, `apps/api/get_last_quiz40.js`.
