import { type Page } from '@playwright/test';
import { FIXTURES, FIXTURE_PASSWORD } from '../setup/global-setup';

/**
 * Signs the given page in as a fixture role via the REAL login form —
 * see setup/global-setup.ts's header comment for why session/cookie
 * reuse (`storageState`) isn't used instead: the real `refresh_token`
 * cookie is `Secure`, and Chromium's storageState injection doesn't
 * grant plain http://localhost the same trust a live navigation gets, so
 * an injected Secure cookie is silently dropped. An organic login (real
 * network Set-Cookie response) always works. Called once per role per
 * worker by the worker-scoped fixtures in ../fixtures/roles.ts — not
 * once per spec — to minimize real login traffic; see that file's header
 * comment for the full reasoning.
 *
 * Phase 11.6: the shared dev backend's rate limiter (see app.module.ts,
 * unmodified — 120 req/60s, platform-wide, not auth-specific) can be
 * brushed against purely from cumulative request volume across a long
 * run. Retrying *inside* a single test/fixture (tried in Phase 11.5)
 * fights Playwright's own timeout model — a wait long enough to clear a
 * real 60s throttler block routinely exceeds the test's own timeout,
 * turning a recoverable wait into a spurious failure. The correct place
 * to wait out a block is between BATCHES (see run-batches.js), which has
 * no such timeout ceiling — so loginAs fails fast and clearly on 429
 * instead of masking it, and the batch orchestration is what actually
 * recovers.
 */
export async function loginAs(page: Page, key: string): Promise<void> {
  const fixture = FIXTURES.find((f) => f.key === key);
  if (!fixture) {
    throw new Error(`Unknown fixture role: ${key}`);
  }

  await page.goto('/en/login');
  await page.locator('#email').fill(fixture.email);
  await page.locator('#password').fill(FIXTURE_PASSWORD);

  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/auth/login') && r.request().method() === 'POST'),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);

  if (response.status() === 429) {
    throw new Error(`RATE_LIMITED: login for role "${key}" got 429 from the real backend`);
  }

  await page.waitForURL(/\/en\/dashboard/, { timeout: 15000 });
}
