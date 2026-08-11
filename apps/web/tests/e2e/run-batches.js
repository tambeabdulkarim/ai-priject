#!/usr/bin/env node
/**
 * Phase 11.6 — batch-run strategy for the E2E suite.
 *
 * Runs the suite as a handful of separate `playwright test` invocations
 * instead of one single run, with a cooldown between each. This exists
 * purely to keep this harness's own request density under the shared
 * dev backend's real, unmodified rate limiter (apps/api's
 * @nestjs/throttler config, ttl 60s / limit 120, untouched) — it changes
 * nothing about how any individual test behaves.
 *
 * Each batch is one real `playwright test` process (own exit code, own
 * HTML report merged into the same report dir by Playwright). If a batch
 * exits non-zero, this script does not retry it inline — it waits out a
 * full throttler window (65s, matching the backend's 60s block duration
 * plus a safety margin) and moves on to the next batch, exactly as
 * specified: "continue from the next clean batch". The final summary
 * lists every batch's outcome so failures are still visible and none are
 * silently swallowed.
 */
const { spawnSync } = require('child_process');

// Measured directly against this backend (see Phase 11.6 report): two
// light batches (20 tests) ran with zero 429s, but by the third/fourth
// (course-creation and admin-dashboard heavy) batch, cumulative volume
// within the run crossed apps/api's real 120-req/60s ceiling — and a 20s
// gap wasn't enough for the window to fully drain before the next batch
// added more. A full 60s gap between every batch (not just failed ones)
// guarantees each batch starts against a genuinely fresh window.
// Measured directly against this backend: write-heavy batches
// (Instructor+Moderator's course/module/lesson creation, Admin's
// multi-widget dashboards) can approach apps/api's real 120-req/60s
// ceiling from their own volume alone, even when they don't themselves
// report a failure — leaving too little headroom for the very next
// batch. Every batch (not just ones that failed) gets the same
// generous 90s gap, so each one always starts against a genuinely
// drained window regardless of how much of the budget the previous one
// quietly used.
const COOLDOWN_MS = 90_000;
const RATE_LIMIT_COOLDOWN_MS = 90_000;

const BATCHES = [
  {
    name: 'Public + Auth',
    paths: ['tests/e2e/public', 'tests/e2e/auth', 'tests/e2e/smoke.spec.ts'],
  },
  { name: 'User', paths: ['tests/e2e/user'] },
  { name: 'Instructor + Moderator', paths: ['tests/e2e/instructor', 'tests/e2e/moderator'] },
  { name: 'Admin', paths: ['tests/e2e/admin'] },
  { name: 'Marketplace', paths: ['tests/e2e/marketplace'] },
  { name: 'AI', paths: ['tests/e2e/ai'] },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const results = [];

  for (let i = 0; i < BATCHES.length; i++) {
    const batch = BATCHES[i];
    console.log(`\n=== Batch ${i + 1}/${BATCHES.length}: ${batch.name} ===`);

    const res = spawnSync('npx', ['playwright', 'test', ...batch.paths, '--reporter=line'], {
      stdio: 'inherit',
      shell: true,
    });

    const passed = res.status === 0;
    results.push({ name: batch.name, passed, status: res.status });

    const isLast = i === BATCHES.length - 1;
    if (!isLast) {
      const cooldown = passed ? COOLDOWN_MS : RATE_LIMIT_COOLDOWN_MS;
      console.log(
        `\n--- Batch "${batch.name}" ${passed ? 'passed' : 'had failures'}. Cooling down ${cooldown / 1000}s before the next batch. ---`,
      );
      await sleep(cooldown);
    }
  }

  console.log('\n=== Batch Run Summary ===');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'}  ${r.name} (exit ${r.status})`);
  }

  const anyFailed = results.some((r) => !r.passed);
  process.exit(anyFailed ? 1 : 0);
}

main();
