# Documentation Policy

**Status: Permanent, binding policy, effective 2026-08-04 (Phase 12B).** Applies to every phase of work on this project from this point forward, regardless of what part of the project the phase touches (backend, frontend, tests, infrastructure, or documentation itself).

## Purpose

Every completed phase must be recoverable from documentation alone, with no dependency on conversation history. This policy exists to make that guarantee durable rather than incidental.

## At the end of every future phase

1. **Update `docs/project-status.md`.** Reflect the new current phase, what was completed, and current results. Do not leave it describing a superseded phase.
2. **Update `docs/known-issues.md`.** Add anything newly discovered; remove anything resolved (move the resolution detail into the relevant historical report or restore point, not into known-issues.md itself — known-issues.md lists only what's still open).
3. **Update `docs/next-session.md`.** State what the next session should read first and what decision, if any, is pending. If nothing is pending, say so explicitly rather than leaving stale instructions in place.
4. **Create a new restore point: `docs/restore-point-phaseXX.md`.** Do not overwrite the previous restore point — each phase gets its own, and the previous one is marked superseded (with a one-line pointer to the new one) but left in place until archived (see Rule 7).
5. **Update `docs/documentation-index.md`.** Add links to any new canonical or historical document created. Update the "current restore point" pointer. Update the numbered-doc-series status table if any scaffold was authored.
6. **Never overwrite historical reports.** A dated report (a bugfix writeup, a review report, a verification report, a closure report) describes what was true when it was written. If new information changes the picture, write a new report or an addendum section referencing the old one — do not edit history to make it retroactively "correct."
7. **Archive only when obsolete.** A document moves to `docs/archive/` only when it describes a superseded product, a superseded restore point, or a workstream confirmed abandoned — never as a routine end-of-phase step. When archiving, always state in the index what superseded it.
8. **Never delete documentation.** Not even obviously wrong or superseded content. Archive it. Deletion destroys the audit trail this whole policy exists to protect.
9. **Every completed phase must be recoverable from documentation alone.** Before closing any phase, verify this directly: read `project-status.md` → `known-issues.md` → `next-session.md` → the latest restore point, cold, as if starting a new session with no memory of the work. If that reading leaves a real question unanswered, the phase is not done — fix the documentation, not just the code.

## Non-negotiable constraints (apply to every phase, not just documentation phases)

- Documentation updates described above are **required**, not optional, at the end of every phase — including phases whose primary work was code, not docs.
- A phase that changes code but skips its documentation update is incomplete, regardless of whether the code itself works.
- The four-file guaranteed-minimum restore set (`project-status.md`, `known-issues.md`, `next-session.md`, latest `restore-point-phaseXX.md`) must never grow beyond four files and must never depend on any other document to be individually meaningful. Richer navigation belongs in `documentation-index.md`, layered on top — never folded into the minimum set itself.

## What this policy does not cover

- This policy governs process, not content authoring. It does not require every numbered architecture doc to be filled in — that's separately-scoped work, tracked as a known gap (see `documentation-health-report.md`).
- This policy does not grant authority to modify application code as part of a "documentation update." Documentation-only phases stay documentation-only; code-touching phases update docs as their final step, not their only step.
