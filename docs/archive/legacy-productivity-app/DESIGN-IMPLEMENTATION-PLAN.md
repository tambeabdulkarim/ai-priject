# Design Implementation Plan

**Status:** Direction update (TASK-DS-001). The approved Figma file is now the single source of truth for the homepage. The reference screenshot used in prior tasks (TASK-001 through TASK-003) is demoted to a temporary aid — no further pixel-matching against it. This document has no code in it; it only prepares the project to receive a Figma-based implementation.

**Why this document exists:** the current homepage (`ph-*` classes in `globals.css` + `Navigation.tsx` / `HomePageContent.tsx` / `Footer.tsx`) was built iteratively against a screenshot, and accumulated a specific, well-documented failure mode along the way: components were restyled/renamed over time and `globals.css` was never fully reconciled, leaving two parallel naming generations in one file (see the TASK-002 CSS Architecture Audit). Several sections rendered broken not because of wrong layout logic, but because a class used in JSX simply had no matching CSS rule, or an old rule with equal-or-higher specificity silently overrode a newer one. The rules below exist specifically to prevent that failure mode from recurring in the Figma-based rebuild.

---

## 1. How Components Should Map From Figma to React

- **One Figma top-level frame (section) → one React component.** The current homepage structure already reflects this boundary reasonably well (`Navigation`, `HomePageContent`, `Footer`) — keep sections as separate components rather than one monolithic page file, but split `HomePageContent` further per section (see §2) so each Figma frame has exactly one corresponding `.tsx` file.
- **One Figma component (in Figma's "Components" panel) → one React component**, not a copy-pasted block. If Figma defines a reusable card/button/badge as a Figma component with variants, it must become a single React component with props for those variants — never duplicated JSX per instance.
- **Figma Auto Layout → CSS Flexbox or Grid**, chosen by matching Figma's own setting: Auto Layout with a single direction and no wrapping → Flexbox; a genuine 2D arrangement (rows AND columns both meaningful) → Grid. Do not default to Flexbox for everything — several of the current bugs (Roadmap grid, Feature Cards grid) came from grids being approximated with the wrong track counts; matching Figma's actual constraint model avoids re-guessing.
- **Figma "Fill" / "Gap" / "Padding" values map 1:1** to CSS `gap` and `padding` — do not translate Auto Layout gap into individual margins on children. Margin-based spacing is exactly what caused the previous inconsistent spacing; Figma Auto Layout's gap model should be preserved as CSS `gap` wherever the layout is Flex/Grid.
- Every text layer's Figma style (family/size/weight/line-height/letter-spacing) becomes one entry in the typography scale (§5) — do not hand-tune font sizes per instance from "looks about right."

---

## 2. Recommended Component Hierarchy

```
src/components/homepage/
  HomePage.tsx                 (composition root — imports sections in order, no styling logic)
  Header/
    Header.tsx
    NavLinks.tsx
    HeaderActions.tsx          (search icon, lang switcher, theme toggle, auth buttons)
  Hero/
    Hero.tsx
    HeroCopy.tsx                (heading, subtitle, search bar, CTA buttons)
    HeroVisual.tsx               (robot/AI-chip/phoenix composition)
    HeroStats.tsx                 (4-stat side panel)
  FeatureCards/
    FeatureCardGrid.tsx
    FeatureCard.tsx               (single card, props-driven: icon, title, desc, badge?, link?)
  News/
    NewsSection.tsx
    NewsCard.tsx
  Roadmap/
    RoadmapSection.tsx
    RoadmapCard.tsx
  StatsBar/
    StatsBar.tsx
    StatItem.tsx
  Footer/
    Footer.tsx
    FooterColumn.tsx
    NewsletterForm.tsx
    SocialLinks.tsx
```

Rationale: the current single-file `HomePageContent.tsx` (~240 lines) mixes data arrays, layout, and markup for 5 unrelated sections. Splitting by Figma frame keeps each component's CSS scope small enough that a missing/orphaned class is easy to spot by inspection — the class-mismatch bugs found in TASK-001B/002 were much harder to catch because one 1100-line CSS file backed one 240-line component file with no structural correspondence between the two.

---

## 3. Naming Conventions for Components

- **React components:** PascalCase, named after the Figma frame/component name (translated to English if Figma layer names are Arabic-labeled), e.g. Figma frame "بطاقة الميزة" → `FeatureCard.tsx`.
- **CSS classes:** adopt **CSS Modules** (`ComponentName.module.css`) scoped per component, instead of continuing the global `ph-*` prefix convention in one shared `globals.css`. This is the single highest-leverage change available: a class-name mismatch becomes a **build-time/import error** (`styles.newsList` undefined) instead of a silent, invisible runtime failure — which is exactly the category of bug that cost the most time in TASK-001 through TASK-003.
  - If CSS Modules are not adopted for some reason, at minimum keep one CSS file per component (e.g. `Header.css` imported only by `Header.tsx`) so an orphaned rule/class has an obvious, small place to be found — never accumulate new sections into the single `globals.css`.
- **Data-test / QA hooks (optional but recommended):** `data-section="hero"`, `data-component="feature-card"` — independent of CSS class names, so QA/automation doesn't break when styling is refactored.
- Reserve `globals.css` strictly for: CSS custom properties (`:root` tokens), CSS resets, `body`/`html` base styles, and truly global utilities (e.g. `.rtl`/`.ltr` direction helpers). No component-specific visual rules belong there going forward.

---

## 4. Asset Organization (Images, Icons, SVGs)

Current state: `public/images/` holds 4 flat PNGs with a `-t` suffix convention (`phoenix-hero-robot.png` vs `phoenix-hero-robot-t.png` for the chroma-keyed transparent version) — functional but will not scale past a handful of files.

Recommended structure once Figma exports start arriving:

```
public/
  images/
    hero/
      robot.png
      phoenix.png
    news/
      (per-article thumbnails, if Figma specifies real imagery instead of icon placeholders)
    icons/
      (any icon not available as an inline SVG component — prefer SVG components below instead)
  ...
src/
  components/
    icons/
      SearchIcon.tsx
      MoonIcon.tsx
      ...              (SVG icons as React components, not emoji)
```

- **Icons:** the current implementation uses emoji (🔍, 🌙, 🤖, 🎓, 🗺️, 👥) as stand-ins. Figma will export real vector icons — these should become individual SVG-as-React-component files (`<SearchIcon className="..." />`), not emoji, and not raw `<img src="icon.svg">` tags (inline SVG allows `currentColor` theming, which emoji and `<img>` both block).
- **Export format from Figma:** SVG for icons and logos (scalable, themeable); PNG/WebP only for photographic or gradient-heavy illustrations (like the robot/phoenix artwork) that aren't practical as vectors. Export photographic assets at 2x for retina, with WebP as the primary format and PNG fallback only if Next.js Image optimization isn't handling format negotiation automatically.
- **Naming:** kebab-case, prefixed by section, no ambiguous suffixes like the current `-t`: `hero-robot.png`, `hero-robot-transparent.png` (spelled out) if both variants are genuinely needed, otherwise keep only the transparent final version and delete the opaque source once Figma supplies a proper cutout.
- **Transparency:** if Figma exports assets with real alpha transparency (it will, by default, for PNG/WebP exports of frames with transparent backgrounds), the chroma-key workaround built during TASK-001 (`chromakey.ps1`) becomes unnecessary — Figma-exported assets should never need post-processing to fake transparency.

---

## 5. Typography Mapping

Build a single typography scale as CSS custom properties, derived directly from Figma's text styles (not eyeballed):

```css
:root {
  --font-display: ...;      /* Figma "Heading" style family */
  --font-body: ...;         /* Figma "Body" style family */

  --text-hero-h1: ...;      /* size/weight/line-height from Figma's Hero H1 style */
  --text-section-title: ...;
  --text-card-title: ...;
  --text-body: ...;
  --text-caption: ...;
}
```

- Every text layer in Figma should be traceable to exactly one of these tokens — if a text layer doesn't match an existing style, that's a signal to either add a new token (if it's a deliberate new style) or flag it to design (if it's drift/inconsistency in the Figma file itself).
- Arabic + Latin pairing: confirm with the Figma file whether a single typeface covers both scripts adequately, or whether a Latin fallback stack is specified for English strings (nav "EN" label, brand name "Phoenix Project") — this was never explicitly addressed in the current CSS (`body` font-family is a generic system-font stack) and should be a first-class decision this time, not a default.
- Do not hardcode `font-size` values inside component-level CSS — always reference the token. This is what "same typography hierarchy" (as required in TASK-003) should mean structurally, not just visually.

---

## 6. Spacing System

Replace ad hoc `rem` values (currently: `0.4rem`, `0.5rem`, `0.6rem`, `0.75rem`, `0.8rem`, `0.9rem`, `1rem`, `1.2rem`... — an unconstrained continuous scale) with a fixed spacing scale derived from Figma's actual spacing values:

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
}
```

- Extract the real step values by sampling Figma's Auto Layout `gap`/padding across several frames — if Figma consistently uses an 8px base unit (common default), the scale above should be confirmed/adjusted to match exactly, not assumed.
- All `gap`, `padding`, and `margin` in the rebuilt components reference these tokens exclusively. A continuous ad hoc scale is how the current codebase ended up with subtly inconsistent spacing across sections that were supposed to look uniform (e.g. hero button gap vs. footer column gap vs. card internal padding all landed on different values with no shared reasoning).

---

## 7. Responsive Strategy

Not yet audited in this project (explicitly flagged as out-of-scope/pending in TASK-001B and TASK-003). For the Figma-based rebuild:

- **Confirm Figma provides explicit breakpoint frames** (commonly Desktop / Tablet / Mobile, or specific pixel widths like 1440 / 768 / 375). Implement to those exact breakpoints — do not invent intermediate ones speculatively.
- **Mobile-first CSS authoring**: base styles target the smallest Figma frame, with `min-width` media queries layering up to larger frames — this is the opposite of the current CSS, which is desktop-first with `max-width` overrides bolted on afterward (visible in the current `globals.css` `@media (max-width: 1400px/1200px/768px)` cascade). Mobile-first tends to produce fewer override conflicts, which directly addresses the specificity-collision bug class found in TASK-003 (the `.rtl .ph-news-card` override fight).
- Grid/Flex column counts per breakpoint should be read directly from each Figma frame's actual layout, not derived by guessing how a desktop grid "should" collapse (this guessing is exactly what produced the Feature Cards and Roadmap column-count bugs on desktop already — don't repeat that pattern going into responsive work).
- RTL: continue supporting `dir="rtl"`/`.rtl` as today, but test every breakpoint in both RTL and LTR — the current codebase has RTL-specific override rules (`.rtl .ph-dual`, `.rtl .ph-news-card`, `.rtl .ph-footer`, etc.) that exist alongside the base rules; per §3, these should live as logical-property CSS (`margin-inline-start`, `padding-inline-end`, etc.) where possible in the rebuild, to eliminate the entire category of "RTL override silently fights base rule" bugs at the source, rather than managing two parallel rule sets per component.

---

## 8. Rules for Implementing Figma Without Redesigning

1. **No creative substitution.** Where a Figma layer references an icon, illustration, or asset not yet exported/available, block on getting the real asset — do not substitute an emoji, a CSS-drawn approximation, or a "close enough" icon as a permanent implementation. (The current AI-chip / hero icon boxes are exactly this kind of temporary substitution, made under the old screenshot-only workflow — they should be replaced with real Figma-exported assets, not preserved as the target.)
2. **Match structure, not just pixels.** Reproduce Figma's actual Auto Layout direction, gap, and alignment settings — do not eyeball a visual match with different underlying values that happen to look similar at one viewport width (this is how several past bugs passed a casual glance while being structurally wrong).
3. **No new visual decisions.** Color, spacing, and type choices come only from Figma's defined styles/tokens (§5, §6) — never introduced ad hoc "because it looked better," even under time pressure.
4. **Flag Figma inconsistencies instead of silently resolving them.** If two Figma frames use visually-similar-but-not-identical spacing/color for what should be the same component, surface it as a question rather than picking one arbitrarily.
5. **Every component ships with its CSS in the same PR/commit** — no "add the JSX now, style it later" partial states. Every unstyled-component bug found in TASK-001B/002 originated from exactly this kind of split.
6. **A component is not "done" until verified against its specific Figma frame at each defined breakpoint** — not against the general homepage screenshot, and not at desktop width only.

---

## 9. Implementation Order

Mirrors top-to-bottom page position, so each finished section is immediately visible in context for review, and later sections can reuse tokens/components established by earlier ones (e.g. `Button`, `Badge`, `SectionHeading` primitives should exist by the time Feature Cards / News / Roadmap need them):

1. **Design tokens first** (§5 typography, §6 spacing, plus color tokens) — nothing below should start until these exist, since every subsequent step consumes them.
2. **Header** — smallest section, establishes the `Button`/icon-button/pill primitives reused later (lang switcher pattern, outline/gradient buttons).
3. **Hero** — establishes `SectionHeading`-adjacent patterns (large gradient heading) and the stats-card primitive reused by Bottom Statistics.
4. **Feature Cards** — reuses button/badge primitives from Header/Hero.
5. **News** — reuses card/badge primitives from Feature Cards.
6. **Roadmap** — reuses card primitives from News; introduces the progress-bar primitive.
7. **Bottom Statistics** — reuses the stat-item primitive established in Hero.
8. **Footer** — last, since it has the least reuse dependency on earlier sections and is the least visually critical on first paint.
9. **Responsive pass** — only after all sections exist at desktop width and are individually verified against their Figma frames.
10. **Cross-section QA pass** — full-page comparison against Figma at each breakpoint, RTL and LTR both.

No code has been written as part of this task. This document is planning only, per instructions.
