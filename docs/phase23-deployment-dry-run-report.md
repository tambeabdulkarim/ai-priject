# Phase 23 Deployment Dry Run Report

**Date:** 2026-08-06 · **Role assumed:** Senior DevOps Engineer, acting as a brand-new deployment operator with zero prior project knowledge, using `Phoenix-Deployment-Package/` as the ONLY reference (per this phase's explicit instruction). Nothing was deployed, no application code was touched, no credentials were generated or fabricated. Every finding below was produced by actually reading the package's documents in order and actually running the commands they specify — not inferred.

---

## 1. Executive Summary

The package's **content** is complete, accurate, and well-organized: every required category (launch guide, checklists, handover guide, smoke test, restore points, environment variables, service accounts, deployment order, rollback plan, final gate) is present, and every technical claim checked against the real system (script flags, env var names, health-endpoint behavior, test counts) matched reality exactly.

The package's **internal cross-references do not**. Every document that was copied verbatim from `docs/` into the package still points at `docs/...` and `scripts/...` paths that do not exist inside `Phoenix-Deployment-Package/` — because those files now live at different, package-relative paths (e.g. `docs/production-secrets-checklist.md` is actually at `06-Environment-Variables/production-secrets-checklist.md`). This affects **9 of the package's 10 operational documents** and **59 individual references**. A new operator following any one of these links literally, using only this package, will hit a dead path.

There is also one real structural ambiguity, not just a broken link: three documents instruct the operator to run `node scripts/production-smoke-test.js`, but that script's only copy inside the package is at `04-Smoke-Test/production-smoke-test.js` — no `scripts/` folder exists in the package. It is never stated whether the operator should run commands from inside a real clone of the repository (where `scripts/` genuinely exists at the root) or from inside the package folder itself. Both are plausible readings of "use this package as the only reference," and the package doesn't resolve the ambiguity.

None of this reflects missing engineering work, incorrect information, or an unsafe deployment plan — every underlying fact, command, and value is correct. The gap is entirely in how the copied documents' internal links were (not) adjusted when they were moved into the bundle.

## 2. Package Completeness (%)

**88%.**

- Content coverage: 100% — all 15 items from the original Phase 22 request are present and non-empty (Launch Guide, Production Checklist, Handover Guide, Smoke Test, Restore Points, Environment Variables Guide, Required Service Accounts, step-by-step deployment order, failure-handling guidance, post-success guidance, Rollback plan, Final Launch Checklist).
- Reference integrity: the deduction. 59 broken/unresolvable path references across 9 files, plus 1 structural (not just cosmetic) ambiguity about script execution location.

## 3. Missing Files

Referenced from inside the package, but not present anywhere in it (all are "see X for more context/rationale" references — none are required to complete a step, all are supplementary background):

| Referenced file | Referenced from | Severity |
|---|---|---|
| `docs/version-1.0-freeze.md` | `01-Launch-Guide/production-readme.md` | Low — context only ("the code is frozen"), not needed to execute any step |
| `docs/phase21-v1.1-roadmap.md` | `01-Launch-Guide/production-readme.md`, `02-Production-Checklist/deployment-checklist.md`, `02-Production-Checklist/production-checklist.md` | Low — explains *why* the Notifications worker is optional, not needed to follow the instruction itself |
| `docs/phase17-deployment-launch-guide.md` | `02-Production-Checklist/*.md`, `03-Handover-Guide/handover-guide.md` | Low — the hosting comparison behind the Vercel+Railway recommendation; only needed if reconsidering that choice |
| `docs/phase19-execution-readiness-report.md` | `02-Production-Checklist/deployment-checklist.md` | Low — historical origin of the checklist, not needed to use it |
| `docs/phase16-production-validation-report.md` | `04-Smoke-Test/production-verification-report-template.md` | Low — explains the Neon cold-start behavior referenced in the worked example |
| `docs/10-SECURITY-BIBLE.md` | `06-Environment-Variables/production-secrets-checklist.md` | Low — security rationale for the pepper/MFA key, not needed to generate or use them |

No file that is **required** to complete a deployment step is missing. Every command, every environment variable, every account requirement, and every checklist item has its actual content present somewhere in the package — the gap (Section 4) is that the *pointer* to it is sometimes wrong, not that the content itself is absent.

## 4. Broken References

**59 instances across 9 files** (README.md, `07-Required-Service-Accounts/required-service-accounts-summary.md`, and `09-Final-Launch-Checklist/final-checklist-before-launch.md` — the three documents newly authored for this package — have zero broken references; the problem is confined to files copied verbatim from `docs/`).

The most consequential, with their correct in-package location:

| Broken reference (as written) | Found in | Correct in-package path |
|---|---|---|
| `docs/production-secrets-checklist.md` | 5 files, incl. `01-Launch-Guide`, `03-Handover-Guide` | `06-Environment-Variables/production-secrets-checklist.md` |
| `docs/deployment-checklist.md` | 4 files | `02-Production-Checklist/deployment-checklist.md` |
| `docs/phase21-launch-preparation.md` | 6 files | `08-Deployment-Order-And-Rollback/phase21-launch-preparation.md` |
| `docs/production-readme.md` | `03-Handover-Guide/handover-guide.md` | `01-Launch-Guide/production-readme.md` |
| `docs/handover-guide.md` | `01-Launch-Guide/production-readme.md` (implicitly, via the accounts reference) | `03-Handover-Guide/handover-guide.md` |
| `docs/launch-package.md` | `01-Launch-Guide/production-readme.md`, `03-Handover-Guide/handover-guide.md` | `07-Required-Service-Accounts/launch-package.md` |
| `docs/production-verification-report-template.md` | `04-Smoke-Test/launch-automation-package.md` | `04-Smoke-Test/production-verification-report-template.md` (same folder — just needs the `docs/` prefix dropped) |
| `scripts/production-smoke-test.js` | `02-Production-Checklist/production-checklist.md`, `03-Handover-Guide/handover-guide.md`, `04-Smoke-Test/launch-automation-package.md`, `04-Smoke-Test/production-verification-report-template.md` | `04-Smoke-Test/production-smoke-test.js` — **and see the structural ambiguity below, this one is more than a path fix** |
| `scripts/verify-deployment-readiness.js` | `04-Smoke-Test/launch-automation-package.md` | `04-Smoke-Test/verify-deployment-readiness.js` |
| `apps/api/.env.example` | `08-Deployment-Order-And-Rollback/phase21-launch-preparation.md` | Not in the package at all (this is the original repo's dev-environment template, not a production one — the reference is describing where the key-generation *comment* originally lived; the actual commands are already duplicated into `06-Environment-Variables/.env.server.production.example`, so this specific reference is low-impact, but still literally unresolvable) |

**Structural ambiguity (not just a broken link):** `scripts/production-smoke-test.js` and `scripts/verify-deployment-readiness.js` are real, runnable Node scripts — copied into `04-Smoke-Test/` for reference, but written assuming they run from a real repository checkout (they call `npm run build`, `npm run --workspace=apps/api prisma:validate`, etc., which require the full monorepo, not just this package). **The package never states whether the operator is expected to (a) also have a full clone of the Phoenix repository and run these scripts from there, with the package purely as a reading guide, or (b) copy these two script files back into a repo checkout before running them, or (c) something else.** This is the one finding in this report that isn't a simple path fix — it needs an explicit instruction added.

## 5. Ambiguous Instructions

- **Script execution location** (Section 4, structural ambiguity) — the most significant ambiguity in the package.
- **Minor step-count divergence**: `01-Launch-Guide/production-readme.md` presents deployment as 13 discrete steps; `09-Final-Launch-Checklist/final-checklist-before-launch.md` presents 12 (folds "provision database" and "run migrations" into one step, and "provision Redis" isn't called out as its own step). The *relative order* is identical in both — secrets before backend, webhook only after backend is live, frontend before DNS, monitoring before smoke test — so this is not a contradiction, but a new operator diligently cross-checking the two lists against each other could reasonably pause and wonder if a step was dropped. Low severity, worth a one-line reconciliation note.
- Everything else read as clear and executable on first pass — variable names, account names, and command syntax were consistently unambiguous throughout.

## 6. Deployment Order Validation

**Consistent and correct across every document that states it** (`production-readme.md`, `deployment-checklist.md`, `phase21-launch-preparation.md` Section 4, `final-checklist-before-launch.md`): Database → Storage → Email (domain verification started early, correctly flagged as the long-pole item) → Secrets → Backend → Stripe webhook (correctly sequenced *after* the backend has a live URL, not before) → Workers (correctly marked skippable) → Frontend → DNS → Monitoring → Smoke Test → Rollback snapshot. No document contradicts this ordering. This is a real strength of the package — the sequencing logic (especially "don't register the Stripe webhook until the backend is actually live") is correct and consistently repeated everywhere it appears.

## 7. Rollback Validation

Complete. `02-Production-Checklist/deployment-checklist.md`'s Rollback Checklist and `08-Deployment-Order-And-Rollback/phase21-launch-preparation.md` Section 7 (Disaster Recovery Plan) together cover: general recovery steps, application rollback (redeploy previous artifact), database restore (Neon PITR), media/storage (provider versioning, disclosed as not independently backed up by this project), email failure (already fails safe, confirmed by code), payment failure (manual reconciliation against Stripe's own records), worker failure (not yet applicable), API and frontend failure (redeploy previous artifact). `09-Final-Launch-Checklist/final-checklist-before-launch.md` correctly summarizes "stop at the first failure, don't proceed" as the top-level rule. The only issue is the same as Section 4: the cross-references from the checklist to the detailed disaster-recovery plan use the wrong (`docs/`) path.

## 8. Operator Readiness

**Not yet at the literal bar the package's own README sets** ("without additional project knowledge... without asking a question"). A new operator would:
- Successfully understand the deployment order, required accounts, and required secrets — this content is genuinely self-contained and correct.
- **Hit a dead link** on the first attempt to open `docs/production-secrets-checklist.md` (or any of the other 58 broken references) and would need to search the folder by filename to recover — solvable, but exactly the kind of friction the package was built to eliminate.
- **Genuinely not know** whether to run the smoke-test scripts from inside the package or from a full repository clone, without asking someone — this one is a real question, not just an inconvenience.

## 9. Estimated Deployment Time

**Unchanged from the underlying documents' own estimate: 1–2 business days**, dominated by DNS propagation and account-creation overhead, not engineering work (confirmed consistent across `launch-package.md`, `phase21-launch-preparation.md`, and `handover-guide.md` — no contradiction found). This dry run does not change that estimate; the reference-path issues found here cost an operator minutes of friction per broken link, not hours.

## 10. Final Verdict

## **PASS WITH WARNINGS**

### Exact numbered action list

1. In every file under `01-Launch-Guide/`, `02-Production-Checklist/`, `03-Handover-Guide/`, `04-Smoke-Test/`, `06-Environment-Variables/`, `07-Required-Service-Accounts/`, and `08-Deployment-Order-And-Rollback/`, replace every `docs/<filename>.md` reference with the correct in-package relative path per the table in Section 4 (e.g. `docs/production-secrets-checklist.md` → `../06-Environment-Variables/production-secrets-checklist.md`, adjusted per each file's own folder depth).
2. Replace every `scripts/production-smoke-test.js` and `scripts/verify-deployment-readiness.js` reference with `04-Smoke-Test/production-smoke-test.js` / `04-Smoke-Test/verify-deployment-readiness.js` (or the correct relative path from each referencing file's own location).
3. Add one explicit paragraph — most naturally in `README.md`'s "Start Here" section and in `04-Smoke-Test/launch-automation-package.md` — stating whether the smoke-test scripts should be run from a full repository clone or copied elsewhere, resolving the structural ambiguity in Section 4. (Recommended answer, for whoever makes this call: state plainly that the operator needs a full clone of the Phoenix repository to execute the deployment — the package is the *reading/reference* bundle, not a replacement for the codebase — and that the two scripts inside `04-Smoke-Test/` are provided for convenient reading, with the real, run-from copies living at the repository's own `scripts/` folder.)
4. Fix the one dangling `apps/api/.env.example` reference in `08-Deployment-Order-And-Rollback/phase21-launch-preparation.md` — either drop it (the same generation commands already live in `06-Environment-Variables/.env.server.production.example`) or note explicitly that it refers to the original repository, not this package.
5. Optional, low priority: add a one-line note reconciling the 13-step vs. 12-step presentations in Section 5, e.g. a footnote in `final-checklist-before-launch.md` noting it's a condensed view of `production-readme.md`'s full 13 steps.
6. Re-run this dry run after the fixes above to confirm zero remaining broken references before treating the package as ready for a real external operator.

---

## Deliverables from this phase

Per this phase's explicit constraint ("Do NOT rewrite documents unless absolutely necessary"), none of the fixes above were applied — this report only documents what a fix pass would need to do. Standing docs updated: `docs/project-status.md`, `docs/known-issues.md`, `docs/next-session.md`, `docs/documentation-index.md`. Restore point: `docs/restore-point-phase23.md`.

**Stopped. Awaiting approval before Phase 24.**
