# Known Issues

## Purpose of This Document

## Open Issues

## Resolved Issues

## Workarounds in Place

## Risks

### [2026-07-28] TASK-018 — Critical Workspace Route Fix

- **Summary:** Resolved the live 404 bug documented in `ROUTE_ARCHITECTURE_PLAN.md` §5 and planned in `CRITICAL_ROUTE_FIX_PLAN.md` (Fix 1): created `src/app/[lang]/workspace/page.tsx`, mirroring the existing non-locale `src/app/workspace/page.tsx` with the same `isLocale`/`notFound` validation gate pattern already used by `[lang]/analytics`, `[lang]/files`, `[lang]/projects`. The hero CTA ("ابدأ التعلم الآن") and nav link ("أدوات الذكاء التدريبي") — both of which link to `` `/${locale}/workspace` `` — now resolve instead of 404ing. Verified via `curl` status codes: `/ar/workspace` → 200, `/en/workspace` → 200, invalid-locale `/xx/workspace` → 404 (gate working correctly), and confirmed page body renders real content (`workspace-grid`, `tasks-panel`), not an error page. Also re-verified every pre-existing route (`/`, `/ar`, `/workspace`, `/ar|en/{analytics,dashboard,files,projects}`, and the four non-locale duplicates) still returns 200, unchanged. Only Fix 1 from `CRITICAL_ROUTE_FIX_PLAN.md` was implemented — Fix 2 (redirecting the four duplicate non-locale routes) was explicitly out of scope for this task and was not touched.
- **Status:** Completed (Fix 1 only; Fix 2 remains open, see `NEXT_TASK.md`)

### [2026-07-29] TASK-013 — Homepage Component Extraction

- **Summary:** No new issues introduced. Extraction was verified pixel-identical (element counts + full-page screenshot comparison), no CSS/DOM/class-name changes made. One pre-existing coupling was preserved rather than resolved by design: `News` and `Roadmap` still share a single `<section className="ph-sec"><div className="ph-wrap ph-dual">` DOM wrapper (owned by `HomePageContent.tsx`, not either child component) — this was flagged in the earlier Component Mapping Report as needing to be un-coupled before either can be replaced from Figma independently; that un-coupling was explicitly out of scope for this task (which required identical rendering) and remains open.
- **Status:** Completed
