import { test, expect } from '@playwright/test';
import { expectCleanPageLoad } from '../helpers/assertions';
import { FIXTURES, FIXTURE_PASSWORD } from '../setup/global-setup';

const learner = FIXTURES.find((f) => f.key === 'learner')!;

test.describe('Authentication / Login', () => {
  test('valid credentials sign the user in and land on the dashboard', async ({ page }) => {
    await page.goto('/en/login');
    await page.waitForLoadState('networkidle');
    await expectCleanPageLoad(page);

    await page.locator('#email').fill(learner.email);
    await page.locator('#password').fill(FIXTURE_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForURL(/\/en\/dashboard/);
    await expect(page.locator('h1')).toContainText(learner.email);
  });

  test('invalid credentials show a real backend error, no navigation', async ({ page }) => {
    await page.goto('/en/login');
    await page.locator('#email').fill(learner.email);
    await page.locator('#password').fill('DefinitelyWrongPassword!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Scoped to the real form-error element — a bare getByRole('alert')
    // also matches Next.js's own route-announcer div (also role="alert"),
    // a strict-mode collision, not an app bug (same fix as
    // reset-password.spec.ts).
    await expect(page.locator('.ph-form-error')).toBeVisible();
    await expect(page).toHaveURL(/\/en\/login/);
  });
});
