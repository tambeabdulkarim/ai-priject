import { test, expect } from '@playwright/test';
import { expectCleanPageLoad } from '../helpers/assertions';

test.describe('Public Pages / Homepage', () => {
  test('loads and shows the brand + primary navigation', async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expect(page.locator('header.ph-topbar')).toBeVisible();
    await expect(page.getByText('Phoenix Project').first()).toBeVisible();
  });

  test('root redirects to the default locale', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/(ar|en)\/?$/);
    await expectCleanPageLoad(page);
  });
});
