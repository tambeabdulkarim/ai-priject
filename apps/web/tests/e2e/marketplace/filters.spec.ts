import { test, expect } from '@playwright/test';
import { expectCleanPageLoad } from '../helpers/assertions';

test.describe('Marketplace / Filters', () => {
  test('search filter narrows results without erroring', async ({ page }) => {
    await page.goto('/en/marketplace');
    await page.waitForLoadState('networkidle');

    await page.getByRole('searchbox').fill('E2E Fixture Product');
    await page.waitForLoadState('networkidle');
    await expectCleanPageLoad(page);
    await expect(page.getByRole('link', { name: /E2E Fixture Product/i })).toBeVisible();

    await page.getByRole('searchbox').fill('no-product-should-match-this-query-xyz');
    await page.waitForLoadState('networkidle');
    await expectCleanPageLoad(page);
    await expect(page.locator('.ph-state')).toBeVisible();
  });

  test('category dropdown and price inputs are present and usable', async ({ page }) => {
    await page.goto('/en/marketplace');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('combobox')).toBeVisible();
    const [minPrice, maxPrice] = await page.locator('input[type="number"]').all();
    await minPrice.fill('0');
    await maxPrice.fill('100000');
    await page.waitForLoadState('networkidle');
    await expectCleanPageLoad(page);
  });
});
