#!/usr/bin/env node
/**
 * Phoenix Platform — Launch Automation Orchestrator (Phase 21)
 *
 * Runs the sequence a deployment operator needs, in order, reusing
 * existing project scripts rather than reimplementing them:
 *   1. Build verification      → `npm run build` (root, Turbo — builds both apps)
 *   2. Environment validation  → checks required env vars are present (not their validity)
 *   3. Database validation     → `prisma validate` + `prisma migrate status` (apps/api)
 *   4. Health check            → GET {API_BASE_URL}/api/v1/health
 *   5. Smoke test execution    → scripts/production-smoke-test.js
 *   6. Final verification      → prints a PASS / PASS WITH WARNINGS / FAIL summary
 *
 * This script does not deploy anything. It only verifies local build
 * health and, if API_BASE_URL/WEB_BASE_URL point at a running instance,
 * that instance's health. Intended to be run:
 *   - locally, before pushing a release, with no BASE_URL overrides (checks steps 1-3 only in that case, steps 4-5 will simply target localhost)
 *   - immediately after a real deployment, with BASE_URL env vars pointing at production, to confirm the deploy succeeded
 *
 * Usage: node scripts/verify-deployment-readiness.js [--deep] [--skip-build]
 */

const { spawnSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const DEEP = args.includes('--deep');
const SKIP_BUILD = args.includes('--skip-build');
const ROOT = path.resolve(__dirname, '..');

const steps = [];

function run(label, command, cmdArgs, options = {}) {
  console.log(`\n=== ${label} ===`);
  console.log(`$ ${command} ${cmdArgs.join(' ')}`);
  const result = spawnSync(command, cmdArgs, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
    ...options,
  });
  const ok = result.status === 0;
  steps.push({ label, ok, status: result.status });
  if (!ok) {
    console.log(`\n❌ ${label} FAILED (exit code ${result.status}).`);
  } else {
    console.log(`\n✅ ${label} passed.`);
  }
  return ok;
}

function checkRequiredEnvVars() {
  console.log(`\n=== 2. Environment Validation ===`);
  // Presence only — never logs or evaluates the actual value.
  const required = [
    'DATABASE_URL',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'JWT_PRIVATE_KEY',
    'JWT_PUBLIC_KEY',
    'PASSWORD_PEPPER',
    'MFA_ENCRYPTION_KEY',
    'STORAGE_ENDPOINT',
    'STORAGE_BUCKET',
    'STORAGE_ACCESS_KEY_ID',
    'STORAGE_SECRET_ACCESS_KEY',
    'STRIPE_SECRET_KEY',
    'POSTMARK_API_KEY',
    'EMAIL_FROM_ADDRESS',
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length === 0) {
    console.log('✅ All required production environment variables are present in this shell.');
    steps.push({ label: 'Environment Validation', ok: true });
    return true;
  }
  console.log(`⚠️  Missing (not necessarily a problem if this is a local build-only run): ${missing.join(', ')}`);
  console.log('   See docs/production-secrets-checklist.md for what each variable is and where it comes from.');
  steps.push({ label: 'Environment Validation', ok: null }); // informational, not pass/fail
  return null;
}

async function main() {
  console.log('Phoenix Platform — Deployment Readiness Verification\n');

  if (!SKIP_BUILD) {
    run('1. Build Verification (frontend + backend)', 'npm', ['run', 'build']);
  } else {
    console.log('\n=== 1. Build Verification ===\nSkipped (--skip-build).');
    steps.push({ label: 'Build Verification', ok: null });
  }

  checkRequiredEnvVars();

  run('3a. Database Validation — schema', 'npm', ['run', '--workspace=apps/api', 'prisma:validate']);
  if (process.env.DATABASE_URL) {
    run('3b. Database Validation — migration status', 'npx', ['prisma', 'migrate', 'status'], {
      cwd: path.join(ROOT, 'apps', 'api'),
    });
  } else {
    console.log('\n=== 3b. Database Validation — migration status ===');
    console.log('Skipped — DATABASE_URL not set in this shell. Run this step directly against the production database before/after deploying.');
    steps.push({ label: 'Migration Status', ok: null });
  }

  run('4-5. Health Check + Smoke Test', 'node', [
    path.join('scripts', 'production-smoke-test.js'),
    ...(DEEP ? ['--deep'] : []),
  ]);

  console.log('\n=== 6. Final Summary ===');
  for (const s of steps) {
    const icon = s.ok === true ? '✅' : s.ok === false ? '❌' : 'ℹ️ ';
    console.log(`${icon} ${s.label}`);
  }
  const anyFail = steps.some((s) => s.ok === false);
  console.log(`\nOverall: ${anyFail ? 'FAIL — see failed step(s) above before deploying/confirming deployment.' : 'No hard failures in the steps that ran.'}`);
  console.log('Record this run in docs/production-verification-report-template.md.');
  process.exit(anyFail ? 1 : 0);
}

main();
