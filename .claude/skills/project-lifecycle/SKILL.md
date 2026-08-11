---
name: project-lifecycle
description: Mandatory workflow for every Phoenix Project phase. Automatically applied before and after every implementation phase.
---

# Project Lifecycle

## Purpose
This skill defines the mandatory lifecycle for every implementation phase.
Every phase must follow the same engineering process.
Implementation is never considered complete until every step below has been completed.

---

## Phase Workflow
Every phase must execute in this order:

1. Review current project state.
2. Review previous restore point.
3. Review architecture impact.
4. Implement the approved scope.
5. Run regression verification.
6. Perform engineering review.
7. Search for technical debt introduced by the phase.
8. Update required documentation.
9. Create a new restore point.
10. Produce the final engineering report.
11. Wait for approval before starting the next phase.

Never skip a step.

---

## Reporting
At the end of every phase always provide:
- Summary
- Files modified
- Verification results
- Regression status
- Remaining risks
- Engineering recommendation

Any claim of having evaluated, considered, or compared options (naming, architecture, alternatives, etc.) must be backed by showing the actual options and reasoning in the report — not just a statement that evaluation occurred. A summary without the underlying reasoning is treated as incomplete.

---

## Documentation
Before a phase is considered complete update every required project document.
Documentation is mandatory.

Never rewrite historical reports to match the current state.
Historical reports remain historical; only the current canonical documentation may be updated.

---

## Restore Points
Every completed phase must generate a new restore point.
Restore points are part of the project architecture.

---

## Phase Transition
Immediately after the final report, and only after the user explicitly approves moving to the next phase, generate the complete copy/paste command for the next phase.
Never generate or offer the next phase's command before that approval.
Always analyze the previous phase before generating the next command.
The next command must already include improvements learned from previous phases.

---

## Engineering Authority
Optimize continuously.
Improve future workflows whenever experience from previous phases suggests a better engineering process.
Never blindly repeat an old workflow if a stronger one now exists.

This authority applies to how phases are executed — it does not extend to silently modifying this skill file or the mandatory workflow itself. If experience suggests the lifecycle process defined here should change, propose the specific change and reasoning to the user for approval; do not self-apply it.
