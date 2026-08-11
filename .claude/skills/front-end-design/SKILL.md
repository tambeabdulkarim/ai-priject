---
name: front-end-design
description: Use whenever creating, editing, or reviewing UI/frontend work for Phoenix Project — any component, page, layout, or visual polish task.
---

## Design system (do not deviate without explicit approval)
- Palette: purple → pink gradient (#9333ea → #ec4899) on a near-black background (#0a0714 range). Glassmorphism cards: semi-transparent background, backdrop-blur, thin translucent purple border, rounded corners.
- Arabic content throughout.

## Structural layout rule (critical — this caused a real bug before)
- The site's structural order is LTR (logo left, primary actions right, stats panels right) even though the text content is Arabic. This is NOT a fully mirrored RTL site.
- Never set dir="rtl" on the page/root to "fix" Arabic alignment — that mirrors the entire structural layout and breaks positioning (confirmed real bug, took many iterations to fix).
- Correct approach: keep structural containers (flex/grid order) in natural LTR document order. Apply RTL only to text alignment (text-align: right) and reading direction of Arabic text runs — never to element/component ordering.
- Before any RTL-related change, verify against the actual Figma frame — don't assume mirroring either way.

## Icons
- Always use real vector icons (SVG) from a consistent family (Lucide preferred, or Material Symbols). Never use emoji as icons in shipped UI — emoji rendering is inconsistent across OS/browsers and looked unprofessional in earlier iterations of this project.

## Source of truth
- Once Figma is the agreed source of truth for a section, implement from it directly (via Figma MCP tools) rather than from descriptions, screenshots, or memory of earlier versions. Conflicting sources (chat descriptions + screenshots + Figma simultaneously) previously caused repeated rebuilds and a structural bug — avoid by using one source per implementation pass.

## Visual quality bar
Target a premium SaaS feel comparable to Vercel, Linear, Stripe, Framer, OpenAI:
- Consistent spacing rhythm, padding, and border-radius across all cards/sections (no ad-hoc one-off values).
- Consistent shadow treatment.
- Equal heights/paddings/icon sizes across cards in the same row/grid.
- Illustrations (robot/phoenix hero art) should read as integrated into the page (soft ambient glow matching surrounding palette, no hard rectangular image edges) rather than pasted on top.

## Before finishing any frontend task
1. Confirm no structural element order changed unless explicitly intended.
2. Confirm no emoji icons remain.
3. Confirm spacing/radius/shadows are consistent with existing components, not new one-off values.
4. If the change is visual-only, confirm no architecture, routing, backend logic, or content changed.
