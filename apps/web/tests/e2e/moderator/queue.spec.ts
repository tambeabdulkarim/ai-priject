import {
  expectCleanPageLoad,
  expectHeadingVisible,
  expectMainContentVisible,
} from '../helpers/assertions';
import { test, expect } from '../fixtures/roles';

// Phase 11.6: `moderatorPage` is a worker-scoped fixture (fixtures/roles.ts)
// — one real login for the `moderator` role, shared across every spec
// file that needs it, not just within this file.
test.describe('Moderator / Queue', () => {
  test('loads with all three real content-type filters', async ({ moderatorPage: page }) => {
    await page.goto('/en/moderator/queue');
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expectMainContentVisible(page);
    await expectHeadingVisible(page);

    await expect(page.getByRole('button', { name: 'All', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Courses', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Comments', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Courses', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expectCleanPageLoad(page);
  });
});
