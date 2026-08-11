# Next Task

## Purpose of This Document

## Immediate Next Step

## Preconditions

## Acceptance Criteria

## Follow-Up Tasks

## Resume Point

### [2026-07-28] TASK-015 — Development Checkpoint

- **Summary:** Same checkpoint as recorded in `CURRENT_STATUS.md`; this entry gives the condensed, action-oriented version for immediately resuming work.
- **Status:** Blocked

#### Current Completed Work (condensed — full detail in `CURRENT_STATUS.md`)

React Header + News sections fixed. Documentation scaffolding (`docs/`, `design/`, `project-memory/`, `DESIGN-IMPLEMENTATION-PLAN.md`, `PROJECT_ARCHITECTURE_AUDIT.md`) in place. Figma `Homepage v2` (fileKey `8JRgcGv892DYkuB29lpG5g`, frame id `5:2`) has a real design system (Paint/Text/Effect styles + Foundations variables) and a fully rebuilt **Header** (`8:2`). **Hero** (`13:11`) is built except its Stats panel.

#### Current Blocked Work

Figma MCP Starter-plan tool-call limit reached while building the Hero Stats panel — the script failed before creating anything (atomic failure, file is clean).

#### Next Immediate Task

Create the `Stat Item` Figma component + 4 instances (Hero Stats panel: 🤖 +200 أداة ذكاء اصطناعي / 🎓 +150 دورة تدريبية / 🗺️ +30 مسار مهني / 👥 +10K متعلم نشط) and append as the last child of the Hero frame (`13:11`), then continue to Categories/Cards → Statistics (bottom) → CTA → Footer, one section per `use_figma` call with a screenshot validation after each.

#### Why It Is Blocked

External quota (Figma MCP Starter plan tool-call rate limit) — not a code, logic, or design issue. Requires the limit to reset or the plan to be upgraded before any further `use_figma`/`upload_assets` calls can run.

#### Exact Resume Instructions

1. Run `mcp__claude_ai_Figma__whoami` first to confirm the rate limit has cleared before attempting anything else.
2. Load the `figma-use` skill (and `figma-generate-design` if building a new section) via `ReadMcpResourceTool` on server `claude_ai_Figma`, URIs `skill://figma/figma-use/SKILL.md` and `skill://figma/figma-generate-design/SKILL.md`, before any `use_figma` call — both are mandatory prerequisites per the tool's own description.
3. `fileKey` is always `8JRgcGv892DYkuB29lpG5g`.
4. Re-verify current state with `get_metadata` on `nodeId: "13:11"` before writing, in case anything changed since this checkpoint.
5. Proceed with the Hero Stats panel, then work strictly one section at a time (Categories/Cards, Statistics, CTA, Footer), validating each with `get_screenshot` before moving on — do not attempt multiple sections in one script.
6. Log a new dated entry in both `CURRENT_STATUS.md` and this file after each section completes, per `MEMORY_RULES.md` — do not batch updates until the end.

### [2026-07-28] TASK-018 — Critical Workspace Route Fix (React implementation)

- **Summary:** `src/app/[lang]/workspace/page.tsx` created and verified (see `CURRENT_STATUS.md` and `KNOWN_ISSUES.md` for full detail). Fix 1 of `CRITICAL_ROUTE_FIX_PLAN.md` is done.
- **Status:** Completed

#### Immediate Next Step (routing workstream)

Fix 2 of `CRITICAL_ROUTE_FIX_PLAN.md`: replace the bodies of `src/app/analytics/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/files/page.tsx`, `src/app/projects/page.tsx` with `redirect('/${defaultLocale}/<route>')`, matching the existing pattern in `src/app/page.tsx`. Not yet started — was explicitly out of scope for TASK-018. This remains separate from (and does not block or get blocked by) the Figma `Homepage v2` workstream above, which is still paused on the Figma MCP rate limit.

### [2026-07-29] TASK-013 — Homepage Component Extraction

- **Summary:** Hero, FeatureCards, News, Roadmap, BottomStatistics extracted into their own component files under `src/components/`, rendering verified pixel-identical (see `CURRENT_STATUS.md` for full detail).
- **Status:** Completed

#### Immediate Next Step (component workstream)

None queued yet — extraction was preparatory work for a future Figma-driven section-by-section replacement (per the Component Mapping Report's recommended order: Header → Bottom Statistics → Footer → Feature Cards → Roadmap → News → Hero). No section has actually been replaced from Figma in React yet; that remains blocked on the Figma MCP quota (see the TASK-015 Resume Point above) and/or a seat upgrade (View → Dev/Full) per the rate-limit findings recorded this session.
