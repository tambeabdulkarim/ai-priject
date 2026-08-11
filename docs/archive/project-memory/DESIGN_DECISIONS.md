# Design Decisions

## Purpose of This Document

## Decision Log Format

## Visual Design Decisions

## Component Decisions

## Naming Decisions

## Reversed / Superseded Decisions

### [2026-07-29] TASK-013 — News/Roadmap Wrapper Ownership

- **Summary:** When extracting `News` and `Roadmap` into their own component files, decided to keep the shared `<section className="ph-sec"><div className="ph-wrap ph-dual">` wrapper in `HomePageContent.tsx` (the parent) rather than duplicating it into both new components or forcing one component to own it. Each of `News.tsx`/`Roadmap.tsx` exports only its own inner content `<div>`. Reason: the task required byte-identical rendering, and the two sections are currently genuinely coupled at the DOM level (one shared grid wrapper) — silently duplicating or arbitrarily assigning that wrapper to one child would have either broken the shared `ph-dual` grid layout or hidden the coupling instead of preserving it visibly. This decision is intentionally provisional: the Component Mapping Report already recommends un-coupling News and Roadmap before either is replaced from Figma, so this wrapper ownership is expected to change in a future task, not a final architectural choice.
- **Status:** Completed
