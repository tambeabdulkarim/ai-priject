# Known Issues

### RESOLVED: Staging deployment (Phase 43) — was blocked, now live

~~No live Staging URL exists yet...~~ **Resolved 2026-08-12.** Both apps are deployed and live: frontend https://ai-priject-ex8pzy2ao-phoenix-project.vercel.app, backend https://api-seven-alpha-63.vercel.app. The owner completed the two manual dashboard/secret steps (guided step by step; no secret value was ever seen by the assistant). Two additional real bugs were found and fixed during this process — kept here for reference:
- **Vercel-serverless-only crash**: `isomorphic-dompurify`'s `jsdom@28` dependency internally adopted an ESM-only package that Vercel's Node.js runtime can't `require()`. Fixed via a scoped `npm overrides` pin (`jsdom: 25.0.1`) in `apps/api/package.json` — no application code changed, no security regression (real DOMPurify sanitization re-verified against 6 XSS payloads).
- **Frontend Vercel project had the wrong Root Directory** (`Auto` → repo root, instead of `apps/web`) — a real, previously-latent misconfiguration on the pre-existing "ai-priject" project, only surfaced once the original env-var blocker was cleared. Fixed by setting Root Directory explicitly.

Full detail: `docs/phase43-deployment-readiness-report.md` (see "UPDATE" section).

## Platform (added Phase 14.1 — real, currently-open gaps outside Media/Storage)

Every entry below was verified directly against the repository this session (`docs/phase-14-plan.md`'s findings, independently re-confirmed, not copied): `.github` absence, `apps/admin`/`apps/workers` contents, `auth.service.ts`'s self-documented blockers, and a grep for Meilisearch backend usage.

### MFA — Implemented (Phase 14.2), Opt-In Rather Than Mandatory (disclosed scope decision)

`docs/10-SECURITY-BIBLE.md` §5 requires TOTP-based MFA, **mandatory for `instructor`/`content_editor`/`moderator`/`support`/`admin`/`superadmin`**, optional for `learner`. Phase 14.2 implemented real, working, live-verified TOTP MFA (enrollment, login challenge/response, recovery codes, disable) — see `docs/restore-point-phase14.2.md` for the full build. **What was deliberately not implemented: role-based enforcement.** Enrollment is available to and optional for every role today, including admin-capable ones — `AuthService.login()` only branches on `user.mfaEnabled`, never on role membership. An admin-capable account that has not enrolled logs in exactly as it did before this phase, with no nudge or block.

**Why this scope was chosen, not just left out:** hard-blocking login for every existing, already-shipping admin-capable account the moment this phase merged would have been a real, disruptive breaking change with no migration path (per this phase's own explicit "backward compatible, non-breaking" acceptance criterion) — there is no enrolled admin account in this environment today, so a hard block would have made every admin-capable login fail outright. Building enforcement properly (a grace period, an enrollment nudge/redirect, a defined rollout window) is a product/rollout decision this phase's engineering scope did not include making unilaterally.

**Status:** Real, disclosed gap relative to §5's literal wording — not hidden in a comment the way the old `mfaCode` field was. Resolving it is a role-gating change to `AuthService.login()`/session issuance (small, additive, low regression risk) plus a rollout decision (large, product-level) — recommend scoping as its own short follow-up phase rather than folding into Candidate F/C/D/E's queue silently.

**Also disclosed, matching this codebase's existing pattern:** MFA enrollment/disablement notification emails are BLOCKED — no email provider is configured (same pre-existing gap as email verification/password reset). The security-sensitive event logging §5 also requires (audit log entries for enable/disable/recovery-code-use/regenerate) is real and unconditional, independent of the email gap.

**Also disclosed:** no dedicated per-account lockout on repeated wrong codes at `POST /auth/mfa/verify` — relies on the endpoint's IP-based rate limit (10 requests/15 min, matching `login`'s own limit) rather than an account-level counter like the password step's `FAILED_LOGIN_LOCKOUT_THRESHOLD`. Not exploitable in practice (a 6-digit TOTP code's 30-second validity window means the rate limit alone makes brute-forcing computationally infeasible), but a real, honest gap to flag as a future defense-in-depth hardening rather than silently claiming parity with the password step.

### No `LearningPath` or `Project`/Submission-Grading Model — found Phase 25, RESOLVED Phase 26

**Previously:** no `LearningPath` model (documentation-only), no `Project`/submission/grading model (a project's brief lived in `Lesson`, but nothing tracked a learner's submission or its evaluation).

**Now:** 5 new Prisma models close both gaps (`LearningPath`, `LearningPathCourse`, `Project`, `ProjectSubmission`, `ProjectEvaluation`), one clean additive migration, two new backend modules, full authorization (ownership-OR-editorial, reusing existing utilities), live-verified end-to-end (real submit → evaluate → status-transition flow against the running API). The 6 existing Phase 25 project briefs were linked, never duplicated (`Project.instructions` is `null` for all 6; the brief text stays in `Lesson.body`, byte-length unchanged). Full detail: `docs/phase26-learning-path-project-architecture-report.md`.

**Status:** Resolved. `Course` still has no `difficulty`/`estimatedHours`/`prerequisites`/`tags` fields and `Tag` is still wired only to `News` — both noted as out-of-scope for Phase 26 (didn't block the new architecture), remaining a minor, low-priority gap for a future phase if ever needed.

### No Frontend UI for Learning Paths / Projects — found Phase 26, RESOLVED Phase 28

**Previously:** Phase 26 deliberately implemented backend architecture only — no learning-path browse page, no project submission form, no instructor grading queue existed in `apps/web`.

**Now:** Phase 28 built the full learner-facing UI (Learning Paths list/detail, course projects list/detail/submission, instructor evaluation queue) plus a real quiz-taking UI, reusing existing routes/components/design system. Live-verified end-to-end against the real running API (login → path → course → lesson → quiz → project submit → instructor evaluate → persisted). Full detail: `docs/phase28-educational-frontend-report.md`.

**Status:** Resolved. `GET /courses/:slug` still doesn't include path membership in its response (unchanged, low-priority, Phase-26-consistent gap — the learning-path detail page fetches courses through `GET /learning-paths/:slug` instead, so this didn't block the new UI).

### Phase 42 note: 2 real bugs found and fixed by the platform completion audit; both resolved and verified

Phase 42 was a full platform audit, not a content phase. It found and fixed 2 real issues:

1. **RESOLVED — E2E test-fixture course leaked into the live public catalog.** `Course` row `verify-moderator-fix-1785834523759` had `status: published` (a leftover from an earlier phase's moderator-workflow E2E test), making it visible to real visitors via `GET /courses`. Fixed by reverting its status to `draft`. If a future phase's E2E test suite leaves another fixture in a `published` state, check for this same pattern (a nonsense, timestamp-based course title with `description: null`) before assuming new content is real.
2. **RESOLVED — Authorization-check-ordering bug in project evaluation.** `ProjectsService.evaluateSubmission` checked "already evaluated" before checking real caller authorization, letting an unauthorized caller distinguish an evaluated vs. unevaluated submission via a 409-vs-403 response difference (no forgery was ever actually possible — only this status leak). Fixed by reordering the checks; see `apps/api/src/modules/projects/projects.service.ts` and its updated/new tests in `projects.service.spec.ts`.

No P0 (safety-critical) issue was found. Full findings, the P0–P3 matrix, and the 91% readiness score breakdown are in `docs/phase42-platform-completion-audit.md`.

### Phase 41 note: transient Neon serverless connection/request blips observed twice, both self-resolved on retry — not a bug

Phase 41 (Data Scientist Learning Path Production) added 1 new course, 1 new `LearningPath`, and 3 memberships; introduced no application code changes and no new known issues. Twice during this phase, a transient failure occurred and self-resolved on retry: (1) an initial DB-inspection script failed with `PrismaClientInitializationError: Can't reach database server`, resolved after a brief TCP-level wake-up delay (consistent with Neon's serverless auto-suspend/wake behavior); (2) one quiz-attempt submission returned a real `500 INTERNAL_SERVER_ERROR` mid-journey, while the server's own health endpoint remained responsive throughout, and an identical retry of the same request succeeded cleanly with the correct score. Both are consistent with occasional, real Neon serverless connection blips rather than a reproducible application defect — no code change was made, since neither issue reproduced. Noted here so a future session doesn't mistake an isolated, non-reproducing error for a real regression; if this pattern becomes frequent or reproducible, it would warrant real investigation (e.g. connection pool tuning) rather than being dismissed again as transient.

### Phase 40 note: real quiz-submission rate limit identified and documented (10 req/15 min per user) — not a bug

Phase 40 (Cyber Security Analyst Learning Path Production) added 1 new course, 1 new `LearningPath`, and 3 memberships; introduced no application code changes and no new known issues. While running the automated learner-journey test, quiz-attempt submission consistently returned `429` for over 5 minutes despite backoff retries — traced this to the real source (`apps/api/src/modules/progress/progress.controller.ts`), which applies `@Throttle({ default: { limit: 10, ttl: 900_000 } })` specifically to `POST /progress/quizzes/:quizId/attempts` — a deliberate, documented (`docs/16-API-CONTRACT.md`: "10 requests / 15 min per user") anti-brute-force control, tighter than the platform's general 120-req/60s default noted in Phase 38/39. A single learner account submitting quizzes across 3 courses in quick succession can exceed this within the same 15-minute window. **This is real, intentional platform behavior, not a defect.** Resolved by waiting a genuine full 15-minute window before resuming — no lesson/quiz state was lost. Future automated test scripts against this endpoint should pace no more than ~10 quiz submissions per learner account per 15 minutes, or expect to wait out this specific limit. See `docs/phase40-cyber-security-analyst-path-production-report.md` Section 8.

### Phase 39 note: no new known issues; platform rate limiter behavior re-confirmed under sustained automated testing

Phase 39 (Cloud Engineer Learning Path Production) added 1 new course, 1 new `LearningPath`, and 4 memberships; introduced no application code changes and no new known issues. The same real rate limiter first documented in Phase 38 was hit again during automated learner-journey testing — this time a single 15s backoff wasn't sufficient, and the test script needed a full ~90s idle wait plus a slower request pace (2.5s between requests) to complete cleanly. This remains the rate limiter working as designed against a fast test client, not a defect — no lesson/quiz state was lost. Noted here as an update to Phase 38's note, since the exact backoff timing needed varies by how much recent traffic the server has already seen. See `docs/phase39-cloud-engineer-path-production-report.md` Section 8.

### Phase 38 note: no new known issues; platform rate limiter confirmed working as designed

Phase 38 (Full Stack Engineer Learning Path Production) added one new `LearningPath` and 5 memberships — zero new courses, modules, lessons, quizzes, or projects; introduced no application code changes and no new known issues. While running an automated, back-to-back-requests learner-journey test script, the real platform rate limiter (`ThrottlerModule`, 120 req/60s, `docs/10-SECURITY-BIBLE.md` §12) correctly rejected the burst with `429`s — this is the rate limiter working as designed against a fast test client, not a defect. The test script was adjusted to pace requests and back off on `429`, and completed with zero state loss or corruption. Noted here only so a future session doesn't mistake this platform behavior for a bug when writing similar test scripts. See `docs/phase38-fullstack-learning-path-production-report.md` Section 8.

### Phase 37 note: one pre-existing dev-environment issue found and fixed, no new application-code known issues

Phase 37 (Backend Engineer Learning Path Production) added one new course, one new `LearningPath`, and 5 path memberships; introduced no application code changes. While starting the backend server for live verification, found that a stale `apps/api/tsconfig.tsbuildinfo` incremental-build cache (pre-existing, unrelated to this phase's content) caused `nest build`/`nest start --watch` to silently report "Found 0 errors" while never actually emitting to `dist/`, so `node dist/main.js` failed with `MODULE_NOT_FOUND`. Deleting the stale cache file resolved it immediately — no source code was touched. **If a future session hits the same `dist/main` MODULE_NOT_FOUND error on `npm run dev`/`npm run build`, delete `apps/api/tsconfig.tsbuildinfo` and rebuild before assuming a real code regression.** See `docs/phase37-backend-engineer-content-production-report.md` Section 9.

### Phase 36 note: no new known issues

Phase 36 (Frontend Engineer Learning Path Completion) added one new course and one learning-path membership; introduced no application code changes and no new known issues. It re-confirmed certificate-issuance idempotency under a genuine repeat trigger for a 7th, independent course, and directly confirmed adding a course to an already-populated `LearningPath` works correctly and doesn't disrupt existing memberships or other seeds. See `docs/phase36-frontend-engineer-content-production-report.md`.

### No Path-Level Certificate or Path-Level Capstone Project Mechanism — found Phase 35, OPEN

`docs/content-library/certificates.md`'s Phase 24 blueprint specifies a "Path Certificate" (requiring a path-level comprehensive exam, all 4 tier projects, and Career Preparation) as the senior credential for completing a learning path. **The real `Certificate` model has no `learningPathId` field and no path-level credential concept at all** — confirmed by directly reading `schema.prisma` — it is strictly one row per `(userId, courseId, enrollmentId)`. Nothing in the real system currently recognizes "path completion" as its own event or issues a distinct credential for it; there is also no data model for a path-level comprehensive exam (the existing `Quiz`/`QuizQuestion` model is strictly per-lesson).

A related, second gap: `Project.courseId` is required with no `learningPathId` field, so a path's Professional Capstone project (conceptually spanning the whole path) must be modeled as a standalone `Project` attached to one specific course — a workable pattern already used successfully in Phases 27–34, but with no real, enforced "this is the path's capstone" relationship in the database.

**Status:** Real, open, documented — not fixed. Per Phase 35's explicit scope ("document, don't fix"), no schema change or implementation was made. Course-level certificates (the real, implemented, live-verified mechanism used in every phase since 25) remain fully functional and unaffected — the gap is specifically the *aggregate, path-level* credential, not course-level certification itself. Full detail: `docs/content-library/phase35-learning-path-master-blueprint.md` Section 15.

### Phase 34 note: no new known issues

Phase 34 (Educational Content Production: Computer Networking Foundations) introduced no application code changes and no new known issues. It re-confirmed certificate-issuance idempotency under a genuine repeat trigger for a 6th, independent course, ran the same explicit direct-database duplicate-content checks as Phase 33, and closed out all 6 of the original Phase 25 courses to production-ready status — see `docs/phase34-networking-content-production-report.md`.

### Phase 33 note: no new known issues

Phase 33 (Educational Content Production: AI Foundations) introduced no application code changes and no new known issues. It re-confirmed certificate-issuance idempotency under a genuine repeat trigger for a 5th, independent course, and additionally ran explicit direct-database duplicate-content checks (module/lesson/quiz/question/project/course titles) beyond just relying on seed idempotency — see `docs/phase33-ai-foundations-content-production-report.md`'s Duplicate Checks and Certificate Verification sections.

### Phase 32 note: no new known issues

Phase 32 (Educational Content Production: Full-Stack Web Development with Next.js) introduced no application code changes and no new known issues. It re-confirmed certificate-issuance idempotency under a genuine repeat trigger for a 4th, independent course — see `docs/phase32-fullstack-content-production-report.md`'s Certificate Verification Result.

### Phase 31 note: no new known issues

Phase 31 (Educational Content Production: DevOps Foundations) introduced no application code changes and no new known issues. It further re-confirmed certificate-issuance idempotency under a genuine repeat trigger (re-marking an already-complete lesson created no duplicate certificate) — see `docs/phase31-devops-content-production-report.md`'s Certificate Issuance Result.

### Phase 30 note: no new known issues

Phase 30 (Educational Content Production: UI/UX Design Foundations) introduced no application code changes and no new known issues. It also independently closed the one residual verification gap Phase 29's report flagged below (a from-zero certificate issuance, not just an idempotent re-confirmation of a pre-existing one) — see `docs/phase30-uiux-content-production-report.md`'s Certificate Verification Result.

### Quiz-Type Lessons Never Marked Complete — found Phase 28, RESOLVED Phase 29

**Previously:** passing a quiz never updated `LessonProgress.completedAt` for its lesson anywhere in the codebase — confirmed live, `completionPercent` capped at 92% (23/25 lessons) for a real course and could not reach 100%, blocking new certificate issuance for any course with a quiz-type lesson.

**Now:** `submitQuizAttempt` reuses the exact same completion flow `updateLessonProgress` already used (extracted into one shared private method, `upsertProgressAndHandleCompletion`) — a passed attempt marks its lesson complete, recomputes course completion, and (on the transition into 100%) triggers the existing, unchanged certificate-issuance path. A failed attempt has no effect. No parallel completion mechanism was created; no certificate rule was changed.

**Confirmed live, not theoretical:** the same real course re-checked at 92% at the start of Phase 29; a deliberately wrong quiz submission left completion at 92% (no false-positive completion); the real correct answers for its two remaining quiz lessons raised completion to 96% then **100%**, entirely through the real quiz-submission flow; the resulting 100%-completion transition correctly invoked `certificatesService.issueForEnrollment`, which correctly recognized the enrollment's existing certificate and returned it idempotently. 4 new regression tests added; 241/241 backend tests passing, zero regressions.

**Status:** Resolved. Full detail: `docs/phase29-completion-fix-report.md`.

### Single-Choice Quiz Scoring — found and RESOLVED Phase 28 (live verification)

`quiz-scoring.ts`'s `single`-type comparison used strict `JSON.stringify` equality, but every `single`-type question's seeded `correctAnswer` (`seed-phase27-content.ts`) is stored as a one-element array (e.g. `["True"]`) while the frontend submits a bare string — so no learner could ever pass a single-choice quiz question, in any course, before this fix. Found via a real live quiz submission (not a code read), confirmed via direct Prisma inspection across the full seed file (systemic pattern, not a typo), fixed with the project owner's explicit approval (`quiz-scoring.ts`'s comparison now unwraps a one-element array on either side; seed data was deliberately left unchanged). 3 new regression tests added; re-verified live (the same payload that scored 0% before now scores 60% with correct per-question results).

**Status:** Resolved. Full detail: `docs/phase28-educational-frontend-report.md` Section 9.

### `Module`/`Lesson` Have No Unique Constraint Beyond `id` — found Phase 25, minor technical debt

`Module` and `Lesson` have only non-unique indexes on `[courseId, position]`/`[moduleId, position]` — no real unique constraint exists to support a DB-level `upsert`. Phase 25's new content seed script (`apps/api/prisma/seed-phase25-content.ts`) works around this at the application level (`findFirst` by parent+title before `create`), verified safe via two full runs (second run created zero duplicates) — but this remains a real, minor schema gap worth a proper unique constraint if course-content seeding becomes a recurring, multi-contributor workflow.

**Status:** Real, low priority, application-level workaround verified working. Not a blocker.

### Content Library External References Need Live Verification Before Publish — flagged by design, Phase 24

`docs/content-library/books.md` and `videos.md` cite real, well-known books/channels but deliberately omit exact ISBNs and specific video URLs (never fabricated); `documentation-links.md`'s 20 platform links are high-confidence root domains but not live-checked in this phase. One category (Business & Freelancing) has no book/video entry at all rather than an unverified guess.

**Status:** Partially resolved Phase 25 — 10 resources tied to the first production content set were live-verified (including finding and correcting 2 stale URLs, OpenAI and Anthropic); 8 more remain `NEEDS_VERIFICATION` (mostly YouTube channels blocked by anti-scraping, one O'Reilly page returning HTTP 403 — inconclusive, not evidence against them). Full detail: `docs/content-library/resource-verification-report.md`. The remaining ~12 categories' resources (untouched by Phase 25's scope) still need `content-roadmap.md`'s Phase C0 pass. Re-verify before every subsequent content-production phase too, not just once (links rot).

### `Phoenix-Deployment-Package/` Internal Cross-References Broken — found Phase 23 (Dry Run), RESOLVED Phase 23.1

**Previously:** 9 of the package's 10 operational documents had broken `docs/`/`scripts/` path references (59 total), plus a structural ambiguity about where the bundled smoke-test scripts should run from.

**Now:** all 59 fixed, plus 6 more found by a follow-up automated validation script (including 2 real authoring bugs from Phase 22 itself — missing `../` prefixes in two package-native files). An automated path-resolution check (not manual grep) confirms **0 broken references remain out of 141 total** in the package. The repository-requirement ambiguity is now explicitly stated in `README.md`, `handover-guide.md`, and `production-readme.md`. Full detail: `docs/phase23.1-deployment-package-finalization-report.md`.

**Status:** Resolved. `Phoenix-Deployment-Package/` verdict is now PASS (zero broken links) — safe to hand to an external operator.

**Status:** Real, unresolved, Medium priority (blocks the package's own stated goal of "no questions asked," does not block deployment content accuracy — every underlying fact, command, and value is correct). Full detail and a 6-item numbered fix list: `docs/phase23-deployment-dry-run-report.md`. No documents were rewritten during Phase 23 itself, per that phase's explicit constraint — fix is deferred, pending approval, to Phase 24.

### `next dev`-Only Homepage 500 — investigated Phase 21 (Smoke Test), confirmed non-issue

The new production smoke test's first run against a long-running `next dev` instance (left over from earlier in this session) reported the homepage (`GET /`) returning HTTP 500. Investigated rather than accepted at face value: root page.tsx does a server-side `redirect()` to the default locale, which correctly returns HTTP 307 in a real production-mode build (`next build` + `next start`, confirmed directly this phase) — the 500 was a `next dev`-only artifact from a stale watch-mode process, not a real application defect.

**Status:** Not a real defect, no fix needed. Documented here only so the finding isn't lost and so a future smoke-test run against a `next dev` instance (rather than a real production build) doesn't cause unnecessary alarm. Recorded in full in `docs/production-verification-report-template.md`'s worked example.

### Stray Root-Level Artifacts, Expanded List — found by Phase 21 Launch Preparation, unresolved

Extending the Phase 20 finding (`shots/`, `shots2/`, `.preview/`, `Phoenix_v0.1.0.zip`): the Phase 21 launch-preparation repository-health audit additionally confirmed `.vercel/` at the repo root as a stale local Vercel CLI project link (contains only `README.txt` + `project.json`, no secrets, already correctly `.gitignore`d) — a separate leftover from the same pre-Phoenix scaffold era as the `apps/web/vercel.json` deleted in Phase 19, not a duplicate of it. `Phoenix_v0.1.0.zip` was newly measured at 87.7 MB, large enough to matter for clone time.

**Status:** Real, unresolved, Low priority — a cleanup list only, nothing deleted this phase. See `docs/phase21-launch-preparation.md` Section 1.

### New Technical Debt Surfaced by Phase 21 (v1.1 Roadmap) Planning — unresolved

While writing the v1.1 strategic roadmap (read-only, no code touched), three real, previously-undocumented technical-debt items were identified: (1) a repeated locale-resolution boilerplate pattern (`useParams()` → derive `locale` → `COPY[locale] ?? COPY.ar`) appears at the top of nearly every `apps/web` page component — directly observed across dozens of files edited in earlier phases, not newly introduced this phase; (2) rate-limit values (`120/min` global, `10/15min` login, etc.) are hardcoded per-`@Throttle` decorator across controllers rather than centralized, making per-environment tuning require a source change; (3) no feature-flag mechanism exists, despite one being named as a future need in the original architecture doc (§21) — relevant because v1.1 features will be the first ones that might benefit from gradual rollout.

**Status:** Real, unresolved, Low-Medium priority (feature flags are Medium given upcoming v1.1 work; the other two are Low). See `docs/phase21-v1.1-roadmap.md` Section 3 for full detail and recommended solutions.

### Stray Root-Level Artifacts — found Phase 20, unresolved

While producing the Version 1.0 inventory, several unreviewed items were noticed at the repo root outside the standard monorepo structure: `shots/`, `shots2/`, `.preview/`, `Phoenix_v0.1.0.zip`. Not previously flagged in any prior phase's known-issues entries.

**Status:** Real, unresolved, Low priority. Not investigated further this phase (read-only freeze). Added to `docs/version-1.0-roadmap.md`'s Short Term section — origin should be confirmed before deciding whether to delete.

### 4 Backend Modules Confirmed Missing Spec Files — re-confirmed Phase 20

`categories`, `lessons`, `notifications`, `permissions` each have a `*.service.ts` but no `*.service.spec.ts` — re-verified directly (service/spec file presence checked per module) while producing the Version 1.0 freeze; matches Phase 15's original finding exactly, unchanged since.

**Status:** Real, unresolved. `permissions` is the highest-priority of the four given its security adjacency. See `docs/version-1.0-freeze.md` Part 4 (Technical Debt) and `docs/version-1.0-roadmap.md`.

### Only 2 of 6 Shared Packages Are Actually Used — confirmed Phase 20

`@phoenix/api-client` and `@phoenix/types` are real, imported, load-bearing. `@phoenix/i18n`, `@phoenix/validation`, and `@phoenix/ui` are real code but confirmed, via a direct import search, to be imported nowhere in `apps/web` or `apps/api`.

**Status:** Not a defect — confirmed intentional future-consumer scaffolding (a future mobile app, a generalized component library) per `docs/09-PLATFORM-ARCHITECTURE.md`'s own stated intent. Documented here for completeness of the Version 1.0 freeze record, not as a problem to fix.

### `apps/web/vercel.json` Stale/Wrong — RESOLVED (Phase 19)

**Previously (found Phase 17, re-confirmed Phase 18):** a leftover from the pre-Phoenix scaffold project — wrong project name (`"ai-productivity-platform"`), legacy Vercel v2 `builds`/`routes` config syntax that predates modern zero-config Next.js deploys. Would have produced an incorrect result if used as-is on a real Vercel deploy.

**Resolution (Phase 19):** deleted. Modern Next.js needs no `vercel.json` for standard deployment — Vercel's zero-config detection handles it, and the monorepo root-directory issue (see below) is solved via the platform's dashboard setting, not a file. Deletion was confirmed safe: both apps rebuild cleanly afterward, 209/209 backend tests unaffected.

**Status:** Resolved. The deletion itself was a real destructive action — the permission classifier blocked the first attempt, and the user was asked to confirm the exact target path (`apps/web/vercel.json`) before it was retried and completed.

### No Production Deployment Exists — found Phase 19, owner action required

Phase 19 attempted to execute the actual production deployment and confirmed, precisely, that it cannot proceed further without the project owner: no hosting provider account (Vercel/Railway/etc.), no domain, no DNS access, no Postmark production account, and no separate production database or object-storage bucket exist anywhere in this session.

**Status:** Not an engineering gap — a complete, priority-ordered, 16-item Owner Action List exists in `docs/phase19-execution-readiness-report.md` covering exactly what's needed. Phoenix v1.0's core development is unaffected and remains complete.

### `.gitignore` Missing `.env.production` Coverage — RESOLVED (Phase 18)

**Previously:** `.gitignore` listed only 5 exact `.env*` filenames (`.env`, `.env.local`, `.env.development.local`, `.env.test.local`, `.env.production.local`) — none matched the common `.env.production` (no `.local` suffix) convention many hosting-provider guides suggest for staging production secrets locally. `docs/phase17-deployment-launch-guide.md` had explicitly (and incorrectly) told readers `.gitignore` coverage was already complete and "safe by construction."

**Found by:** a Phase 18 newcomer dry-run of the Phase 17 deployment guide — the exact kind of real, live gap that verification-only phase exists to catch.

**Resolution:** added `.env.*` with a `!.env.example` negation to `.gitignore`. Verified before/after with `git check-ignore -v`: `.env`/`.env.production` both correctly ignored; `apps/api/.env.example`/`apps/web/.env.example` confirmed still tracked, not accidentally hidden.

**Status:** Resolved. The only file Phase 18 modified — classified as genuinely launch-blocking (a real path to committing live secrets during the exact launch process being rehearsed), per that phase's explicit "fix only if truly launch-blocking" rule.

### Dark Mode Toggle Is Decorative, Not Functional — CONFIRMED (Phase 18)

The header's moon-icon toggle (present since early phases, suspected non-functional but never directly tested) was clicked and measured directly (HTML class, computed `body` background-color, full-page pixel screenshot comparison) before and after — **zero change** in all three. The control does nothing.

**Status:** Real, confirmed, non-blocking (misleading UX, not a functional break or security issue). Medium priority — a control that visibly does nothing is worse than no control, but does not prevent a safe launch. Not fixed this phase, per its explicit "verify and document, don't fix unless launch-blocking" rule.

### Deployment Guide Missing Monorepo Root-Directory Configuration — found Phase 18, unresolved

A Phase 18 newcomer dry-run of `docs/phase17-deployment-launch-guide.md` found its "recommended sequence" step 2 ("create the Vercel and Railway accounts and connect the repo") never mentions that a Turborepo monorepo needs an explicit service-root setting (`apps/web` for Vercel, `apps/api` for Railway) — identified as the single most likely real point a first-time deployer would stall.

**Status:** Real, unresolved, Medium priority. Not fixed this phase (editing the Phase 17 guide was deliberately left for a scoped follow-up rather than bundled into a verification-only phase).

### `apps/workers` Has No `start` Script — found Phase 18, unresolved

`docs/phase17-deployment-launch-guide.md` implies Railway/Nixpacks could run `apps/workers` as a second service directly from `package.json`'s `build`/`start` scripts. `apps/workers/package.json` has `build`, `dev` (a placeholder echo), `lint`, `type-check` — no `start` script.

**Status:** Real, unresolved, Low priority — irrelevant until `apps/workers` has real job logic (Candidate D). Would surface immediately if someone tried to stand it up as the guide currently describes.

### No Dockerfile Exists Anywhere in the Repository — found Phase 17, unresolved

`docs/09-PLATFORM-ARCHITECTURE.md` §21 commits to containerizing `apps/api`/`apps/workers`, but no `Dockerfile` exists anywhere in the repo (confirmed via a full repo search). Not currently a blocker — Phase 17's recommended hosting path (Railway) can build directly from `package.json` via Nixpacks, no Dockerfile required — but would become a real, immediate setup cost if Fly.io, AWS ECS, or Azure Container Apps were chosen instead.

**Status:** Real, unresolved, low urgency given the current hosting recommendation. See `docs/phase17-deployment-launch-guide.md` §1.

### `apps/web/vercel.json` Is Stale and Actively Wrong — found Phase 17, not corrected (out of scope)

Leftover from the pre-Phoenix scaffold project: `"name": "ai-productivity-platform"`, and a legacy Vercel v2 `builds`/`routes` config format that predates modern zero-config Next.js deploys. Using it as-is on a real Vercel deploy would not produce a correct result.

**Status:** Real, unresolved, a concrete pre-launch action item (correct or delete this file before deploying to Vercel). **Deliberately not fixed this phase** — Phase 17 is planning-only, and per its addendum, must not modify hosting-provider-specific configuration. See `docs/phase17-deployment-launch-guide.md`'s Production Checklist.

### Terraform Is Scaffolding-Only — re-confirmed Phase 17

`infra/terraform/README.md` explicitly states no resources are defined yet. The real, live Neon/Upstash/Backblaze B2 infrastructure this project has used since Phase 13.6/13.7 was provisioned manually, not reproducibly from code, despite `docs/09-PLATFORM-ARCHITECTURE.md` §21 originally calling for Infrastructure-as-Code ("no manual console changes, every environment reproducible from git").

**Status:** Real, unresolved, not a launch blocker (the infrastructure already works), but a real operational risk if access/institutional knowledge is lost. See `docs/phase17-deployment-launch-guide.md` §3.

### Certificates Have No Real PDF Generation — re-surfaced Phase 17 (pre-existing, previously disclosed)

`certificates.service.ts`'s own file header already discloses this: no PDF-rendering library exists anywhere in the codebase; every certificate is issued with `pdfFileId: null`. Re-surfaced during Phase 17's object-storage review because it directly affects what "object storage in production" actually needs to serve at launch (media only, not certificates, despite both being architecturally wired to the same storage).

**Status:** Real, pre-existing, unresolved. Not a new finding — confirmed still true, now cross-referenced from the deployment guide.

### No HTTP Security Headers (helmet) — RESOLVED (Phase 16)

**Previously:** `apps/api/src/main.ts` configured no helmet or equivalent — no CSP, `X-Frame-Options`, or `X-Content-Type-Options` anywhere.

**Resolution:** `helmet()` added to the API with an explicit CSP/CORP/COEP/HSTS/Referrer-Policy/Permissions-Policy configuration; `apps/web/next.config.mjs` gained an equivalent `headers()` function for the frontend. Both live-verified via real HTTP responses and a live Playwright pass across 7 pages × 3 roles with zero CSP violations. See `docs/phase16-production-validation-report.md` §2.

### No Email-Delivery Provider — RESOLVED (Phase 16), needs real credentials

**Previously:** no email provider configured anywhere; verification/password-reset/MFA emails logged instead of delivered.

**Resolution:** Postmark integration built (`apps/api/src/common/services/email.service.ts`), wired into all 5 existing call sites, safe-degrading when unconfigured. **Status:** the integration is real and tested; this dev environment has no real Postmark account, so live message delivery is unverified here — an operator with real credentials needs to set `POSTMARK_API_KEY`/`EMAIL_FROM_ADDRESS` before real users receive real emails. This is a configuration step, not remaining engineering work. See `docs/phase16-production-validation-report.md` §1.

### `npm audit` Run — 27 findings, documented, not force-fixed (Phase 16)

**Previously:** no dependency vulnerability scan had ever been run.

**Now run for real:** 27 findings (1 critical, 10 high, 13 moderate, 3 low), collapsing into 4 upgrade groups (Next.js 14→16, NestJS core 10→11, `@nestjs/config` 3→4, `@nestjs/cli` toolchain — the last is dev-only, never deployed). All require breaking major-version upgrades; `npm audit fix` (non-forced) confirmed nothing is safely fixable within current semver ranges. **None were forced this phase** — each group is documented with explicit deferral reasoning in `docs/phase16-production-validation-report.md` §3, consistent with this project's own "plan the deliberate NestJS 11/Next 15 upgrade" recommendation from Phase 15. **Status:** real, unresolved, ranked (Next.js first, given Critical severity) as the top follow-up item.

### CI Pipeline Still Not Verified on a Real Remote Run — re-confirmed Phase 16, caching/artifacts gaps fixed

Carried over from Phase 14.3. Phase 16 found and fixed two real, safe gaps: Turbo caching was missing from 3 of 4 jobs (added), and no build artifacts were ever uploaded (added, 7-day retention). **Still unresolved:** an actual GitHub Actions run has never been observed — this local session cannot push to a real remote. **Also newly found and documented, not built:** no CD/deployment workflow exists at all; building one requires a hosting-target decision (`docs/09-PLATFORM-ARCHITECTURE.md` §21) this phase had no authority to make. See `docs/phase16-production-validation-report.md` §4.

### Two Missing Database Indexes — RESOLVED (Phase 16)

**Previously:** `Product.categoryId`, `Course.categoryId`, and `Order.createdAt` were all queried without a supporting index.

**Resolution:** migration `20260806075921_add_production_indexes` — applied to the live database and independently verified via a direct `pg_indexes` query (not just `prisma migrate status`). No unrelated schema touched. See `docs/phase16-production-validation-report.md` §5.

### Confirmed Dead Code — legacy route tree, found Phase 15, not deleted (by instruction)

`apps/web/src/app/{dashboard,analytics,files,projects,workspace}/` (non-`[lang]`) is a full parallel copy of a pre-Phoenix "productivity app," superseded by the localized `[lang]/` routes and confirmed reachable by zero internal links anywhere in the app. Components serving exclusively this dead tree: `TasksSection`, `NotesPanel`, `CalendarSection`, `ProjectsBoard`, `FilesPanel`, `AnalyticsPanel`, `BottomStatistics`, `FeatureCards`, `HomePageContent`, `Roadmap`, the `News` component, `LocalStorageSync`, and the workspace variant of `SettingsPanel`. Also fully dead: `AuthPanel.tsx` (zero references anywhere).

**Important carve-out, verified directly:** `apps/web/src/app/checkout/{success,cancel}/` (also non-`[lang]`) are **real, live Stripe redirect targets** (`orders.service.ts` constructs `successUrl`/`cancelUrl` pointing at them) — NOT dead code, despite living in the same parent directory as the dead routes.

**Status:** Real, confirmed, not deleted this phase per Phase 15's explicit no-cleanup instruction. Documented as a ranked High-priority recommendation (a scoped future cleanup phase) in `docs/phase15-production-readiness-report.md`.

### Test Coverage Gaps — found Phase 15, documented only

Zero frontend unit/component tests exist (`apps/web/package.json` has no test/jest/vitest script; the only `*.test.js` files found are dead leftovers referencing a different, unrelated project's `src/lib/notes.js`/`tasks.js`, which don't exist here). Zero backend controller-level tests exist (18 controllers, 0 direct spec files — only indirectly exercised via E2E). `lessons.service.ts`, `permissions.service.ts`, and `storage.service.ts` have no unit coverage despite being core/security-relevant. The full E2E suite's pass/fail state is stale (last real full run: Phase 11.6/11.7's "30 Passed / 14 Failed"). Orders/Enrollments have no concurrent-request race tests, unlike Payments (which does cover this well).

**Status:** Real, documented, not addressed this phase per the explicit "document only, do not create tests" instruction. See `docs/phase15-production-readiness-report.md` §8 for full detail.

### Header Auth-State Bug — RESOLVED (Phase 14.7)

**Previously:** `apps/web/src/components/Navigation.tsx` (rendered on all 38 pages that show the header) never called `useAuth()` — every page showed the logged-out Login/Create Account buttons regardless of real session state. Found via real browser screenshots in Phase 14.6B; root-caused and fixed in Phase 14.7.

**Resolution:** Navigation now reads real auth state and renders a user menu (avatar-initial, email, Dashboard/Settings links, Logout) plus a live notification-unread indicator when authenticated. A second, related bug found only while fixing this — `services/auth-client.ts`'s `getCurrentAuthUser()` deliberately returns `email: ''` on every fresh page load (session recovery derives only from the JWT, which carries no email claim) — was also fixed, by preferring `profile.email` (from `GET /users/me`) over `user.email` for display.

**Status:** Resolved. See `docs/restore-point-phase14.7.md`.

### Tablet Header Overflow (~820px) — RESOLVED (Phase 14.7)

**Previously:** the nav-collapse breakpoint was `max-width: 768px`, but the tablet viewport tested in Phase 14.6B (820px) sits above it, so the full desktop nav never collapsed and overflowed the viewport, making Login/Create Account unreachable.

**Resolution:** added a `max-width: 900px` breakpoint duplicating only the nav-collapse-critical rules ahead of the existing 768px block (which is unchanged).

**Status:** Resolved. See `docs/restore-point-phase14.7.md`.

### `/instructor/courses` "404" — CORRECTED, not a real bug (Phase 14.7)

**Previously reported (Phase 14.6B, as a Critical finding):** navigating to `/instructor/courses` returned a 404 for a real, logged-in instructor account.

**Correction:** this route was never real. `apps/web/src/constants/routes.ts` has no such entry, and nothing in the app links to it — only `/instructor/courses/new` and `/instructor/courses/[id]/edit` exist. The Instructor Dashboard (`/instructor`) itself is the course list. The Phase 14.6B screenshot script had navigated to a guessed URL based on the directory structure, not an actual in-app link.

**Status:** Not a defect. No code changed. Retracted rather than "fixed" with an invented listing page, per Phase 14.7's explicit instruction to stop and document rather than build out-of-scope functionality when a "fix" would require inventing new architecture.

### Plain-Text Status (Course/Order/User) — PARTIALLY RESOLVED (Phase 14.7)

**Previously:** course status (Instructor Dashboard), order status (Orders), and user status (Admin Users) all rendered as plain, uncolored text — a repeated High-priority finding across the Phase 14.6B audits.

**Resolution:** one shared `StatusBadge` component (`apps/web/src/components/ui/StatusBadge.tsx`), colored by semantic status family, applied to all three of the above.

**Status:** Resolved for these three screens. **Not yet applied elsewhere** status appears in the UI (e.g. Course Catalog, Course Details, Library, Marketplace/Products) — same component, straightforward follow-up, not done this phase.

### Test-Data Not Visually Distinguishable — RESOLVED for Admin Users (Phase 14.7)

**Previously:** `User.isTestData` (added Phase 13.8) existed in the schema and was already returned by every `SafeUser`-shaped API response, but the frontend `SafeUser` type never declared the field, so no UI could read it — Admin Users showed test and real accounts identically.

**Resolution:** added `isTestData: boolean` to `packages/types/src/users.ts`'s `SafeUser` (type-declaration-only — zero backend/API-contract change, since the field was already on the wire). Admin Users now renders a muted "Test data" badge for any account with the flag set.

**Status:** Resolved for Admin Users. The flag is still not exposed/rendered anywhere else it might be useful (e.g. a future Instructor course list showing which courses are E2E fixtures) — not attempted this phase.

### `apps/admin` vs. `apps/web` Admin Routes — RESOLVED (Phase 14.4)

**Previously:** two admin surfaces existed with no reconciled owner — `apps/web/src/app/[lang]/admin/*` (implemented, permission-gated, tested) and `apps/admin` (a standalone Next.js app, but only `layout.tsx` + `page.tsx` existed — no route implementation), despite a git commit titled "frontend admin workspace complete (verified)".

**Resolution:** `apps/web` adopted as the platform's one authoritative admin surface. `apps/admin` formally retired — kept in place (not deleted) as inert history with a clear `README.md` explaining why, removed from `.github/workflows/ci.yml`'s frontend build job. `docs/09-PLATFORM-ARCHITECTURE.md` §16 (the original "separate app for security isolation" plan) updated to record the decision and preserve the original reasoning for anyone who revisits real admin-app isolation later, rather than silently deleted.

**Why this direction, not the reverse:** `apps/admin` had zero real functionality to build on — no dependency on `@phoenix/api-client`, `@tanstack/react-query`, or any auth mechanism. `apps/web`'s admin routes are real, tested, and already deeply coupled to `apps/web`'s own `AuthProvider`, `QueryClientProvider`, `RequireRole` guard, `Navigation`/`Footer`, and i18n system, none of which exist as an extractable shared package. Honoring the original separate-app plan today would have required either a genuine shared-component-library extraction first (a real architecture project, explicitly out of this phase's "no UI redesign" scope) or duplicating that infrastructure wholesale into `apps/admin` — itself a new, worse duplicated-responsibility problem. See `docs/restore-point-phase14.4.md` for the full review.

**Status:** Resolved. `docs/09-PLATFORM-ARCHITECTURE.md` §16's original isolation rationale remains valid and can be revisited later as its own deliberate project — not a reason this decision was wrong today, given the code's actual state.

### CI Pipeline — Implemented (Phase 14.3), Not Yet Verified by a Real GitHub Run

`.github/workflows/ci.yml` now exists — 4 parallel jobs (Prisma validate + type-check + lint + format-check, backend tests, backend build, frontend build) plus a required `ci-summary` job, with dependency caching and per-job failure summaries. ESLint (pinned to the 8.x line — `eslint-config-next@14.2.15` only supports ESLint ≤8) and Prettier were both newly installed and configured; neither existed in any form before this phase.

**What was verified:** every command the workflow runs was executed locally, including with the real `apps/api/.env` temporarily removed and only the placeholder CI environment variables set (`DATABASE_URL`, `NEXT_PUBLIC_*`) — confirming the pipeline works from a clean checkout, not just in this pre-configured dev environment. All 5 required failure categories (Prisma schema errors, TypeScript errors, test failures, lint failures, build failures) were deliberately triggered and confirmed to fail with the correct real exit code, then reverted. Two genuine pre-existing issues were found and fixed in the process (an unused generic type parameter, a `require()` in a test file) — both zero-behavior-change. 220 files needed Prettier reformatting (never run before); applied once, verified zero regressions across the full test suite and all three app builds afterward.

**What was not verified, and cannot be from this session:** an actual GitHub Actions run. Pushing to a real GitHub remote and observing the workflow execute in GitHub's own runners is outside this session's local-filesystem scope. The workflow YAML is syntactically standard and every underlying command is proven to work identically to how the workflow invokes it, but "the pipeline runs successfully on GitHub" itself remains unconfirmed until the first real push. Branch protection (requiring `ci-summary` before merge) is also not configured — that requires real repository admin access this session doesn't have.

**Status:** Implemented, locally verified, awaiting first real remote run. See `docs/restore-point-phase14.3.md`.

### Forms — Bare/Cardless Layout — RESOLVED (Phase 14.8)

**Previously:** Login, Register, Checkout, Profile, Settings, Forgot Password, and Reset Password all rendered as bare forms directly on the flat page background — no card, border, or glass treatment, the single largest remaining visual gap between the homepage and the logged-in product per `docs/platform-pixel-audit.md`.

**Resolution:** a new `.ph-form-card` CSS class (built entirely from Phase 14.7's design tokens) applied to all 7 pages. Settings and Profile were additionally split into multiple distinct cards (Password/Sessions/MFA; Info/Preferences) instead of one long flat list, directly implementing the pixel audit's own recommendation.

**Status:** Resolved for all 7 pages. See `docs/restore-point-phase14.8.md`.

### Remaining Ad-Hoc Empty States — RESOLVED (Phase 14.8)

**Previously:** 13 pages beyond the 2 `EmptyState` already covered in Phase 14.7 still rendered empty-list states as raw `<p className="ph-state">` text, including one (Instructor Dashboard's own course list) that Phase 14.7's own sweep had missed.

**Resolution:** all 13 replaced with the existing `EmptyState` component. No page on the platform uses an ad-hoc empty layout anymore — verified by re-running the search pattern after all edits.

**Status:** Resolved. See `docs/restore-point-phase14.8.md`.

### No Loading Spinner/Skeleton Components — PARTIALLY RESOLVED (Phase 14.8)

**Previously:** every list page showed a bare "جارٍ التحميل..." text string while loading — no spinner, no skeleton, anywhere on the platform.

**Resolution:** `components/ui/Loading.tsx` (new) — `Spinner`, `SkeletonCard`, `SkeletonGrid`, `SkeletonList`, `SkeletonTable`. Applied to Instructor Dashboard, Orders, Admin Users, Course Catalog, My Courses (`SkeletonGrid`), Admin Audit Logs (`SkeletonTable`), and Admin Analytics (`Spinner`).

**Status:** Resolved for 7 pages. **Not yet applied** to Notifications, Library, Marketplace, News, Moderator Queue, Instructor Media, or any detail page — mechanical follow-up, same swap pattern, not done this phase to keep the diff reviewable.

### Table Search/Filter/Pagination — CORRECTED, mostly already existed (Phase 14.8)

**Previously claimed** (Phase 14.6B pixel audit): Orders and Admin Users lacked search/filter/pagination.

**Correction:** re-reading the actual code during Phase 14.8 found both already had real search/status/role filters and cursor-based pagination — the original audit claim was inaccurate. Admin Audit Logs also already had real exact-match filters and pagination. No filter/pagination work was needed; only loading-state and empty-state polish applied.

**Also clarified:** "sticky headers" don't apply anywhere on this platform — every list renders as a card grid, not an HTML `<table>` (confirmed: zero `<table>` elements exist in `apps/web/src/app`). Building one would be a real redesign, not a polish item.

**Status:** Resolved (as a documentation correction) — no code change was needed for search/filter/pagination themselves.

### Deferred UI Polish Scope (Phase 14.7 → 14.8, updated)

Phase 14.7 completed the Header fix, Critical/High Status System items, a first Design Tokens pass, and a 2-page EmptyState proof. Phase 14.8 then closed the Forms gap (all 7 pages), the full EmptyState rollout (13 more pages), and built + partially applied Spinner/Skeleton components — see `docs/restore-point-phase14.8.md` for the full accounting. **Still real, tracked, not abandoned, after both phases:**

- Moderator and Admin dashboards still have not had a dedicated stat-card/icon/section-header unification pass.
- Spinner/Skeleton components exist and are proven on 7 pages, but are not yet applied to Notifications, Library, Marketplace, News, Moderator Queue, Instructor Media, or detail pages.
- Only Login and Settings were checked at tablet/mobile width across both phases (plus the homepage, fixed in 14.7) — no platform-wide responsive review has been performed.
- No dedicated, tool-assisted accessibility audit (contrast ratios, full keyboard walkthrough, ARIA review of pre-existing pages) has been performed — only spot-checks confirming Phase 14.8's edits didn't disturb existing label/focus semantics.
- `globals.css`'s ~1850 pre-existing lines still use hardcoded hex/px directly rather than the design tokens — only new/touched code across both phases uses them.
- No modal/dialog or page-transition motion exists — the platform has no modals/dialogs anywhere in the codebase (confirmed by search), and Next.js App Router page transitions were judged out of scope for "subtle polish only."

**Status:** Known, scoped, not blocking anything currently shipped. See `docs/restore-point-phase14.8.md`'s "Remaining Visual Issues" section (8 items, each with its own disclosed reason) and `docs/next-session.md` for the suggested next slice.

### Notifications — API Only, No Delivery

The `Notification` Prisma model exists (`channel: in_app | email | push`, `readAt`, `sourceEventId`) and API-level create/list endpoints exist, but there is no delivery worker (`apps/workers` has zero job processors), no email provider configured anywhere in `.env`/`.env.example`, and no delivery-preferences table.

**Status:** Known, unresolved, not blocking anything currently shipped (every domain that could emit a notification today still functions without one). See `docs/phase-14-plan.md` Candidate D.

### Search Not Implemented

Meilisearch is provisioned in `infra/docker/docker-compose.yml` but has zero backend integration — no search module, no indexing hook on any domain, no query endpoint (confirmed by grepping `apps/api/src` for Meilisearch usage: no matches).

**Status:** Known, unresolved, not currently blocking (no user-facing catalog-scale problem reported). See `docs/phase-14-plan.md` Candidate E. Local development against Meilisearch inherits the same Docker/WSL2 limitation documented below, unless a hosted instance is used instead (the same bypass pattern already validated for Storage).

### No Email-Delivery Provider Configured

Email/SMS verification and password-reset tokens are generated and logged, never actually delivered — no email-provider credentials exist anywhere in `.env`/`.env.example` (only Storage/Stripe/AI keys are provisioned). Self-disclosed in `auth.service.ts`'s file header.

**Status:** Known, unresolved. Also blocks `docs/10-SECURITY-BIBLE.md` §5's MFA enrollment/disablement email-notification requirement once MFA is built — a real cross-dependency identified during this session's Security Architecture Review, not previously connected to the MFA work.

## Environment

### Global Rate Limiter

120 requests/minute

**Status:** Known Environment Limitation

Not a Playwright issue

### Docker Cannot Run Containers In This Environment (Infrastructure Pending — no longer blocks Storage, see below)

`docker ps`/`docker version`/`docker compose up` all fail: every call to the Docker Desktop engine (`npipe:////./pipe/dockerDesktopLinuxEngine`) returns `500 Internal Server Error`, and `docker compose up` hangs/times out rather than starting anything.

**Root cause:** `wsl -l -v` confirms WSL2 is not installed on this machine, and Docker Desktop's `desktop-linux` context requires a working WSL2 (or Hyper-V) VM backend to run any container. Fixing this requires administrator elevation (confirmed not available in this session — `IsInRole(Administrator)` returns `false`) and a system reboot — an operator action, outside this session's scope to perform unilaterally. This project's own `infra/docker/docker-compose.yml` already anticipated this exact scenario in its original top-of-file comment: *"some managed/IT-policy devices block the virtualization Docker Desktop requires."*

**Status:** Re-confirmed unchanged as of the storage-provider switch below (Phase 13.7). Classified per the `environment-validation` skill: **Category B — Infrastructure**, blocked on administrator privileges (an External Dependency). No non-admin local workaround exists (no alternate container runtime installed). Still relevant to local MinIO/Meilisearch use, but **no longer blocks object storage**, since Storage was moved to a hosted provider instead (see below).

**Impact:** Blocks starting the `minio`/`minio-init` Compose services and the local Meilisearch container. Does **not** block Media/Files/Storage anymore.

**Resolution (unchanged, still open):** Either fix Docker Desktop's backend on this machine (install WSL2, requires admin + reboot — an operator action), or continue using a hosted provider for anything that would otherwise need the local stack.

### Object Storage — RESOLVED (Phase 13.7: switched to Backblaze B2)

**Previously:** blocked on the Docker/WSL2 limitation above (local MinIO could never actually start).

**Resolution:** Bypassed local Docker entirely — `apps/api/.env`'s `STORAGE_*` variables now point at a real, hosted, S3-compatible provider (**Backblaze B2**, bucket `phoenix-storage`, region `us-east-005`, endpoint `https://s3.us-east-005.backblazeb2.com`). `apps/api/.env.example` updated with generic (non-secret) Backblaze B2 / S3-compatible placeholder guidance, replacing the old MinIO-specific placeholders.

**Path-style addressing:** B2 requires path-style requests. Verified this is already handled — `forcePathStyle: true` is hardcoded unconditionally in `apps/api/src/storage/storage.service.ts`'s `S3Client` constructor (applies to every provider, not provider-specific config), so no separate `STORAGE_FORCE_PATH_STYLE` env var was needed or added.

**Live verification performed (Phase 13.7, real, no mocks):** backend rebuilt (cleared a stale `tsconfig.tsbuildinfo` incremental-build cache — the same recurring issue class flagged in Phase 13.6 and earlier) and restarted; startup log confirmed `[StorageService] Storage configured: endpoint=https://s3.us-east-005.backblazeb2.com bucket=phoenix-storage region=us-east-005`. Full chain executed against the real bucket:

| Step | Result |
|---|---|
| Presigned upload URL generation | ✅ `201`, real SigV4 URL |
| Real `PUT` of file bytes to B2 | ✅ `200` |
| `POST /files/:uploadId/complete` (magic-byte MIME detection reads the real object back from B2) | ✅ `201`, `File` + `Media` records created, `mimeType: image/png` correctly detected |
| Object presence in bucket (`HeadObjectCommand`, independent of the app) | ✅ confirmed present, `contentLength: 68` bytes |
| Cleanup (`DeleteObjectCommand`) | ✅ issued |
| Cleanup confirmation (`HeadObjectCommand` re-check) | ✅ `NotFound` — object confirmed deleted, no leftover in the bucket |

**Status: Resolved.** The real upload → storage → complete-upload chain that was blocked since Phase 13.4 is now verified working end to end against production-real infrastructure. Signed-URL TTLs, connection-refused handling, and no-orphan-row behavior were already verified in Phase 13.6 and are unaffected by the provider switch (same code path, different endpoint).

**Residual, non-storage side effect of this test — RESOLVED (Phase 13.8):** a real test user account (`storage-verify-*@example.test`) and its associated `File`/`Media`/audit-log rows were created in the real (Neon) database during verification. Rather than delete them (no cascade-delete path from `User`, and deleting audit-log rows would conflict with this project's audit-log-preservation principle), they are now explicitly marked instead of left indistinguishable from real data — see "Test-Data Marking" below.

### Test-Data Marking (`User.isTestData`) — added Phase 13.8

Added `isTestData Boolean @default(false) @map("is_test_data")` to `User` (migration `20260805064713_add_user_is_test_data`) so accounts created by test/verification flows (like the `storage-verify-*` account above) are explicitly distinguishable from real user data, instead of silently indistinguishable.

**Naming evaluated against alternatives** (`isQA`, `isDemo`, `isAutomation`, `isSeed`/reusing the project's existing "seed" vocabulary, a `source` string/enum) — `isTestData` chosen: wide enough to cover both this ad hoc verification case and future automated-test fixtures, without conflating with legitimate seed/reference data (`Roles`/`Permissions`/etc., a different concept — never meant to be bulk-deleted) or demo accounts (which may be deliberately kept for sales/product purposes). A `source` enum was considered and rejected as speculative generality — no second real value exists today.

**Scope decision:** added to `User` only, not duplicated across other tables. Every row a test user touches (`File.uploadedById`, `AuditLog.actorUserId`, and transitively `Media` via `File`) is identifiable by joining back to this one flag — single source of truth per `engineering-standards` §3, avoids a 49-table migration for a fact derivable from one place.

**Not exposed in any API/DTO** — schema/database-only for now, by design, until an actual admin-facing need (e.g. a filter UI) justifies exposing it.

**Migration-history discovery (real, pre-existing gap, unrelated to this task but found while performing it):** `prisma migrate status` reported all 18 prior migrations as "not yet applied," while the live Neon database already had the matching tables — the `_prisma_migrations` bookkeeping table had never been created, meaning this database's schema was originally provisioned via `prisma db push` at some point, not `prisma migrate deploy`. Fixed by baselining (`prisma migrate resolve --applied <name>` for all 18, per Prisma's documented procedure — metadata-only, no SQL executed, no data touched) before adding the new migration. Not itself a defect in the schema (columns matched exactly), but migration tooling should be used consistently (`migrate deploy`, not `db push`) going forward to avoid this recurring.

**Retroactively applied:** the existing `storage-verify-*@example.test` user (`id: 019fd091-c06c-7361-8398-f1cdef1316b0`) confirmed tagged `isTestData: true`.

**Regression check:** full backend suite re-run after the schema change and Prisma Client regeneration — 22/22 suites, 166/166 tests still passing.

### Minor: Storage-Unreachable Errors Reported as "Unrecognized File Type" (cosmetic, not a security or data issue)

When `completeUpload`'s magic-byte MIME check can't read the uploaded object (for any reason, including a genuine storage connectivity failure — confirmed live in Phase 13.6), it returns the same `400 "Uploaded content does not match an allowed file type"` it would for a truly invalid file. The real underlying error (e.g. a connection failure) is always logged clearly server-side either way (`[StorageService] ERROR Failed to read object prefix...`), so this is not a silent failure — just an imprecise client-facing message in one specific failure mode. Out of scope to fix in an infrastructure-only phase (would require a business-logic change in `apps/api/src/modules/files/files.service.ts`).

### No Malware Scanning Engine

`File.scanStatus` is created as `'pending'` and nothing in the codebase ever transitions it to `'clean'` — no scanning engine is integrated. This means the real `425` "still scanning" gate in front of signed-URL generation is permanently active for any real file today.

**Status:** Known, pre-existing, disclosed platform-wide limitation (also affects Library/Products modules identically, not specific to Media). Confirmed still true as of Phase 13.4.
