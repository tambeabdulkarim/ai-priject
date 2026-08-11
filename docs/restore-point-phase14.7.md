# Restore Point

**Version:** Phase 14.7 (Platform Final Polish & UI Completion) — **partial**

**Status:** Critical/High visual-audit findings addressed; full 12-section brief not completed in one pass — see "What Was Not Done" below. Zero regressions.

**Date:** 2026-08-06

## Where This Phase Sits

This is a *third*, separate informal numbering track from this project's two existing ones (see `docs/project-status.md`'s naming note): a visual-review/polish thread (**14.6 → 14.6B → 14.6C → 14.7**) that ran independently of the `docs/phase-14-plan.md` Candidate track (A/B/F/C done; **D — Notifications delivery — is still next on that track**, completely unaffected by this phase). Do not read "Phase 14.7 complete" as "Candidate D done" — they are unrelated.

The four inputs for this phase were:
- `docs/platform-visual-review.md` — real-screenshot visual review (Phase 14.6B)
- `docs/platform-pixel-audit.md` — pixel/consistency audit with numeric scores and a ranked Critical/High/Medium/Low list (Phase 14.6B)
- `docs/visual-review/` — the interactive HTML review gallery (Phase 14.6C)
- The phase 14.7 brief itself, which explicitly scoped the work to "every Critical and High issue identified during the visual audits" as the **Primary Goal**, with a long list of additional polish work as secondary scope

This restore point covers implementation of the Primary Goal plus the addendum's explicit infrastructure requirements (design tokens, no duplicated components). The secondary-scope items (dashboards, forms, tables, skeletons, full a11y pass) were deliberately **not** attempted in full — see below.

## What Was Actually Broken (root causes, not just symptoms)

Two of the three "Critical" findings from the pixel audit had real, precise root causes once the actual code was read (not re-inferred from screenshots):

1. **Header never showed logged-in state.** `apps/web/src/components/Navigation.tsx` — the one component all 38 pages render — never called `useAuth()` at all. It unconditionally rendered the logged-out Login/Create Account buttons regardless of session state. Not a timing bug, not a re-render bug — the component simply never read auth state.
2. **Header overflow at tablet width (~820px).** `globals.css`'s nav-collapse breakpoint was `@media (max-width: 768px)`. The tablet viewport actually tested in Phase 14.6B (820px) sits *above* that breakpoint, so the full desktop nav (7 links + 5 action controls) never collapsed to the hamburger menu and had no room to fit.

A third finding was investigated and **retracted, not fixed**:

3. **`/instructor/courses` "404."** Re-investigation found `apps/web/src/constants/routes.ts` has no `instructorCourseList` route, and nothing in the app links to `/instructor/courses` (bare, no sub-path) — only `/instructor/courses/new` and `/instructor/courses/[id]/edit` are real. The Instructor Dashboard itself (`/instructor`) *is* the course list. The Phase 14.6B screenshot script had navigated to a guessed URL, based on the directory name containing `new`/`[id]` subdirectories, that was never part of the actual product. This is a documentation-of-a-mistake correction, not an engineering fix — no code was changed for this item, per the phase's own instruction to stop and document rather than build something out of scope (in this case, an entire new course-listing page that duplicates the dashboard).

A fourth, real bug was found only while fixing #1 (not in either prior audit, since it required reading `services/auth-client.ts`, not just screenshots):

4. **Header would show a bare "?" instead of the user's email on every fresh page load.** `getCurrentAuthUser()` (used by `recoverSession()`, which runs on every full page load/refresh while authenticated — the common case, not an edge case) deliberately returns `email: ''` by its own design comment, since the JWT it decodes carries no email claim. The real email only exists on `profile` (`GET /users/me`, fetched via React Query once a session exists). Fixed by preferring `profile.email` over `user.email` for display, with `user.email` only as the brief pre-fetch fallback.

## What Was Changed

### Header (Critical — done)

- **`apps/web/src/components/Navigation.tsx`** — now reads real auth state via `useAuth()`. Authenticated: renders a user-menu trigger (avatar initial + truncated email), a dropdown (email header, Dashboard link, Settings link, Logout), and a bell icon with a live unread-count badge (`useNotificationsList`, gated `enabled: isAuthenticated` so anonymous visitors never fire it). Anonymous: unchanged Login/Create Account buttons. The mobile drawer's action row was updated the same way, so behavior is consistent across desktop and mobile, not just fixed in one place. Click-outside and Escape both close the dropdown; it closes automatically on route change.
- **`apps/web/src/hooks/useNotifications.ts`** — `useNotificationsList` gained an optional second `options: { enabled?: boolean }` argument (default `true`, so every existing caller is unaffected) so the header can gate the fetch without firing it for anonymous users.
- **`apps/web/src/app/globals.css`** — new `@media (max-width: 900px)` block duplicating only the nav-collapse-critical rules (hide `.ph-nav`, show `.ph-menu-btn`, hide inline auth/user-menu controls, allow wrap) ahead of the existing `768px` block, which is untouched. New `.ph-user-menu`/`.ph-user-trigger`/`.ph-user-avatar`/`.ph-user-dropdown*`/`.ph-notif-dot` rules.

### Design Tokens (addendum requirement — first pass, not a full retrofit)

- **`apps/web/src/app/globals.css`** `:root` — expanded from 7 color variables to a fuller set: `--ph-gradient`, `--ph-surface`/`--ph-surface-hover`/`--ph-border`/`--ph-border-accent`, `--ph-radius-{sm,md,lg,pill}`, `--ph-space-{1..8}`, `--ph-shadow-{sm,md,glow}`, `--ph-status-{green,amber,red,blue,grey}`, `--ph-motion-{fast,base}`. A `prefers-reduced-motion` global rule was added alongside. Every new/touched component in this phase uses these tokens exclusively — no new hardcoded hex/px was introduced.
- **Deferred, disclosed, not silently skipped:** the ~1850 pre-existing lines of `globals.css` still use hardcoded hex/rem values directly (e.g. `linear-gradient(135deg, #7c3aed, #db2777)` instead of `var(--ph-gradient)`). Retrofitting all of it is mechanical but large-diff (every existing selector) and was out of scope for this pass — the phase brief's addendum says to create tokens "if not already existing" and make new work depend on them, which this does; it does not say to retrofit the entire file in the same pass, and doing so without a dedicated visual-regression pass would be the highest-risk change in this phase for the least-scoped benefit.

### Shared Components (addendum requirement: "no duplicated UI components")

- **`apps/web/src/components/ui/StatusBadge.tsx`** (new) — one component, a lookup table over the real, already-known status vocabulary (`packages/types/src/{courses,marketplace}.ts`: draft/in_review/published/archived/pending/paid/succeeded/refunded/cancelled/failed/active/suspended/deactivated), colored by semantic family (grey/blue/green/amber/red), Arabic/English labels matching the UI's existing copy. Applied to:
  - `apps/web/src/app/[lang]/instructor/page.tsx` — course cards (was `<span>{course.status}</span>`)
  - `apps/web/src/app/[lang]/orders/page.tsx` — order cards (was `{t.status[order.status] ?? order.status}`)
  - `apps/web/src/app/[lang]/admin/users/page.tsx` — user cards (was `<p>{user.status}</p>`)
- **`apps/web/src/components/ui/EmptyState.tsx`** (new) — icon + title + description + primary/secondary CTA. Deliberately formalizes the platform's existing inline empty-state pattern (found in Phase 14.6B to be the single most visually consistent thing on the platform) rather than replacing it with something new. Applied to:
  - `apps/web/src/app/[lang]/my-courses/page.tsx`
  - `apps/web/src/app/[lang]/certificates/page.tsx`
  - **Not yet applied to:** Checkout, Notifications, Media Manager, Course Catalog — same inline `<p className="ph-state">` pattern still in place there. Mechanical follow-up (each is a 3–5 line swap using the now-existing component), not done here to keep this phase's diff reviewable rather than touching every list page in one pass.

### Test-Data Visibility (High)

- **`packages/types/src/users.ts`** — added `isTestData: boolean` to the `SafeUser` interface. This is a **type-declaration-only fix**: `apps/api/src/modules/users/users.service.ts`'s `toSafeUser()` already spreads the full Prisma `User` row (minus `passwordHash`/`mfaSecret`), so `isTestData` was already present in every real API response — the frontend simply had no typed way to read it. Zero backend change, zero API contract change (the wire format is unchanged; only the TypeScript type now matches the runtime reality).
- **`apps/web/src/app/[lang]/admin/users/page.tsx`** — renders a muted "بيانات اختبار"/"Test data" badge next to the status badge when `user.isTestData` is true. Verified against real data: only the Phase 13.7 `storage-verify-*` account (the one row actually retroactively tagged in Phase 13.8) shows the badge; the ~13 `E2E Register Test` accounts do not, because they were never tagged — this is correct, existing database state, not a bug in the new UI.

## What Was NOT Done (disclosed, not silently dropped)

The phase brief's Work Scope had 12 sections; this pass covered §2 (Header) and the Critical/High portion of §3 (Status System) in full, plus a first pass on the addendum's Design Tokens requirement and one component from §7 (Empty States). **Not done in this pass:**

- **§1 Global Design Consistency** — only the tokens infrastructure exists; the platform-wide retrofit (every card/button/shadow using them) is not done.
- **§4 Forms** (Login/Register/Checkout/Profile/Settings/Forgot-Password/Reset-Password) — still render as bare, cardless forms on the flat background, unchanged from the pixel audit's findings. No glass-card treatment applied.
- **§5 Dashboard Polish** for Moderator and Admin (Instructor and Student got StatusBadge only, not a full stat-card/icon/section-header unification pass).
- **§6 Tables** — Admin Users/Orders/Audit Logs/Analytics did not get search/filter/pagination/sticky-header work. (Note: Orders and Admin Users already had real search/filter/pagination before this phase — the pixel audit's claim that they lacked it was itself inaccurate; verified directly against the code while making the StatusBadge change.)
- **§8 Loading** — no Spinner/Skeleton components built.
- **§9 Responsive Completion** — only the header's tablet breakpoint was fixed; no other page was reviewed at tablet/mobile width this phase.
- **§10 Accessibility** — no dedicated contrast/keyboard/ARIA audit performed this phase (the new user-menu dropdown does have `role="menu"`/`aria-expanded`/`aria-haspopup`/focus-visible support by construction, consistent with the rest of the codebase's existing pattern, but this wasn't a systematic pass).
- **§12 Animations** — the new dropdown has a fade/slide-in transition (`ph-dropdown-in`); no broader hover/transition audit was performed.

**Why stopped here rather than attempting all 12 sections shallowly:** the phase's own Engineering Rules require verifying "every page still functions" and "no regressions" — doing that honestly (real type-check, lint, build, and backend test runs, plus real screenshots) for 12 sections' worth of changes across every authenticated page in one pass was not achievable without either working far past what could be verified, or claiming completion without verification. The Primary Goal (Critical/High findings) was scoped, built, and verified for real; the rest is real, tracked follow-up work, not silently dropped — see `docs/next-session.md`.

## Regression Verification

- `npx tsc --noEmit` — clean, `apps/web` (includes `packages/types` via the workspace reference).
- `npm run type-check --workspace=@phoenix/types` — clean.
- `npm run lint --workspace=apps/web` (`next lint`) — "No ESLint warnings or errors."
- `npm run build --workspace=apps/web` — succeeds, all 60 routes (including every route touched this phase) build without error.
- `npm test --workspace=apps/api` — **201/201 passing**, unaffected (no backend code touched — the only cross-cutting change, `SafeUser`'s type, is frontend-package-only and doesn't change the backend's actual response shape, which already included the field).
- Zero business logic, API contract, database schema, or permission changes, per the phase's explicit Engineering Rules.

## Real Before/After Screenshots

Captured with the same method as Phase 14.6B/C (Playwright against the live app, real e2e fixture logins) — "before" images are the originals at `docs/assets/visual-review-2026-08-05/`, "after" images are new captures at `docs/assets/visual-review-2026-08-06-after/`, for exactly the screens this phase changed (not re-shooting the whole platform, since most of it is unchanged):

| Screen | Before | After | Confirms |
|---|---|---|---|
| Homepage, tablet (820px) | `visual-review-2026-08-05/05-landing-tablet-full.png` | `visual-review-2026-08-06-after/05-landing-tablet-full.png` | Header now collapses to a hamburger instead of overflowing |
| Student Dashboard | `visual-review-2026-08-05/07-student-dashboard-desktop.png` | `visual-review-2026-08-06-after/07-student-dashboard-desktop.png` | Header shows the real user menu + notification bell instead of Login/Create Account |
| Instructor Dashboard | `visual-review-2026-08-05/21-instructor-dashboard-desktop.png` | `visual-review-2026-08-06-after/21-instructor-dashboard-desktop.png` | Header fixed; course status now colored badges (grey/blue/green) instead of plain lowercase text |
| Orders | `visual-review-2026-08-05/19-orders-desktop.png` | `visual-review-2026-08-06-after/19-orders-desktop.png` | Header fixed; order status now a colored amber badge instead of plain text |
| Admin Users | `visual-review-2026-08-05/13-admin-users-desktop.png` | `visual-review-2026-08-06-after/13-admin-users-desktop.png` | Header fixed; status badges added; the one real test-data-tagged account now shows a "Test data" chip |

One real, incidental confirmation surfaced while capturing these: the backend's login rate limiter (10 requests/15 min per the `AuthController`'s `@Throttle` on `/auth/login`) correctly triggered `429`s partway through repeated capture attempts, and correctly cleared after a backend restart — the rate limiter itself works as designed, encountered here only because of the unusually high number of scripted logins in a short window, not a defect.

## Architecture Review

- No new architectural surface introduced — `components/ui/` is a new directory but follows the same co-location convention already used by `components/admin/`.
- `SafeUser` type change is additive and non-breaking — every existing consumer of the type is unaffected; only code that explicitly wants `isTestData` needs to read it, and only one page does.
- `useNotificationsList`'s new `options` parameter is additive and defaults to prior behavior — no existing caller needed changes.
- No duplicated component logic was introduced: StatusBadge and EmptyState are each defined once and imported everywhere they're used, per the addendum's explicit instruction.

## Remaining Risks

Everything carried over from `docs/restore-point-phase14.4.md`/`docs/known-issues.md` is unaffected by this phase (MFA opt-in-not-mandatory, no CI remote verification, Notifications/Search unimplemented, no email provider, Docker/WSL2 unusable locally, no malware scanning, the dual — now triple — phase-numbering issue). New, real items this phase adds to the backlog:

1. The 12-section brief is ~20% complete by section count (Header done, Status System's Critical/High portion done, Design Tokens infrastructure exists, one EmptyState rollout) — the remaining ~80% (Forms, full Dashboard polish, Tables, Loading/Skeletons, full Responsive/Accessibility passes, Animations, the token retrofit) is real, scoped, tracked work, not abandoned.
2. `EmptyState` is built but only applied to 2 of ~6 pages using the old inline pattern — Checkout/Notifications/Media Manager/Course Catalog still use the pre-existing inline markup (visually identical, just not using the shared component yet).
3. The `getCurrentAuthUser()` `email: ''` behavior (root cause of finding #4 above) is now worked around in the header, but any other current or future code that reads `user.email` directly (rather than `profile.email`) will have the same latent bug — worth a repo-wide grep before the next auth-related UI change, not done as part of this phase's scoped fix.

## Safe Resume Point

Per the phase's closing instruction, **wait for approval before generating Phase 14.8.** If/when approved, the highest-value next slice (by the same Critical/High lens this phase used) is: (a) roll `EmptyState` out to the remaining ~4 pages (mechanical, low risk), (b) apply the glass-card token treatment to the 7 form pages in §4 (the single largest remaining "does this belong to the same product" gap per the pixel audit), (c) a real Skeleton component for the list pages that currently show a bare "جارٍ التحميل..." text string.

## Restorability

**Recommended starting point:** `docs/documentation-index.md`, then `docs/project-status.md`'s Current Phase section, then this file.

**Guaranteed minimum fallback** — if only the following four files survive:

1. `docs/project-status.md` — current phase (14.7, partial) and exactly what was/wasn't done.
2. `docs/known-issues.md` — the corrected `/instructor/courses` finding and the deferred-scope items.
3. `docs/next-session.md` — the real next decision points for this thread vs. the Candidate D/E thread.
4. `docs/restore-point-phase14.7.md` (this file) — the authoritative snapshot of what changed, why, and what's left.
