# Route Architecture Plan

**Date:** 2026-07-28
**Type:** Inspection only — no files were moved, deleted, or modified as part of this task.
**Method:** Direct `diff` of every duplicated route file pair, plus a repo-wide search for every internal link (`href`/`Link`) that targets these routes, to establish which tree is actually in use.

---

## 1. Which Route Tree Should Become the Canonical Architecture?

**The `src/app/[lang]/...` tree.** Evidence:

- Every internal link in the app's own UI (`Navigation.tsx`, `HomePageContent.tsx`) points exclusively to `/${locale}/...` paths — home, workspace, projects, analytics, files, dashboard are all linked through the locale prefix. Zero internal links point to the non-locale paths.
- `src/app/page.tsx` (the root, non-locale homepage) already defers to the locale tree itself — it does nothing but `redirect('/${defaultLocale}')`. The root of the non-locale tree has already conceded canonicality to the locale tree.
- `i18n.ts` declares two supported locales (`ar`, `en`) and `generateStaticParams()` in `[lang]/page.tsx` builds both — the locale tree is the one actually wired into the project's stated internationalization intent.

## 2. Which Tree Should Eventually Be Removed?

**The non-locale tree**: `src/app/analytics/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/files/page.tsx`, `src/app/projects/page.tsx`.

`src/app/workspace/page.tsx` is a **separate case** — see §5, it cannot simply be deleted; it needs a `[lang]` counterpart created first, because it is actively linked to a locale-prefixed URL that does not exist yet.

`src/app/page.tsx` should be **kept as-is** — it is not a duplicate, it's the correct redirect entry point and should remain the non-locale tree's only surviving member.

## 3. Which Files Are Different?

Direct `diff` of each pair:

| Route | Result |
|---|---|
| `analytics` | **Different.** Locale version adds `notFound`/`isLocale` import and a validation gate (`if (!isLocale(lang)) notFound();`) before rendering. Rendered output (`AnalyticsPanel` + `LocalStorageSync`, no props) is otherwise identical. |
| `dashboard` | **Different, and behaviorally significant.** Locale version adds the same validation gate, **and** actually threads the resolved `lang` into `<DashboardPageContent locale={lang as Locale} />`. The non-locale version hardcodes `locale={defaultLocale as Locale}` — meaning the non-locale `/dashboard` **always renders Arabic content regardless of anything**, while `/[lang]/dashboard` is the only one of the two that can ever render English. |
| `files` | **Different.** Same pattern as `analytics` — validation gate added, rendered output otherwise identical (`FilesPanel`, no props). |
| `projects` | **Different.** Same pattern as `analytics`/`files` — validation gate added, rendered output otherwise identical (`ProjectsBoard`, no props). |

**No file pair in this project is byte-identical.** Every non-locale route file is missing the `isLocale`/`notFound` validation gate that its locale counterpart has. This means the non-locale routes currently accept and render for any request regardless of a "locale" concept — they simply don't have one — while behaving otherwise the same as the locale tree at `ar` specifically (since none of `analytics`/`files`/`projects` actually branch their rendered content on locale either — see §4).

## 4. Which Files Are Identical?

**None are byte-identical**, but in **substance**, the *rendered output* of `analytics`, `files`, and `projects` is identical between the two trees for the `ar` case — neither version passes a `locale` prop to `AnalyticsPanel`, `LocalStorageSync`, `FilesPanel`, or `ProjectsBoard`, so those four components render exactly the same regardless of which route tree served the request. The only real-world difference for those three routes is that the locale tree 404s on an invalid `lang` segment and the non-locale tree cannot 404 that way (it has no segment to validate).

`dashboard` is the exception — its two versions are substantively different, not just gate-different (see §3).

## 5. Which Route Dependencies Exist?

- **Confirmed active, currently-broken dependency:** `Navigation.tsx` (line linking "أدوات الذكاء التدريبي") and `HomePageContent.tsx` (the primary hero CTA "ابدأ التعلم الآن") both link to `` `/${locale}/workspace` `` (e.g. `/ar/workspace`). **No `src/app/[lang]/workspace/page.tsx` exists.** Only the non-locale `src/app/workspace/page.tsx` exists. This means the app's own primary call-to-action button and a main nav link currently point at a URL that will **404** in the locale tree — this is a live bug, independent of and predating any cleanup work, and is the single most important dependency finding in this audit.
- `generateStaticParams()` in `[lang]/page.tsx` statically builds `ar` and `en` — but `HomePageContent.tsx` does not actually branch its copy on `locale` (it hardcodes Arabic text directly; it calls `getDictionary(locale)` but immediately discards the result — `const dict = getDictionary(locale); void dict; // dict available for future locale-aware copy`). So while the locale tree is structurally correct, the `en` locale currently renders Arabic content on the homepage regardless — a functional gap in the i18n system itself, separate from the route-duplication question but relevant to any migration plan since "canonical locale tree" does not yet mean "working English site."
- `src/lib/i18n.ts`'s `dictionaries` object contains content branded "أوبسيف" / "Opsive" (nav labels, hero copy, dashboard copy) — this does not match the Phoenix Project branding used everywhere else in this session's work, suggesting `i18n.ts`'s dictionary content is leftover from an earlier/different product iteration and is not actually the source of the current Phoenix homepage copy.
- No other component, hook, or lib file was found importing from or referencing the non-locale route files directly (routes are leaf pages, not imported elsewhere) — the non-locale tree's only "dependents" are whoever/whatever hits those URLs directly (external bookmarks, search-engine-indexed links, etc.), not internal code.

## 6. Migration Plan That Avoids Breaking the Project

A phased plan, ordered to never leave the app in a state where a currently-working link breaks:

### Phase 1 — Fix the live bug first (independent of the duplication cleanup)
Create `src/app/[lang]/workspace/page.tsx` (mirroring the existing non-locale `workspace/page.tsx`, with the same `isLocale`/`notFound` gate pattern used by the other three locale routes). This must happen **before** anything else in this plan, because two existing links in the live UI are currently broken and fixing that has nothing to do with which tree is "canonical" — it's a correctness fix either tree would need.

### Phase 2 — Reconcile the one behavioral difference
Before removing the non-locale `dashboard` route, confirm whether anything actually depends on its hardcoded-`ar` behavior (Phase 1's link audit found nothing internal that does). If nothing does, this is safe to proceed past; if something external is found to depend on it, that must be resolved first, not silently dropped.

### Phase 3 — Redirect, don't delete (transitional safety net)
Replace the body of each non-locale route (`analytics`, `dashboard`, `files`, `projects`) with a `redirect('/${defaultLocale}/<route>')`, the same pattern `src/app/page.tsx` already uses successfully. This preserves any external/bookmarked/indexed links to the old non-locale URLs (they keep working, just redirected) while eliminating the duplicate-implementation maintenance burden immediately. This is a **content change, not a file removal** — it satisfies "avoid breaking the project" without requiring the file-deletion step to happen at the same time or under time pressure.

### Phase 4 — Verify
With redirects in place, confirm (via the existing nav links and a manual pass over both `ar` and `en` variants) that every route in the app is reachable through the canonical `[lang]` tree, and that the redirects fire correctly for the four non-locale paths.

### Phase 5 — Remove (only after Phase 3 has been live and verified)
Once the redirect stubs have been in place and verified for a reasonable period, the non-locale `analytics/`, `dashboard/`, `files/`, `projects/` route folders can be deleted outright, since Next.js's own redirect (or a `next.config.js` redirects entry, as a further-simplified version of Phase 3) can take over that responsibility without needing a page file at all. This final step is explicitly **out of scope for this task** (no files are to be moved or deleted here) and is listed only to complete the plan.

### Explicit non-goals of this plan
- This plan does not address the `en` locale rendering Arabic content on the homepage (§5) — that is a content/i18n-wiring issue, not a routing-duplication issue, and should be tracked separately.
- This plan does not address the `Opsive`-branded dictionary content mismatch (§5) — flagged for awareness, not in scope for a route-architecture decision.
- No files were moved, deleted, or modified in the course of producing this plan, per instructions.
