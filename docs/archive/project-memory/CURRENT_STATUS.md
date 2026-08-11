# Current Status

## Purpose of This Document

## Last Updated

## Completed Sections

## In Progress

## Blocked

## Not Started

## Resume Point

### [2026-07-28] TASK-015 — Development Checkpoint

- **Summary:** Recorded exact stop point after Figma MCP hit its Starter-plan tool-call rate limit mid-way through building the Homepage v2 design in Figma.
- **Status:** Blocked

#### Current Completed Work

**React app (`Navigation.tsx`, `Footer.tsx`, `HomePageContent.tsx`, `globals.css`):**
- Header CSS fully fixed and matches the approved reference image (TASK-002).
- News section fully fixed — cards now render as a single horizontal row (TASK-003).
- Hero section image blending (chroma-keyed transparent PNGs) and AI-chip placeholder improved in earlier tasks, but **not pixel-perfect** — flagged as a known limitation pending a proper asset-generation tool.
- Feature Cards, Roadmap, Bottom Statistics, Footer sections in React are **still broken** per the TASK-001B/TASK-002 audits (missing/mismatched CSS classes) — not yet fixed.
- **Known discrepancy (not yet fixed in React):** the approved design has the brand/logo on the left and action buttons on the right; the current React header has this reversed (logo right, actions left). Discovered while building the Figma version; out of scope to fix under Figma-only tasks.

**Documentation scaffolding:**
- `DESIGN-IMPLEMENTATION-PLAN.md` (root) — Figma-to-React mapping plan.
- `docs/00-PROJECT-BIBLE.md` through `docs/07-CHANGELOG.md` — heading-only skeletons, not yet filled in.
- `design/` folder (`approved/`, `references/`, `exports/`, `icons/`, `images/`) + `design/README.md` — heading-only skeleton.
- `project-memory/` folder (this file and its siblings) + `MEMORY_RULES.md` (defines the update workflow).
- `PROJECT_ARCHITECTURE_AUDIT.md` (root) — full 13-section audit, inspection only.

**Figma (`fileKey`: `8JRgcGv892DYkuB29lpG5g`):**
- Confirmed the file originally contained only a flat reference screenshot, no real layers — since fixed.
- Pages reorganized: `Components`, `Homepage`, `Icons`, `Images`, `References`, `Archive` (all pre-existed; content moved into the right ones).
- Original flat reference screenshot moved to the **References** page (node id `2:2898`).
- Originally-empty unused frame moved to the **Archive** page (node id `3:2`).
- Top-level frame **"Homepage v2"** created on the Homepage page (node id `5:2`) as the real, editable rebuild — this is the target frame for all further work.
- Design system foundations created (file-global, already usable): 7 Paint Styles, 5 Text Styles, 3 Effect Styles (all under a `Phoenix/...` naming convention), plus a `Foundations` variable collection (id `VariableCollectionId:11:26`) with 8 spacing + 5 corner-radius variables.
- Reusable components created: `Nav Link` (`7:2`), `Button/Outline` (`7:4`), `Button/Gradient` (`7:6`).
- **Header** fully rebuilt inside `Homepage v2` (frame id `8:2`): real text layers, real Auto Layout, real vector SVG icons (search, moon — not emoji/image), component instances for nav links and buttons, styles bound to the new Text/Paint styles. Verified visually via screenshot — matches the approved reference (brand left, nav center, actions right).
- **Hero** partially rebuilt inside `Homepage v2` (frame id `13:11`):
  - Hero Text column (id `13:12`): heading (gradient fill, real 2-line text), subtitle, search bar, CTA buttons (both using the `Button/Outline` and `Button/Gradient` components) — done.
  - Hero Images area (id `13:26`): robot and phoenix illustrations uploaded as **real, separate Figma image assets** (not baked into a flat screenshot) via `upload_assets` — image hashes `af9396cb73e399ecc05982dc99248f4fe59097eb` (robot) and `ba48471c73d74dfedb8a6118ff20fa51a17bb691` (phoenix), both already placed and the temporary staging frames removed. AI chip box built as real vector/text. — done.
  - **Hero Stats panel — NOT started.** The `use_figma` call to create the `Stat Item` component and its 4 instances failed immediately on the Figma MCP rate limit, before any node was created (Figma scripts are atomic — a failed script makes zero changes). No cleanup needed; the file is in a clean state.

#### Current Blocked Work

Figma MCP (`claude.ai Figma` connector) hit its **Starter-plan tool-call limit** during TASK-011, mid-way through building the Hero Stats panel. No further `use_figma`, `upload_assets`, or other write/read Figma MCP calls can run until the limit resets or the plan is upgraded.

#### Next Immediate Task

Resume the Figma `Homepage v2` build, starting exactly where it stopped: create the `Stat Item` component and its 4 instances (Hero Stats panel), append to the Hero frame, then continue section by section: Categories/Cards, Statistics (bottom bar), CTA, Footer — per the full requirements in TASK-011.

#### Why It Is Blocked

Figma MCP tool-call rate limit reached on the connected account's Starter plan (see `claude.ai Figma` connector; unrelated to the earlier `figma` (local scope, unauthenticated) server, which was never used). This is an external quota, not a code or logic issue — nothing in the file or the approach needs to change, only time (limit reset) or a plan upgrade.

#### Exact Resume Instructions (for any assistant picking this up)

1. Confirm Figma MCP is connected and not rate-limited: run `mcp__claude_ai_Figma__whoami`. If it errors with a rate-limit message, stop and report — do not retry in a loop.
2. `fileKey` for all calls: `8JRgcGv892DYkuB29lpG5g`.
3. Before any `use_figma` call, load the `figma-use` skill guidance (see `NEXT_TASK.md` for the exact MCP resource URI).
4. Re-fetch current node state first (things may have IDs unchanged, but verify): `mcp__claude_ai_Figma__get_metadata` on `nodeId: "13:11"` (the Hero frame) to confirm `Hero Text` (`13:12`) and `Hero Images` (`13:26`) are still the only two children, and that no `Hero Stats` frame already exists.
5. Build the `Stat Item` component + `Hero Stats` panel (4 instances: 🤖 +200 "أداة ذكاء اصطناعي", 🎓 +150 "دورة تدريبية", 🗺️ +30 "مسار مهني", 👥 +10K "متعلم نشط") and append it as the **last** child of the Hero frame (`13:11`), so the visual order is Text → Images → Stats (matching the approved reference: text left, images center, stats right).
6. Validate with `mcp__claude_ai_Figma__get_screenshot` on `13:11` before moving to the next section.
7. Continue with Categories/Cards, Statistics (bottom), CTA, Footer — one section per `use_figma` call, validating after each, per the `figma-generate-design` skill's own "work section by section" rule.
8. After each completed section, append a new dated entry to `CURRENT_STATUS.md` and `NEXT_TASK.md` per `MEMORY_RULES.md` — do not wait until the whole Homepage v2 is finished to log progress.

### [2026-07-28] TASK-018 — Critical Workspace Route Fix (React implementation)

- **Summary:** First actual code implementation task in the routing workstream. Created `src/app/[lang]/workspace/page.tsx` per Fix 1 of `CRITICAL_ROUTE_FIX_PLAN.md`, fixing the live 404 on the hero CTA and nav link that both target `` `/${locale}/workspace` ``. Verified: new route returns 200 for both `ar` and `en`, invalid locale segment returns 404 (validation gate works), page body renders real content. Re-verified all pre-existing routes (homepage, non-locale `/workspace`, all four locale and non-locale duplicate routes) still return 200 and are unchanged. `npx tsc --noEmit` passes with no errors. Homepage and styling were explicitly not touched, per task scope. Fix 2 (redirecting `analytics`/`dashboard`/`files`/`projects` non-locale duplicates, per the same plan) was **not** implemented — out of scope for this task.
- **Status:** Completed

### [2026-07-29] TASK-013 — Homepage Component Extraction

- **Summary:** Extracted the 5 inline homepage sections identified in the earlier Component Mapping Report into their own files: `src/components/Hero.tsx`, `FeatureCards.tsx`, `News.tsx`, `Roadmap.tsx`, `BottomStatistics.tsx`. Each local data array (`FEATURES`, `NEWS_ITEMS`, `ROADMAP_ITEMS`, `BOTTOM_STATS`, and Hero's inline stats array) moved with its owning component. `News` and `Roadmap` each export only their inner content `<div>` — the shared `<section className="ph-sec"><div className="ph-wrap ph-dual">` wrapper stays in `HomePageContent.tsx`, preserving their existing DOM coupling exactly as it was (not resolved, just relocated correctly). `HomePageContent.tsx` now composes `<Hero locale={locale}/>`, `<FeatureCards/>`, `<News/>`+`<Roadmap/>` (inside the shared wrapper), `<BottomStatistics/>` — `Navigation` and `Footer` untouched. Verified pixel-identical: `npx tsc --noEmit` clean; rendered HTML element counts confirmed unchanged (6 feature cards, 3 news cards, 5 road cards, 5 bottom stats, 4 hero stats, 2 section titles); full-page screenshot visually identical to the pre-extraction state. No CSS, class names, spacing, or DOM structure changed.
- **Status:** Completed
