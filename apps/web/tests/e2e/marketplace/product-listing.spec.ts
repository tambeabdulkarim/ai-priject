import { test, expect } from '@playwright/test';
import {
  expectCleanPageLoad,
  expectHeadingVisible,
  expectMainContentVisible,
} from '../helpers/assertions';
import { FIXTURE_PRODUCT_SLUG } from '../setup/global-setup';

test.describe('Marketplace / Product Listing', () => {
  test('shows the real fixture product provisioned for this suite', async ({ page }) => {
    await page.goto('/en/marketplace');
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expectMainContentVisible(page);
    await expectHeadingVisible(page);

    await expect(page.locator('.ph-catalogue-card')).not.toHaveCount(0);
    await expect(page.getByRole('link', { name: /E2E Fixture Product/i })).toBeVisible();
  });

  test('product card links to its real detail page', async ({ page }) => {
    await page.goto('/en/marketplace');
    await page.getByRole('link', { name: /E2E Fixture Product/i }).click();
    await page.waitForURL(new RegExp(`/en/marketplace/${FIXTURE_PRODUCT_SLUG}`));
    await expectCleanPageLoad(page);
  });
});
