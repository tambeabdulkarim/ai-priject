import { test, expect } from '@playwright/test';
import { expectCleanPageLoad } from '../helpers/assertions';

// Creates a real account against the real backend each run (unique
// timestamped email) — the enumeration-safe response is identical
// whether or not the email was actually new, so this is safe to re-run.
test.describe('Authentication / Register', () => {
  test('submitting a new account shows the enumeration-safe success state', async ({ page }) => {
    await page.goto('/en/register');
    await page.waitForLoadState('networkidle');
    await expectCleanPageLoad(page);

    const email = `e2e.register.${Date.now()}@phoenix.test`;
    await page.locator('#displayName').fill('E2E Register Test');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill('E2eRegisterTest!123');
    await page.getByRole('button', { name: /create account/i }).click();

    // Real POST /auth/register observed taking several seconds under
    // load (bcrypt hashing + real email-enumeration-safe response path)
    // — the default 5s assertion timeout is too tight for that.
    await expect(page.getByRole('status')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/check your email/i)).toBeVisible();
  });
});
