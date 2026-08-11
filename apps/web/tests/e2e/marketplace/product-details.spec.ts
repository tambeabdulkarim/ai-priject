import { expectCleanPageLoad } from '../helpers/assertions';
import { test, expect } from '../fixtures/roles';
import { FIXTURE_PRODUCT_SLUG } from '../setup/global-setup';

// Phase 11.6: `learnerPage` is a worker-scoped fixture (fixtures/roles.ts)
// — one real login for the `learner` role, shared across every spec file
// that needs it, not just within this file.
test.describe('Marketplace / Product Details & Checkout', () => {
  test('Product Details shows title, price, and purchase actions for the real fixture product', async ({
    learnerPage: page,
  }) => {
    await page.goto(`/en/marketplace/${FIXTURE_PRODUCT_SLUG}`);
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expect(page.locator('h1')).toContainText('E2E Fixture Product');
    await expect(page.getByText('$15.00')).toBeVisible();
    await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /buy now/i })).toBeVisible();
  });

  test('Product Details: an unknown product slug does not crash the page', async ({
    learnerPage: page,
  }) => {
    await page.goto('/en/marketplace/does-not-exist-e2e-slug');
    await page.waitForLoadState('networkidle');
    await expectCleanPageLoad(page);
  });

  test('Checkout Flow: adding the fixture product to the cart and proceeding reaches the real Stripe checkout', async ({
    learnerPage: page,
  }) => {
    await page.goto(`/en/marketplace/${FIXTURE_PRODUCT_SLUG}`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /add to cart/i }).click();
    await expect(page.getByRole('status')).toBeVisible();

    await page.goto('/en/checkout');
    await page.waitForLoadState('networkidle');
    await expectCleanPageLoad(page);
    await expect(page.getByText('E2E Fixture Product')).toBeVisible({ timeout: 10000 });

    // Real POST /orders -> real Stripe Checkout Session -> real redirect.
    // Does not enter card details or complete payment.
    await Promise.all([
      page.waitForURL(/checkout\.stripe\.com/, { timeout: 20000 }),
      page.getByRole('button', { name: /proceed to payment/i }).click(),
    ]);
    await expect(page).toHaveURL(/checkout\.stripe\.com/);
  });
});
