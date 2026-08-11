import { test } from '@playwright/test';
import { expectCleanPageLoad } from '../helpers/assertions';

// Root-level, unprefixed path — matches Stripe's real `success_url`
// exactly (see apps/api's orders.service.ts). Visited directly without a
// completed real payment, so no `?order=` id is available in this run;
// the page must still render cleanly in that state.
test.describe('Marketplace / Checkout Success Page', () => {
  test('loads cleanly without a completed order in context', async ({ page }) => {
    await page.goto('/checkout/success');
    await page.waitForLoadState('networkidle');
    await expectCleanPageLoad(page);
  });
});
