# Memory Rules

This document defines how `project-memory/` is kept up to date. It governs documentation only — it has no authority over and makes no changes to application code, React components, or CSS.

## 1. Scope

- Applies to every task carried out on this project from this point forward, regardless of which part of the project the task touches (React, CSS, Figma, docs, design assets, etc.).
- The rules below govern **only** the Markdown files inside `project-memory/`. They never authorize touching `src/`, `public/`, `design/`, or any other application code as a side effect of a documentation update.

## 2. Files Covered

| File | Updated when |
|---|---|
| `CURRENT_STATUS.md` | Every completed task, without exception. |
| `NEXT_TASK.md` | Every completed task, without exception — reflects what should logically happen next. |
| `KNOWN_ISSUES.md` | Every completed task, without exception — even if the update is confirming no new issues were found. |
| `DESIGN_DECISIONS.md` | Only when the task involved making an actual design/architecture decision (a choice between alternatives, a convention adopted, a direction changed). Skipped otherwise. |

`PROJECT_CONTEXT.md` and `ARCHITECTURE.md` are not part of the automatic per-task update — they change rarely and are updated manually when the project's fundamentals actually shift, not on every task.

## 3. Update Workflow (Run After Every Completed Task)

1. Identify the Task ID for the work just completed (e.g. `TASK-013`). If the work has no formal Task ID, use a short descriptive slug instead and note that it is informal.
2. Write one dated entry per applicable file from the table in §2.
3. Append the entry — do not edit, rewrite, or remove any existing entry in any of these files.
4. If a file does not yet have a running log section to append to, create that section on first use and keep using it going forward.

## 4. Required Entry Format

Every entry, in every file, must include exactly these four fields:

```
### [YYYY-MM-DD] TASK-ID — Short Title

- **Summary:** One or two sentences describing what was done or decided.
- **Status:** Completed | In Progress | Blocked | Superseded
```

- **Date:** the actual calendar date the task was completed, not the task's start date.
- **Task ID:** the identifier exactly as given (e.g. `TASK-013`). If informal, prefix with `INFORMAL-`.
- **Summary:** factual, describes what happened — not a plan, not a promise.
- **Status:** one of the four fixed values above; do not invent new status labels.

## 5. Append-Only Rule

- Previous entries are never deleted, reworded, or reordered.
- If information later turns out to be wrong or outdated, add a **new** entry that supersedes it (status `Superseded` on the old one is optional context, but the old entry's text itself stays untouched) — do not go back and silently edit history.
- Newest entries are added at the bottom of each file's log section, preserving chronological order.

## 6. What Counts as "a Completed Task"

A task is complete when the work described in its instructions has actually finished (or has been explicitly stopped/blocked with a clear reason) — not when a plan for it is written. A task that is still in progress at the end of a session gets a `CURRENT_STATUS.md` entry with status `In Progress` or `Blocked`, not `Completed`.

## 7. Non-Goals

- This file does not define coding standards, component standards, or design tokens — see `docs/` for those.
- This file does not grant permission to modify application code as part of a "memory update." Memory updates are Markdown-only, always.
