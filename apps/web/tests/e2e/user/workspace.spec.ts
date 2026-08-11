import {
  expectCleanPageLoad,
  expectHeadingVisible,
  expectMainContentVisible,
} from '../helpers/assertions';
import { test, expect } from '../fixtures/roles';
import { FIXTURES } from '../setup/global-setup';

const learner = FIXTURES.find((f) => f.key === 'learner')!;

// Phase 11.6: `learnerPage` is a worker-scoped fixture (fixtures/roles.ts)
// — one real login for the `learner` role, shared across every spec file
// that needs it, not just within this file.
test.describe('User Workspace', () => {
  test('Dashboard loads with the real signed-in user and quick links', async ({
    learnerPage: page,
  }) => {
    await page.goto('/en/dashboard');
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expectMainContentVisible(page);
    await expect(page.locator('h1')).toContainText(learner.email);
    await expect(page.locator('.ph-catalogue-card')).toHaveCount(4);
  });

  test('Profile loads the real profile form', async ({ learnerPage: page }) => {
    await page.goto('/en/profile');
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expectMainContentVisible(page);
    await expectHeadingVisible(page);
    await expect(page.locator('form')).toBeVisible();
  });

  test('Notifications loads with either a list or the real empty state', async ({
    learnerPage: page,
  }) => {
    await page.goto('/en/notifications');
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expectMainContentVisible(page);
    await expectHeadingVisible(page);

    const hasItems = await page.locator('.ph-module').count();
    if (hasItems === 0) {
      await expect(page.locator('.ph-state')).toBeVisible();
    }
  });

  test('My Courses loads with either enrolled courses or the real empty state', async ({
    learnerPage: page,
  }) => {
    await page.goto('/en/my-courses');
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expectMainContentVisible(page);
    await expectHeadingVisible(page);

    const hasItems = await page.locator('.ph-catalogue-card').count();
    if (hasItems === 0) {
      await expect(page.locator('.ph-state')).toBeVisible();
    }
  });

  test('Orders loads with either order history or the real empty state', async ({
    learnerPage: page,
  }) => {
    await page.goto('/en/orders');
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expectMainContentVisible(page);
    await expectHeadingVisible(page);

    const hasItems = await page.locator('.ph-catalogue-card').count();
    if (hasItems === 0) {
      await expect(page.locator('.ph-state')).toBeVisible();
    }
  });

  test('Certificates loads with either earned certificates or the real empty state', async ({
    learnerPage: page,
  }) => {
    await page.goto('/en/certificates');
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expectMainContentVisible(page);
    await expectHeadingVisible(page);

    const hasItems = await page.locator('.ph-catalogue-card').count();
    if (hasItems === 0) {
      await expect(page.locator('.ph-state')).toBeVisible();
    }
  });
});
