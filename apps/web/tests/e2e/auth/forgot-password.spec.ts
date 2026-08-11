import { test, expect } from '@playwright/test';
import { expectCleanPageLoad } from '../helpers/assertions';

test.describe('Authentication / Forgot Password', () => {
  test('submitting an email shows the enumeration-safe success state', async ({ page }) => {
    await page.goto('/en/forgot-password');
    await page.waitForLoadState('networkidle');
    await expectCleanPageLoad(page);

    await page.locator('#email').fill('e2e.forgot-password@phoenix.test');
    await page.getByRole('button', { name: /send|reset/i }).click();

    await expect(page.getByRole('status')).toBeVisible();
  });
});
