# Restore Point — Phase 43 (Deployment Readiness & Staging Setup)

**Date:** 2026-08-12 · **Type:** Deployment infrastructure. Executed fully autonomously per this phase's own execution mode. **Result: backend made genuinely deployable in code; `staging` branch committed and pushed to GitHub; automatic frontend deployment attempted and failed on a real, diagnosed, non-code cause (missing `NEXT_PUBLIC_API_URL` for the Preview environment scope). No live Staging URL exists yet — blocked on two manual, secret-bearing Vercel dashboard actions no available tool can perform.**

## What this phase was

Not a content or audit phase — infrastructure. The goal was a real, externally reachable Staging/Beta URL. Also committed the entire accumulated session (Phases 25–42 plus this phase's own work — 427 files) to git for the first time since 2026-08-03, on a new non-production `staging` branch, leaving `master` untouched.

## What was built

1. `apps/api/src/create-app.ts` — shared Nest bootstrap (helmet, CORS, cookies, validation, prefix, interceptors) extracted from `main.ts` so both the traditional entrypoint and a new serverless one use identical logic.
2. `apps/api/src/main.ts` — refactored to just call `createApp()` + `app.listen()`.
3. `apps/api/api/index.ts` — new Vercel Node.js serverless entrypoint (cached warm Express instance wrapped by `ExpressAdapter`).
4. `apps/api/vercel.json` — routes all requests to the serverless entrypoint.
5. `apps/api/package.json` — added `express` as an explicit dependency (previously transitive only) and a `postinstall: prisma generate` script.

## What was verified

Database content (8 Learning Paths, 46 courses, 74 modules, 213 lessons, 49 quizzes, 245 questions, 33 projects, 23 certificates, 24 enrollments — all intact, none touched). Backend: tsc clean (including the new serverless file, via a temporary verification tsconfig since it lives outside the normal build's `include` scope), `nest build` clean, fresh isolated-port boot test returned a real 200, Jest 242/242, eslint clean. Frontend: tsc clean, eslint clean, local `next build` clean (all 60 routes). No `.env`/secret file staged or committed — verified before commit.

## What happened when deployment was attempted

Pushed `staging` to `origin`. Vercel's GitHub integration auto-triggered a Preview deployment against the existing, already git-linked "ai-priject" project. It failed at build time with `NEXT_PUBLIC_API_URL: Required` — the frontend's own deliberate fail-fast env validation (`apps/web/src/config/env.ts`), correctly catching that this variable is apparently scoped to Production only on this Vercel project, not Preview. Confirmed via a clean local build (with the local env already set) that this is a Vercel configuration gap, not a code defect.

## Why it stops here

Unblocking this requires two manual, secret-bearing actions in the Vercel dashboard that no available tool can perform:
1. Create a new Vercel project for `apps/api` (connect this repo, root directory `apps/api`), enter real secret env var values (names listed in `docs/phase43-deployment-readiness-report.md` §7), deploy it.
2. Set `NEXT_PUBLIC_API_URL` (→ that new backend's URL) and `NEXT_PUBLIC_SITE_URL` on the "ai-priject" project's Preview scope, then redeploy.

This matches this phase's own explicit stop condition: needing external login/secret input. Everything else in scope was completed autonomously.

## How to resume

Once the project owner completes the two steps above, push any new commit to `staging` (or use the dashboard's Redeploy) to trigger a fresh build, then continue directly with: Part 7 (16-item live smoke test), Part 8 (external-access check), Part 9 (live security check), Part 10 (partner-testing instructions for the Turkey-based tester). All of this is already scoped in `docs/phase43-deployment-readiness-report.md` and ready to execute the moment a real Staging URL exists. This is a continuation of Phase 43, not a new phase.
