import { test, expect } from '@playwright/test';
import { expectCleanPageLoad } from '../helpers/assertions';

test.describe('Authentication / Reset Password', () => {
  test('without a token, the page shows the invalid-link state (no form)', async ({ page }) => {
    await page.goto('/en/reset-password');
    await page.waitForLoadState('networkidle');
    await expectCleanPageLoad(page);

    // Scoped to the real form-error element — a bare getByRole('alert')
    // also matches Next.js's own route-announcer div (also role="alert"),
    // a strict-mode collision, not an app bug.
    await expect(page.locator('.ph-form-error')).toBeVisible();
    await expect(page.getByLabel(/new password/i)).toHaveCount(0);
  });

  test('with a token present, the real reset form renders', async ({ page }) => {
    await page.goto('/en/reset-password?token=e2e-fake-token-for-form-render-only');
    await page.waitForLoadState('networkidle');
    await expectCleanPageLoad(page);

    await expect(page.getByLabel(/new password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /reset password/i })).toBeVisible();
  });
});
