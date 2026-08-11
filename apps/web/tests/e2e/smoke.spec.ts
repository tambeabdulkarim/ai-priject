import { test, expect } from '@playwright/test';

// Phase 11.3 — the one smoke test authorized for this phase: confirms
// the browser automation setup itself works against the running dev
// server. Not a functional/feature test.
test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator('body')).toBeVisible();

  await page.screenshot({ path: 'test-results/homepage-smoke.png' });
});
