# Phase 11.7 Review Report

Technical review of the 14 remaining Phase 11.6 E2E failures. No fixes applied, no application logic touched, no backend throttling touched, no tests hidden or mocked — review only, per instructions. Based on the last clean, isolated Phase 11.6 measurement (fresh backend restart, no orphaned processes) — not re-run.

## 1. Failure classification

| Test | Category | Root Cause | Recommended Fix | Priority |
|---|---|---|---|---|
| `moderator/review-actions.spec.ts` — course submitted for review shows permission boundary | A. Real Application Bug | `POST /courses/:id/modules/:id/lessons` returns `400 VALIDATION_ERROR: "text lessons require body"`. The Course Editor's "Add lesson" form collects only a title and content-type — never a body — so a `text` lesson can never satisfy backend validation through the real UI. | Backend/Frontend contract fix: either add a body field to the create-lesson form for `text` type, or relax the backend requirement to allow an empty body at creation (filled in later via edit). Requires a product decision, not a test change. | High |
| `admin/settings.spec.ts` — as plain admin, permission-boundary notice | B. Environment Limitation | Real `429 RATE_LIMITED` from apps/api's global throttler (120 req/60s) during `loginAs`. | None available at harness level; see §3. | — |
| `admin/settings.spec.ts` — as superadmin, settings list | B. Environment Limitation | Same — real `429` on login. | Same. | — |
| `admin/workspace.spec.ts` — Dashboard | B. Environment Limitation | Same — real `429` on login (worker-scoped `adminPage` fixture setup). | Same. | — |
| `admin/workspace.spec.ts` — Users | B. Environment Limitation | Cascade of the same fixture-level `429` above (shared worker fixture). | Same. | — |
| `admin/workspace.spec.ts` — Audit Logs | B. Environment Limitation | Cascade of the same fixture-level `429` above. | Same. | — |
| `admin/workspace.spec.ts` — Analytics | B. Environment Limitation | Cascade of the same fixture-level `429` above. | Same. | — |
| `marketplace/product-details.spec.ts` — Product Details | B. Environment Limitation | Real `429` on `learnerPage` login. | Same. | — |
| `marketplace/product-details.spec.ts` — unknown slug doesn't crash | B. Environment Limitation | Cascade of the same fixture-level `429` above. | Same. | — |
| `marketplace/product-details.spec.ts` — Checkout Flow | B. Environment Limitation | Cascade of the same fixture-level `429` above. | Same. | — |
| `ai/workspace.spec.ts` — Dashboard | B. Environment Limitation | Real `429` on `learnerPage` login. | Same. | — |
| `ai/workspace.spec.ts` — Quota | B. Environment Limitation | Cascade of the same fixture-level `429` above. | Same. | — |
| `ai/workspace.spec.ts` — Request Lookup | B. Environment Limitation | Cascade of the same fixture-level `429` above. | Same. | — |
| `ai/workspace.spec.ts` — Blocked Request UI | B. Environment Limitation | Cascade of the same fixture-level `429` above. | Same. | — |

No failure in this set falls into **C. Playwright/Test Harness Issue** or **D. Expected Behaviour** — every harness-level defect identified during Phase 11.6 (reset-password locator collision, logout navigation race, register timeout, review-actions locator matching a hidden `<select>` option) was already fixed and is passing in the current suite.

## 2. Pattern behind the 13 Category B failures

All 13 trace to a single mechanism: `admin`, `learner` worker-scoped role fixtures (`tests/e2e/fixtures/roles.ts`) log in once per batch process. When that one login call is rate-limited, every test in that batch depending on the fixture fails together — this is a *cascade from one root event*, not 13 independent flaws. It only occurs in the batches that run immediately after the write-heavy Instructor+Moderator batch (course/module/lesson creation), which alone generates enough real traffic to leave the shared 120-req/60s window with little headroom.

## 3. Is Phase 11.7 (further harness work) necessary?

**No further test-harness-only lever changes the outcome for these 13 failures.** The batch/cooldown strategy, worker-scoped fixture reuse, and fail-fast error labeling built in Phase 11.6 already represent the ceiling of what's achievable without either:
- raising the backend's throttle limit for a test/CI environment (a backend config change — out of scope by explicit instruction), or
- reducing the real request volume the application itself generates per page (a business-logic/UI change — out of scope by explicit instruction).

The 1 Category A failure requires a real backend/frontend fix (lesson-creation form or validation rule) — also outside E2E harness scope.

There is no remaining Category C or D item for a Phase 11.7 harness iteration to address. Continuing Phase 11.7 as a *test-harness* phase would not change these results.

## 4. Recommendation

**OPTION B — Close Phase 11. Proceed directly to Phase 12 Documentation Freeze.**

Rationale:
- 30/44 tests pass cleanly and repeatably.
- 13/44 failures are a single, well-understood, correctly-attributed environment cascade — not a harness defect — and require an infrastructure/environment decision outside this phase's authority.
- 1/44 failure is a genuine, precisely-documented backend bug, now tracked in `docs/known-issues.md` for a future backend-owned fix.
- No open harness work remains that this phase is authorized to act on.

Two items are left open for whoever owns them next (tracked in `docs/known-issues.md`, not blocking a documentation freeze):
1. Backend: fix the text-lesson-creation validation/form gap.
2. Environment owner: decide whether to provision a higher-throttle test/CI backend profile — a decision, not a Phase 11 deliverable.

---

## Addendum — Phase 11.7.1 (2026-08-04)

Item 1 above (text-lesson-creation) is now **Resolved. Verified.** Root cause confirmed frontend-only (the create-lesson form never collected a `body` value); backend validation was correct throughout. See `docs/bugfix-text-lesson-body.md` and `docs/phase11.7.1-verification-report.md` for the fix and its targeted regression verification.

That verification also **discovered a second, previously-hidden Category A bug**: moderators get a real `404` viewing a non-published course's details (`GET /courses/:slug`, `moderator` missing from backend `EDITORIAL_ROLES`), blocking the moderator review workflow. This was always present but unreachable by the E2E suite until the text-lesson fix let the test progress further. It is not a regression from that fix. Tracked in `docs/known-issues.md`; not fixed in Phase 11.7.1 (backend logic change, out of scope for that phase). This item should be weighed before a final Phase 12 freeze — see the Phase 11.7.1 verification report's recommendation.
