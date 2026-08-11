import { defineConfig, devices } from '@playwright/test';

// Phase 11.3 — browser automation configuration (base). Phase 11.4 adds
// `globalSetup` only, to provision the role-scoped fixture users/session
// storage the feature test suites depend on. Targets the already-running
// local dev server (apps/web on :3000, apps/api on :4000); does not
// start or manage either.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'html',
  globalSetup: require.resolve('./tests/e2e/setup/global-setup.ts'),
  // Phase 11.5: NOT using Playwright's `retries` here — verified against
  // apps/api's @nestjs/throttler storage (node_modules/@nestjs/throttler/
  // dist/throttler.service.js): once a client is blocked, `blockExpiresAt`
  // is fixed at block-time (block duration = ttl = 60s, unextended by
  // further requests) — but an immediate test-level retry still adds a
  // fresh request during that fixed window, and does nothing to reduce
  // the volume that caused it. loginAs (helpers/auth.ts) instead waits
  // out a full block cycle on 429, which is the correct fix for the
  // measured behavior.
  workers: 1,
  // A little above Playwright's 30s default — some real multi-step flows
  // in this suite (course creation + module/lesson add, Stripe Checkout
  // redirect) legitimately need more room than a single quick assertion.
  timeout: 45_000,

  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
