import { test } from '@playwright/test';
import { expectCleanPageLoad } from '../helpers/assertions';

// Root-level, unprefixed path — matches Stripe's real `cancel_url` exactly.
test.describe('Marketplace / Checkout Cancel Page', () => {
  test('loads cleanly without a completed order in context', async ({ page }) => {
    await page.goto('/checkout/cancel');
    await page.waitForLoadState('networkidle');
    await expectCleanPageLoad(page);
  });
});
