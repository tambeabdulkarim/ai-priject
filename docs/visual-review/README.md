# Phoenix Platform — Visual Review Gallery (Phase 14.6C)

An interactive, visual-first review of the Phoenix platform, built entirely from the real browser screenshots captured in Phase 14.6B/14.6C. Read-only — no platform source, styles, or components were modified to build this.

## How to view it

Open [`index.html`](index.html) directly in a browser (double-click it, or drag it into a browser window). No build step, no server, no dependencies — everything is self-contained vanilla HTML/CSS/JS with zero external requests.

## What's here

- **`index.html`** — the review page: executive summary, 20 per-screen review sections, a Phoenix Design Language comparison table, a responsive (desktop/tablet/mobile) review, an image lightbox gallery, and a final management dashboard.
- **`styles.css`** — all styling for the page (dark theme, glass cards, sticky nav).
- **No `assets/` folder here.** Per the source instruction for this phase, screenshots are *reused in place*, not duplicated — every image is loaded directly from [`../assets/visual-review-2026-08-05/`](../assets/visual-review-2026-08-05/), the same 23 PNGs produced during the Phase 14.6B/C screenshot capture. Moving or renaming that folder will break the images here.

## Features

- **Sticky nav** with a live search box that filters the 20 screen sections by name.
- **Collapsible sections** — click any screen's header to expand/collapse it.
- **Lightbox gallery** — click any screenshot (in a screen section or the responsive review) to open it full-size; use the on-screen arrows, the keyboard (`←` `→` `Esc`), or click the backdrop to navigate/close.
- **Quick rating badges** (Design / UX / Consistency / Engineering / Accessibility / Responsive) per screen, color-coded green/amber/red.
- **Phoenix match %** per screen with a colored progress bar.
- **Phoenix Design Language comparison table** (Header, Hero, Buttons, Cards, Spacing, Typography, Colors, Gradients, Glass Effects, Shadows, Animations, Icons, Illustrations, Dashboard Style, Admin Style, Brand Consistency) with ✅/🟡/🔴 verdicts.
- **Final dashboard** with Critical/High/Medium/Low issue counts, Visual Completion %, Production Readiness %, and a ranked recommendation.

## Source of truth

Every rating, finding, and recommendation in this page is drawn directly from two prior read-only reports produced this session — nothing here was invented for presentation purposes:

- [`../platform-visual-review.md`](../platform-visual-review.md) — the original per-screen visual review.
- [`../platform-pixel-audit.md`](../platform-pixel-audit.md) — the follow-up pixel/consistency audit with numeric scores.

Where a viewport or content state genuinely wasn't captured (e.g. most interior screens were only shot at desktop width), the corresponding rating is shown as `N/A` rather than estimated.

## Screens covered

Homepage, Login, Register, Student Dashboard, Instructor Dashboard, Instructor Courses (404), Media Manager, Moderator Queue, Admin Dashboard, Admin Users, Admin Audit Logs, Course Catalog, Course Details, Checkout, Profile, Settings, Certificates, Notifications, Orders, My Courses — 20 sections, using all 23 real screenshots (the 3 responsive-viewport shots of the homepage appear in the dedicated Responsive Review section instead of a screen section of their own).

**Note:** there is no distinct "Admin Courses" page in the codebase (confirmed by directory listing during the audit) — course management for admins, if it exists, is the same `/instructor/*` surface, so it isn't listed separately here.
