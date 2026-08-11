import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('Authentication / Logout', () => {
  test('logging out ends the session and protected routes redirect to login', async ({ page }) => {
    await loginAs(page, 'learner');
    await page.goto('/en/settings');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Log out', exact: true }).click();
    // Real app behavior: the settings page's own protected-route guard can
    // win the race against the explicit post-logout redirect to home, so
    // the immediate landing spot is either the homepage or a login
    // redirect — both mean the session ended. The real assertion is below:
    // a previously-authenticated dashboard now bounces to login.
    await page.waitForURL(/\/en\/(login)?\/?(\?.*)?$/);

    await page.goto('/en/dashboard');
    await page.waitForURL(/\/en\/login/);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });
});
