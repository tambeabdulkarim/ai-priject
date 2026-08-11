# Restore Point

**Version:** Phase 19 (Production Deployment Execution — Phoenix v1.0 Launch)

**Status:** Complete, as an **Execution Readiness simulation** — real production deployment could not be executed, per this phase's own addendum, because it requires external accounts/credentials/decisions this session does not have and cannot fabricate (hosting provider, domain, DNS, Postmark). **Final Decision: 🟡 LAUNCH POSTPONED.**

**Date:** 2026-08-06

## What This Phase Was

The eighth thread in this project's session history. Phase 18 confirmed Phoenix v1.0's core development is complete and gave a 🟡 GO WITH CONDITIONS verdict. This phase attempted to actually execute the production deployment those conditions point toward — and, exactly as its own addendum anticipated, hit a hard wall at every step requiring an external account: no Vercel/Railway/Render/Fly.io/Azure/AWS account, no domain, no DNS access, no Postmark account. Per the addendum's explicit instruction, this was treated as an accurate readiness simulation rather than either faking a launch or silently stopping — the full report, **`docs/phase19-execution-readiness-report.md`**, documents exactly how far automation could go and precisely what the owner needs to do next, in priority order.

## What Was Actually Done (real, not simulated)

1. **Deleted `apps/web/vercel.json`** — confirmed stale and actively wrong in Phase 18 (leftover project name, legacy Vercel v2 config syntax that would interfere with a real deploy). This was a genuine "deployment requires it" fix, explicitly permitted by this phase's scope, and was done **only after asking the user to confirm** (the deletion was blocked by the permission classifier as a destructive action; the user confirmed the exact target path before it was retried and completed).
2. **Final clean rebuild of both apps** (`rm -rf dist tsconfig.tsbuildinfo && npm run build` for `apps/api`; full `npm run build` for `apps/web`) — both succeed, confirming the `vercel.json` removal introduced no regression (modern Next.js needs no `vercel.json` for standard zero-config deployment).
3. **Full backend test suite re-run** — **209/209 passing**, unchanged.
4. **Lint/type-check re-run on both apps** — clean.

No other files were modified. No fake production data was created, no E2E fixtures were used to simulate a production smoke test, and no secrets were generated or displayed in this session — all per the phase's explicit addendum.

## What Could Not Be Done, and Why (the real content of this phase)

Documented exhaustively, section by section, in `docs/phase19-execution-readiness-report.md`:

- **No hosting deployment** — no account access to any of Vercel/Railway/Render/Fly.io/Azure/AWS.
- **No production database** — the current Neon instance is this session's development database (with real accumulated test data, per `docs/known-issues.md`) and must not silently become production; provisioning a genuinely separate one, or making an informed decision to reuse existing infrastructure, is the owner's call.
- **No production object storage bucket** — same reasoning as the database: this session holds working Backblaze B2 credentials and could technically provision a new bucket with them, but deliberately did not, since assuming this account is the intended production storage account would be presumptuous.
- **No email** — no Postmark account/API key/domain verification exists, explicitly named as a stop condition in this phase's own addendum.
- **No DNS** — no domain, explicitly named as a stop condition.
- **No monitoring** — no uptime/crash-reporting/APM account exists.
- **No real smoke test** — there is nothing deployed to smoke-test; running E2E fixtures against the dev environment and calling it a production smoke test would have been exactly the misleading substitution the addendum forbids.
- **Fresh production secrets were not generated**, even though the commands are mechanical and require no external account — a deliberate security-hygiene choice (production secrets shouldn't pass through an AI session transcript; the owner should generate them directly using the already-documented commands).

## Validation

- `npx tsc --noEmit` — clean, both apps.
- `npm run lint` — clean, both apps.
- Full clean rebuild — both apps, clean, all 60 frontend routes.
- `npm test --workspace=apps/api` — **209/209 passing**, unaffected by the one file removal.

## Architecture Review

No architecture changes. The one change (`vercel.json` removal) is a deployment-configuration correction, not an architectural decision — it removes an actively wrong file rather than introducing a new one, consistent with the addendum's restriction against creating hosting-provider-specific config without justification (this is the opposite: removing unjustified, wrong config).

## Remaining Risks

Unchanged from Phase 18, since no new engineering work occurred: 27 unpatched dependency findings (1 Critical), no CD workflow, CI unverified on a real GitHub push, unbuilt async Notification email channel, no APM/crash reporting, the confirmed decorative dark-mode toggle, the deployment guide's monorepo-config documentation gap (still not edited into the guide itself — flagged again in this phase's own report instead). New from this phase: the full, precise Owner Action List (16 items, priority-ordered) in `docs/phase19-execution-readiness-report.md` is now the single most current statement of what stands between Phoenix and a real production launch.

## Safe Resume Point

Per the phase's closing instruction, **wait for approval before Phase 20.** This phase's Final Decision — **🟡 LAUNCH POSTPONED** — is not a step backward from Phase 18's 🟡 GO WITH CONDITIONS; it's the natural consequence of actually trying to execute those conditions and finding, as expected, that they require the project owner. **Phoenix v1.0's core development remains complete**, unaffected by this phase. The next real step is not more engineering — it's the Owner Action List.

## Restorability

**Recommended starting point:** `docs/documentation-index.md` → `docs/project-status.md`'s Current Phase section → `docs/phase19-execution-readiness-report.md` (the complete readiness report and Owner Action List) → this file.

**Guaranteed minimum fallback:**
1. `docs/phase19-execution-readiness-report.md` — the complete execution log across all 11 deployment-scope areas, infrastructure/URL/status summaries, the Final Decision, and the full priority-ordered Owner Action List.
2. `docs/project-status.md` — current phase and pointer to the report.
3. `docs/known-issues.md` — the `vercel.json` resolution folded into the existing structure.
4. `docs/next-session.md` — the real next decision points (all owner-facing).
