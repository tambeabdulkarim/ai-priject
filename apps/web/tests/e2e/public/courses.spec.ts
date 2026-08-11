import { test, expect } from '@playwright/test';
import {
  expectCleanPageLoad,
  expectHeadingVisible,
  expectMainContentVisible,
} from '../helpers/assertions';

test.describe('Public Pages / Courses', () => {
  test('catalogue loads with heading, search, and either results or an empty state', async ({
    page,
  }) => {
    await page.goto('/en/courses');
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expectMainContentVisible(page);
    await expectHeadingVisible(page);

    await expect(page.getByRole('searchbox')).toBeVisible();

    // Real backend data — do not assume any specific course exists.
    // Either the catalogue grid or the documented empty state must render.
    const hasCards = await page.locator('.ph-catalogue-card').count();
    if (hasCards === 0) {
      await expect(page.locator('.ph-state')).toBeVisible();
    }
  });
});
