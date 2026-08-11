# Restore Point

**Version:** Phase 14.8 (Final Platform Polish Completion) — **substantial progress, not 100% of the 9-section brief**

**Status:** Forms glass-design, EmptyState rollout, and Loading/Skeleton primitives complete and verified. Tables confirmed already largely polished (a prior audit overstated their gaps). Dashboard unification, full responsive review, and full accessibility audit are partial — see "Remaining Visual Issues" below, each with its own disclosed reason, per this phase's explicit instruction not to silently defer anything.

**Date:** 2026-08-06

## Where This Phase Sits

Continues the visual-polish thread from `docs/restore-point-phase14.7.md` (14.6 → 14.6B → 14.6C → 14.7 → 14.8). Still a separate track from `docs/phase-14-plan.md`'s Candidate track (Candidate D — Notifications — remains next there, untouched by this phase).

## What Was Actually Done

### 1. Complete Glass Design (Forms) — done, all 7 pages

New CSS class `.ph-form-card` in `globals.css`, built entirely from Phase 14.7's design tokens (`--ph-surface`, `--ph-border`, `--ph-radius-lg`, `--ph-glass-blur`, `--ph-shadow-md`) — extends the existing `.ph-page-narrow`/`.ph-form` system rather than introducing a new layout, per the phase's explicit "don't create a new component if an existing one can be extended" instruction. Applied to:

- **Login** (`login/page.tsx`) — both the normal form and the MFA-challenge form.
- **Register** (`register/page.tsx`) — both the form and the post-submit success state.
- **Checkout** (`checkout/page.tsx`) — the populated-cart form (the empty-cart state already got `EmptyState` in Phase 14.7).
- **Profile** (`profile/page.tsx`) — split into two cards (account-info display, preferences form) instead of one long flat list, improving section separation.
- **Settings** (`settings/page.tsx`) — split into three cards (Change Password, Sessions, MFA) — directly implements the recommendation from `docs/platform-pixel-audit.md` ("Grouping the three sections into distinct cards would substantially improve scannability").
- **Forgot Password** (`forgot-password/page.tsx`) — form and success state.
- **Reset Password** (`reset-password/page.tsx`) — missing-token error, success, and form states all wrapped consistently.

Verified visually via real screenshots (see below) at desktop, tablet, and mobile for Login — the card scales down padding/radius at the `480px` breakpoint rather than overflowing.

### 2. Dashboard Completion — partial

Not attempted as a dedicated unification pass this phase (see Remaining Visual Issues #1). Loading-state work did touch the Instructor Dashboard (see §4 below), and Admin/Analytics got a `Spinner`.

### 3. Empty States — done, every remaining ad-hoc instance replaced

Found 13 more `<p className="ph-state">{t.empty}</p>`-style ad-hoc empty blocks beyond the 2 pages `EmptyState` already covered in Phase 14.7 (grepped for real `.length === 0` conditions, not just any `ph-state` usage, to avoid conflating loading/error text with actual empty states). All 13 replaced with the existing `EmptyState` component — **no new component created**, exactly as instructed:

Admin Users, Orders, News, Moderator Queue, Moderator Dashboard (audit-log section), Marketplace, Library, Instructor Media (Media Manager), Course Catalog, Admin Audit Logs, Notifications, Checkout (empty-cart — done in 14.7, confirmed still correct), and **Instructor Dashboard's own course list**, which had been missed by both this session's Phase 14.7 pass and its own earlier grep (its `(courses?.length ?? 0) === 0` condition used a different bracket style that the original search pattern didn't catch — found and fixed while doing the systematic sweep for this phase).

Every icon used is a `lucide-react` icon already-or-newly imported per page, matching context (e.g. `ShoppingCart` for Checkout, `History` for Audit Logs, `GraduationCap` for Courses). Checkout's `EmptyState` absorbed its pre-existing separate "browse marketplace" button into the component's `primaryAction` prop, removing one now-redundant `useRouter` import.

**No page on the platform still uses an ad-hoc empty layout** — verified by re-running the same grep pattern after all edits; zero remaining matches outside the component's own definition.

### 4. Loading States — new components built, applied to 7 pages

`components/ui/Loading.tsx` (new — genuinely didn't exist before, confirmed by search in Phase 14.7's own investigation) exports `Spinner`, `SkeletonCard`, `SkeletonGrid`, `SkeletonList`, `SkeletonTable` from **one file**, not four separate component files, since they share shimmer/spin mechanics and are always reached for together — again minimizing new-component surface per the phase's explicit instruction. CSS added to `globals.css` using Phase 14.7 tokens throughout (`--ph-surface`, `--ph-radius-*`). Both animations (`ph-spin`, `ph-shimmer`) are automatically disabled by the existing global `prefers-reduced-motion` rule.

Applied:
- `SkeletonGrid` → Instructor Dashboard, Orders, Admin Users, Course Catalog, My Courses (replacing "جارٍ التحميل..." text on grid-based list pages)
- `SkeletonTable` → Admin Audit Logs
- `Spinner` → Admin Analytics (a single-record overview panel, not a list — `SkeletonGrid`/`Table` don't fit its shape)

**Not applied everywhere a loading state exists** — see Remaining Visual Issues #2.

### 5. Tables — investigated; found mostly already done, one real correction to a prior audit claim

Re-read Orders, Admin Users, Admin Audit Logs, and Admin Analytics directly (not re-trusting the prior pixel audit's claims):

- **Orders** and **Admin Users** already had real search/status/role filters and cursor-based pagination before this phase — `docs/platform-pixel-audit.md`'s "no search/filter/pagination on list-heavy screens" finding was **inaccurate for these two**, confirmed by reading the actual code. No new filter/pagination work was needed; only the loading-state (Skeleton) and empty-state polish above applied.
- **Admin Audit Logs** already had real exact-match filters (actor/action/target-type/date range) and cursor pagination ("load more"). Now also has `SkeletonTable` and `EmptyState`.
- **Admin Analytics** is a single aggregate record for a date range, not a list — "search/filter/pagination/sticky headers" don't apply to it as a concept; it already has its one real filter (date range) and now has a `Spinner`.
- **"Sticky headers" — inapplicable platform-wide, not deferred.** This platform renders every list as a card grid (`.ph-grid` / `.ph-catalogue-card`), not an HTML `<table>`, anywhere in the codebase (verified: zero `<table>` elements found in `apps/web/src/app`). There is no table header row to make sticky. Implementing one would mean inventing a new table-based layout for these screens — a real redesign, explicitly out of this phase's "no redesign" scope — rather than "finishing" existing table polish.

### 9. Consistency Pass — performed as part of the above, not a separate exhaustive pass

Every page touched this phase now uses the same three building blocks (`.ph-form-card`, `EmptyState`, Skeleton/Spinner) with the same tokens, spacing, radius, and shadow — which is what makes them consistent with each other and with the homepage's glass language, rather than each page inventing its own treatment. A dedicated line-by-line comparison of every authenticated page's spacing/button/icon/shadow usage (as opposed to consistency arising from shared-component use) was not separately performed — see Remaining Visual Issues #5.

## Verification

- `npx tsc --noEmit` (apps/web) — clean, run after each batch of edits (forms, empty states, skeletons) as well as at the end.
- `npm run lint --workspace=apps/web` (`next lint`) — "No ESLint warnings or errors."
- `npm run build --workspace=apps/web` — succeeds, all 60 routes.
- `npm test --workspace=apps/api` — **201/201 passing**, unaffected (zero backend files touched this phase, confirming the "no backend/database/API work" constraint was honored).
- Zero business logic, API contract, database schema, or permission changes.

## Real Before/After Screenshots

"Before" = Phase 14.7's own after-screenshots (`docs/assets/visual-review-2026-08-06-after/`) or the original Phase 14.6B set (`docs/assets/visual-review-2026-08-05/`) for pages not touched since then. "After" = new captures this phase at `docs/assets/visual-review-2026-08-06-phase14.8/`, 15 real screenshots, Playwright against the live rebuilt app, real e2e fixture logins.

| Screen | Confirms |
|---|---|
| `01-login-desktop.png` | Real glass card now wraps the form — visibly distinct from the flat background in every prior screenshot |
| `05-login-tablet.png` / `06-login-mobile.png` | Glass card scales correctly at both breakpoints, no overflow; header still correctly collapsed (Phase 14.7's tablet fix holds) |
| `02-register-desktop.png`, `03-forgot-password-desktop.png` | Same glass treatment, consistent with Login |
| `07-profile-desktop.png` | Two distinct cards (info + preferences) instead of one flat list |
| `08-settings-desktop.png` / `09-settings-tablet.png` | Three distinct cards (Password/Sessions/MFA) at both widths — the exact fix the pixel audit recommended |
| `10-checkout-empty-desktop.png` | `EmptyState` component renders with icon circle, replacing the old bare text + separate button |
| `04-course-catalog-desktop.png`, `11-my-courses-desktop.png`, `12-instructor-dashboard-desktop.png`, `13-admin-users-desktop.png`, `14-admin-audit-logs-desktop.png`, `15-admin-analytics-desktop.png` | Confirm no regressions on the pages that received Skeleton/EmptyState changes — content renders correctly post-load |

**Not screenshotted this phase** (representative sample was captured, not exhaustively every one of the ~20 touched pages): Notifications, Marketplace, Library, News, Moderator Queue, Moderator Dashboard, Instructor Media, Admin Audit Logs' expanded-row state. All passed `tsc`/`lint`/`build` and use the same shared, already-verified components (`EmptyState`, `SkeletonGrid`/`Table`), so the risk of an unverified visual regression is low, but this is disclosed rather than implied to have been individually checked.

## Remaining Visual Issues (explicit, with reasons — none silently deferred)

1. **Dashboard Completion (§2) is incomplete.** Moderator and Admin dashboards did not get a dedicated stat-card/icon/spacing/section-header unification pass this phase. **Reason:** time budget went to Forms (§1, the single largest "same product as the homepage" gap per the pixel audit) and the platform-wide Empty/Loading rollout (§3/§4), which touch more pages and were judged higher-value. Real follow-up work, not abandoned.
2. **Loading States (§4) not applied everywhere.** Notifications, Library, Marketplace, News, Moderator Queue, Instructor Media, and course/library/marketplace detail pages still show plain "جارٍ التحميل..." text. **Reason:** `Loading.tsx`'s components exist and are proven on 7 pages; rolling out to the remaining ones is mechanical (same 2-line swap pattern used throughout this phase) but was not exhaustively done to keep this phase's diff reviewable.
3. **Full Responsive Completion (§6) not performed.** Only Login and Settings were checked at tablet/mobile width this phase (plus the Homepage/tablet fix already verified in Phase 14.7). **Reason:** a genuine full review of every page at 3 viewports (~60 routes × 3) is a multi-session effort on its own; the pages most likely to have new responsive issues (the newly-carded forms) were the ones actually checked, and both passed cleanly.
4. **Full Accessibility audit (§7) not performed.** Only a spot-check was done: confirmed no `label`/`htmlFor`/`id` pairing was disturbed by the card-wrapping edits (none of those attributes were touched, only wrapper `<div>`s added), confirmed new components carry correct semantics (`Spinner` has `role="status"`/`aria-label`; skeletons are `aria-hidden`), and confirmed the existing global `:focus-visible` rule still applies (untouched). **Not done:** a real contrast-ratio audit, systematic keyboard-navigation walkthrough, or ARIA review of pre-existing pages. **Reason:** a genuine accessibility audit is its own specialized pass with its own tooling (axe, manual screen-reader testing) — asserting one was "verified" without actually running it would be a fabricated claim, which this phase's engineering standards explicitly rule out.
5. **Consistency Pass (§9) is implicit, not a documented line-by-line review.** Every page this phase touched now shares the same building blocks, which produces real consistency — but no separate audit compared, say, icon sizes or shadow depths across every one of the ~60 authenticated routes, including the ~40 this phase didn't touch. **Reason:** the ~1850 pre-existing lines of `globals.css` still contain hardcoded values outside the token system (flagged, unresolved, in `docs/restore-point-phase14.7.md` too) — a true platform-wide consistency pass depends on that retrofit happening first, or it will keep finding the same root cause repeatedly.
6. **Motion (§8) is minimal, not comprehensive.** Added: card hover elevation (`.ph-catalogue-card`, using `--ph-shadow-sm`), the header dropdown's existing fade-in (from Phase 14.7), and the new form-card's `focus-within` border transition. **Not done:** any modal/dialog transition (the platform has no modals/dialogs anywhere in the codebase, confirmed by search — nothing to animate), page-transition animation between routes (Next.js App Router has no built-in mechanism for this without additional routing infrastructure — judged out of scope for "subtle polish only, no redesign"), and a dedicated audit of the mobile drawer's existing slide/backdrop behavior (present since before this phase, not modified, not re-verified).
7. **`globals.css`'s ~1850 pre-existing lines still use hardcoded hex/px** rather than the design tokens — unchanged from the Phase 14.7 disclosure, still true.
8. **`/instructor/courses` remains a non-route** (Phase 14.7's correction stands — never a real page, not something to "finish").

## Files Modified

**New:**
- `apps/web/src/components/ui/Loading.tsx`

**CSS:**
- `apps/web/src/app/globals.css` — `.ph-form-card`, Spinner/Skeleton classes, `.ph-catalogue-card` hover elevation.

**Forms (glass-card):**
- `login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`, `reset-password/page.tsx`, `checkout/page.tsx`, `profile/page.tsx`, `settings/page.tsx`

**Empty states:**
- `admin/users/page.tsx`, `orders/page.tsx`, `news/page.tsx`, `moderator/queue/page.tsx`, `moderator/page.tsx`, `marketplace/page.tsx`, `library/page.tsx`, `instructor/media/page.tsx`, `courses/page.tsx`, `admin/audit-logs/page.tsx`, `notifications/page.tsx`, `instructor/page.tsx` (some of these files overlap with the Loading-state list below)

**Loading states:**
- `instructor/page.tsx`, `orders/page.tsx`, `admin/users/page.tsx`, `admin/audit-logs/page.tsx`, `courses/page.tsx`, `my-courses/page.tsx`, `admin/analytics/page.tsx`

## Architecture Review

- No new architectural surface — `Loading.tsx` follows the same `components/ui/` co-location convention `StatusBadge.tsx`/`EmptyState.tsx` established in Phase 14.7.
- Zero new components were created where an existing one could be extended — `EmptyState` was reused verbatim across 13 pages; `.ph-form-card` extends the existing `.ph-page-narrow`/`.ph-form` system rather than introducing a competing layout primitive.
- All new CSS derives from Phase 14.7's token set — no new hardcoded colors, radii, or shadows were introduced anywhere in this phase's changes.

## Remaining Risks

Everything from `docs/restore-point-phase14.7.md`'s Remaining Risks is unaffected and still open (MFA opt-in, CI not remote-verified, Notifications/Search unimplemented, no email provider, Docker/WSL2, no malware scanning, the phase-numbering issue). New from this phase: the 8 items in "Remaining Visual Issues" above are the concrete backlog for whatever comes after this phase.

## Safe Resume Point

Per the phase's closing instruction, **wait for approval before Phase 15.** If/when approved, the highest-value next slice by the same reasoning this phase and Phase 14.7 used: (a) roll `Spinner`/`Skeleton` out to the remaining list/detail pages (mechanical), (b) the Moderator/Admin dashboard stat-card unification pass, (c) a real, tool-assisted accessibility audit rather than a spot-check.

## Restorability

**Recommended starting point:** `docs/documentation-index.md`, then `docs/project-status.md`'s Current Phase section, then this file.

**Guaranteed minimum fallback:**
1. `docs/project-status.md` — current phase (14.8) and what was/wasn't done.
2. `docs/known-issues.md` — newly resolved items and the still-open polish backlog.
3. `docs/next-session.md` — the real next decision points.
4. `docs/restore-point-phase14.8.md` (this file).
