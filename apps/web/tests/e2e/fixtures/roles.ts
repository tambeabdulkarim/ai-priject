import { test as base, type Page } from '@playwright/test';
import { loginAs } from '../helpers/auth';

// Phase 11.6 — the true replacement for per-role `storageState` files.
// Re-verified (see storageState-diagnostic scripts run during this
// phase) that injecting the real `refresh_token` cookie via
// `browser.newContext({ storageState })` still silently drops it from
// outgoing requests: the cookie sits correctly in the injected jar
// (matching domain/path/secure/sameSite), but Chromium withholds a
// CDP-injected `Secure` cookie from a plain http://localhost request —
// confirmed by reading the raw Cookie header Chromium actually sent
// (empty) on a live /auth/refresh call, not just by observing the
// resulting redirect. This is a Chromium cookie-injection limitation,
// not an app bug — the cookie's Secure flag is correct, real backend
// behavior, and an organic (live Set-Cookie) login is unaffected.
//
// The correct equivalent — one real login per role, reused everywhere,
// with zero per-spec-file duplication — is a *worker-scoped* fixture:
// each role logs in via the real UI exactly once per worker (with
// `workers: 1` in playwright.config.ts, that's once per role for the
// entire suite run) and every spec that needs that role reuses the same
// live, already-authenticated page. This achieves the same goal
// (minimize real login/refresh traffic) through the one mechanism that
// actually works against this app's real cookie security posture.
type RoleFixtures = {
  learnerPage: Page;
  instructorPage: Page;
  moderatorPage: Page;
  adminPage: Page;
  superadminPage: Page;
};

async function loginAndUse(
  browser: import('@playwright/test').Browser,
  key: string,
  use: (page: Page) => Promise<void>,
) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await loginAs(page, key);
  await use(page);
  await context.close();
}

export const test = base.extend<object, RoleFixtures>({
  learnerPage: [
    async ({ browser }, use) => {
      await loginAndUse(browser, 'learner', use);
    },
    { scope: 'worker' },
  ],
  instructorPage: [
    async ({ browser }, use) => {
      await loginAndUse(browser, 'instructor', use);
    },
    { scope: 'worker' },
  ],
  moderatorPage: [
    async ({ browser }, use) => {
      await loginAndUse(browser, 'moderator', use);
    },
    { scope: 'worker' },
  ],
  adminPage: [
    async ({ browser }, use) => {
      await loginAndUse(browser, 'admin', use);
    },
    { scope: 'worker' },
  ],
  superadminPage: [
    async ({ browser }, use) => {
      await loginAndUse(browser, 'superadmin', use);
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
