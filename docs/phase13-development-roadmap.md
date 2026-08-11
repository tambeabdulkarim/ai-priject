# Phase 13 — Technical Development Roadmap

Prepared from `docs/documentation-index.md`, `docs/project-status.md`, `docs/known-issues.md`, `docs/documentation-policy.md`, and `docs/next-session.md` (the five canonical sources this phase was scoped to), combined with direct, first-hand knowledge of the actual implementation gained while building and fixing the E2E suite across Phase 11 (real code read/edited: `courses.service.ts`, the Course Editor page, `authorization.ts`, the AI/Media/Notifications frontend pages, and the live E2E coverage of Public/Auth/User/Marketplace/AI/Instructor/Moderator/Admin).

**Confidence note, stated up front:** the five canonical docs describe *documentation* state and the *E2E-tested* surface, not a full line-by-line audit of every backend module. Where a claim below rests on direct Phase 11 observation rather than a canonical doc, it's marked. This roadmap is accurate to the best available evidence without re-opening historical documentation, per this phase's explicit instruction — but a few items (backend unit-test coverage, notification preferences, payment webhook fulfillment) are flagged as **unverified this session** rather than asserted, because I don't have direct evidence either way and won't guess.

---

## 1. Current Implementation Percentage

**Estimated ~70–75% of a full platform**, unevenly distributed:

| Domain | Estimated completeness | Basis |
|---|---|---|
| Authentication | ~95% | Fully built, E2E-tested end to end (register/login/logout/forgot/reset, RBAC, refresh rotation) |
| Courses/Lessons/Instructor workflow | ~85% | Full CRUD + review/publish workflow real and tested; one real gap fixed this cycle (text-lesson body); video lessons blocked on Media (see §13) |
| Marketplace/Payments (checkout) | ~80% | Product listing/detail/checkout real, Stripe redirect confirmed live; **order fulfillment after successful payment not verified this session** (E2E deliberately stops before entering card details) |
| Admin | ~85% | Dashboard, Users, Audit Logs, Analytics, Settings all real and tested |
| Moderator | ~90% | Queue + full cross-role review workflow real and tested as of Phase 11.7.2's fix |
| User (learner) | ~85% | Dashboard, Profile, Notifications list, My Courses, Orders, Certificates all real and tested |
| AI | **~15%** | Endpoints exist but `POST /ai/requests` returns a real, permanent `501` — deliberately blocked pending a feature catalog/schema decision, not a bug |
| Media | **~40%** | Upload/complete/get endpoints real; no confirmed path from an uploaded file to a playable Media record — a disclosed, direct-observed gap |
| Notifications | **Unverified** | List/read confirmed real and tested; preferences endpoint status not directly observed this session |
| Analytics | **Unverified depth** | Page loads and returns a real overview with a date range, confirmed; breadth/depth of metrics not audited |
| Testing | ~85% suite exists, **0% confirmed current** | 44-test E2E suite is real and was passing per-area; full-suite pass/fail has not been re-measured since the last two bug fixes (documented as stale in `project-status.md`) |

This estimate should be treated as directional. If precision matters before committing resources, a short, code-only audit pass (no docs, just reading each module) would sharpen it — that is itself a candidate task, not done here per this phase's scope.

---

## 2. Remaining Backend Work

- Close the File→Media gap (see §13) — the single largest confirmed backend gap.
- Resolve the AI feature catalog/schema decision that's blocking §5 (documentation/product decision, not pure coding).
- Verify/complete payment-success order fulfillment (§11) — confirm the Stripe webhook actually grants entitlement end-to-end; not confirmed this session.
- Verify notification preferences endpoint status (§12) and complete if stubbed.

**Priority:** High (Media, AI-catalog decision) / Medium (payments verification, notifications) · **Effort:** Media ~3–5 days, AI catalog decision is a product/doc task not an estimate-able build, payments verification ~1–2 days, notifications ~1–3 days depending on findings · **Dependencies:** none blocking start · **Blocking items:** AI catalog decision blocks all AI backend work · **Risk:** Low for Media/payments (additive, well-isolated); Low-Medium for notifications (unknown scope until verified)

## 3. Remaining Frontend Work

- Instructor "Progress statistics" panel is an explicit, disclosed BLOCKED notice (no backend endpoint) — real UI copy exists, just no data; unblocks once a backend enrollment/completion-stats endpoint exists.
- Video lesson UI (upload + attach) is fully built but produces no playable result — unblocks once §13 (Media) is resolved; no new frontend work needed beyond wiring the real Media id once it exists.
- `docs/00`–`08` frontend-facing scaffolds (Design System, Component Standards, Design Tokens) are documentation gaps, not code gaps — noted for awareness, not a coding task.

**Priority:** Medium · **Effort:** Small once backend unblocks (both items are "wire up existing UI to a new real endpoint," not new UI) · **Dependencies:** backend Media work (§13) and a new instructor-stats endpoint · **Blocking items:** both wait on backend · **Risk:** Low

## 4. Marketplace Remaining Work

- Core flow (listing, filters, product detail, add-to-cart, checkout redirect) is real and E2E-tested.
- Order fulfillment after a completed payment is the one unverified link (see §2, §11).
- No other gaps directly observed.

**Priority:** Medium (verification, not new build) · **Effort:** ~1–2 days to verify + fix if broken · **Dependencies:** a real Stripe test-mode completion (needs test card flow, not currently exercised by E2E on purpose) · **Blocking items:** none · **Risk:** Medium — payment fulfillment correctness is high-consequence if wrong, even though the flow up to Stripe is proven solid

## 5. AI Remaining Work

- Almost entirely unbuilt by design: `AiService.createRequest` throws a real, permanent `501 NOT_IMPLEMENTED` because no feature catalog, per-feature input schema, permission keys, or provider adapter is documented yet.
- This is the single largest genuine feature gap in the platform, and it is **blocked on a decision, not on engineering capacity** — someone needs to define what AI features actually ship (a documentation/product task) before any backend/frontend AI work can start.
- Quota/usage display already handles the "not tracked yet" state correctly on the frontend — that part doesn't need rework once real usage exists.

**Priority:** High strategic value, but **cannot start** until unblocked · **Effort:** Unknown/unestimatable until scope is defined · **Dependencies:** feature catalog decision (product/doc work, likely a dedicated phase) · **Blocking items:** this blocks itself — nothing else in the roadmap depends on it · **Risk:** High if rushed (undefined scope invites scope creep and rework); Low if properly sequenced behind a real decision

## 6. Admin Remaining Work

- Dashboard, Users, Audit Logs, Analytics, Settings all real and E2E-tested.
- No gaps directly observed this session.

**Priority:** Low (maintenance only) · **Effort:** N/A · **Dependencies:** none · **Blocking items:** none · **Risk:** Low

## 7. Instructor Remaining Work

- Course/module/lesson CRUD and review-submission workflow real and tested (including this cycle's text-lesson fix).
- Progress statistics panel blocked on a backend endpoint (see §3).
- Video lesson content blocked on Media (see §13).

**Priority:** Medium (both gaps are real, user-visible, but each has a small, well-understood fix) · **Effort:** See §3/§13 · **Dependencies:** §13 · **Blocking items:** Media · **Risk:** Low

## 8. Moderator Remaining Work

- Queue and full review workflow (including the moderator-visibility fix from Phase 11.7.2) real and tested.
- No gaps directly observed this session.

**Priority:** Low (maintenance only) · **Effort:** N/A · **Dependencies:** none · **Blocking items:** none · **Risk:** Low

## 9. User (Learner) Remaining Work

- Dashboard, Profile, Notifications (list), My Courses, Orders, Certificates all real and tested, including correct real-empty-state handling.
- No gaps directly observed this session beyond the Notifications-preferences question (§12).

**Priority:** Low · **Effort:** N/A beyond §12 · **Dependencies:** none · **Blocking items:** none · **Risk:** Low

## 10. Authentication Remaining Work

- Register/login/logout/forgot-password/reset-password, refresh-token rotation, and RBAC are all real and fully E2E-tested, including the recent moderator-authorization fix.
- No gaps directly observed this session. This is the most complete domain in the platform.

**Priority:** Low (maintenance only) · **Effort:** N/A · **Dependencies:** none · **Blocking items:** none · **Risk:** Low

## 11. Payments Remaining Work

- Checkout initiation (real Stripe Checkout Session, real redirect) is proven working end-to-end via E2E.
- What happens after a successful payment (webhook → order fulfillment → entitlement grant) has **not been directly verified this session** — E2E stops before completing payment, by design (never enters real card details).

**Priority:** High (financial correctness) · **Effort:** ~1–2 days to verify with Stripe test-mode cards; more if a real bug is found · **Dependencies:** none · **Blocking items:** none, but should be verified before it's trusted in production · **Risk:** Medium-High until verified — this is the one area where "probably fine" isn't good enough

## 12. Notifications Remaining Work

- Listing/reading notifications is real and E2E-tested.
- Notification **preferences** (per-category channel opt-in/out) status is **not directly observed this session** — flagged for verification rather than asserted as broken or working.

**Priority:** Low-Medium (pending verification) · **Effort:** Unknown until checked; likely small if it needs finishing · **Dependencies:** none · **Blocking items:** none · **Risk:** Low

## 13. Media Remaining Work

- Upload-URL issuance, upload completion, and media retrieval endpoints are real.
- **No confirmed path exists from a completed file upload to a real, playable Media record** — directly observed in the Course Editor's own disclosed UI copy ("no backend endpoint creates a playable Media record from any uploaded file"). This is the clearest, most concrete, best-evidenced gap in the entire platform.
- This single gap blocks: instructor video lessons (§7), and indirectly any future feature that would want to attach real media to content.

**Priority:** **Highest** among concrete (non-decision-blocked) engineering gaps · **Effort:** ~3–5 days (define the File→Media creation step, likely alongside the scan/transcode workflow already documented in the workflow architecture) · **Dependencies:** none — file upload infrastructure already exists · **Blocking items:** none blocking *this* work; *this* work blocks video lessons · **Risk:** Low — purely additive, doesn't touch any working flow

## 14. Analytics Remaining Work

- Admin analytics overview page loads and returns real data with a working date-range control — confirmed.
- Breadth/depth of available metrics was not audited this session.

**Priority:** Low (pending a scoped review of what metrics stakeholders actually need) · **Effort:** Unknown until scoped · **Dependencies:** none · **Blocking items:** none · **Risk:** Low

## 15. Testing Remaining Work

- 44-test real, no-mock E2E suite exists and covers all major areas.
- Full-suite pass/fail has not been re-measured since the last two bug fixes — current numbers in `project-status.md` are explicitly marked stale.
- No dedicated testing/E2E reference document exists yet (tracked as a documentation gap, not blocking).
- Backend unit-test coverage state was not verified this session.

**Priority:** Medium — establishing a fresh, accurate baseline is cheap and removes uncertainty from every other estimate above · **Effort:** ~1 batch-suite run (already-built tooling, `run-batches.js`) plus triage of any real failures · **Dependencies:** a clean backend restart, per the suite's own documented environment sensitivity · **Blocking items:** none · **Risk:** Low — pure verification, no code risk, but findings could surface new work

---

## Recommended Execution Order

1. **Media (§13)** — highest-confidence, best-evidenced, self-contained gap; unlocks §7's video lessons; zero risk to existing working flows.
2. **Payments verification (§11)** — high financial stakes, should not stay unverified once other work starts building on top of the order/entitlement model.
3. **Fresh E2E baseline (§15)** — cheap, de-risks every subsequent estimate in this roadmap; ideally done in parallel with #1 once Media work has something new to test.
4. **Instructor progress-stats endpoint (§3/§7)** — small, well-understood, high visible value to instructors.
5. **Notifications preferences verification (§12)** — small, low-risk, resolve the unknown.
6. **AI feature-catalog decision (§5)** — start the *decision* process now (it's not code work) so it's not the long pole later; do not start AI *implementation* until that decision lands.
7. **Analytics scoping (§14)** — low urgency, revisit once a stakeholder need is articulated.

Admin, Moderator, User, and Authentication (§6, §8, §9, §10) require no scheduled work — maintenance-only.

---

## Recommendation: Which Single Task Executes First

### **Task: Close the File→Media gap (§13) — implement the missing link from a completed file upload to a real, playable Media record.**

**Why it is first:**
It is the single most concretely evidenced gap in the entire platform — not inferred, not stale-documentation-derived, but read directly from the current Course Editor's own disclosed UI copy this session. Every other major gap (AI, payments-verification, notifications) is either blocked on a non-engineering decision (AI), requires external test-mode setup before work can even start (payments), or is an unknown pending verification (notifications) — Media is the only top-tier item that is *purely* an engineering task, ready to start today, with a fully-defined problem statement.

**What it unlocks:**
Instructor video lessons — a feature whose entire UI (upload button, progress state, attach action) is already built and wired to real endpoints, but currently cannot produce a working result no matter what a user does. Closing this gap converts an already-shipped-looking-but-non-functional feature into a real one, which is higher-leverage than starting any brand-new feature from zero.

**Why it minimizes technical debt:**
It resolves a gap the team has already gone to the trouble of *disclosing in the product itself* (the in-app warning text), rather than silently accumulating more work on top of an incomplete foundation. Leaving it unresolved while building new features elsewhere would mean every future media-adjacent feature (AI-generated thumbnails, certificate images, richer marketplace product media, etc.) inherits the same unfinished plumbing. Fixing it now means everything built after inherits a *complete* media pipeline instead of a stubbed one.

**Why it is the safest next step:**
It is strictly additive — a new service method/endpoint step in the existing upload flow — and touches no code path that any of the currently-passing E2E coverage (Auth, Courses, Marketplace, Admin, Moderator, User) depends on. There is no plausible regression surface into working, tested functionality. Contrast with payments (real financial risk), AI (undefined scope, real risk of building the wrong thing), or notifications (unknown current state) — Media is the one item where "start today" carries the least uncertainty and the least downside.

No implementation has been started. This is a recommendation only, per this phase's explicit scope.
