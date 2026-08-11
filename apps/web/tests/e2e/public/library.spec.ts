import { test, expect } from '@playwright/test';
import {
  expectCleanPageLoad,
  expectHeadingVisible,
  expectMainContentVisible,
} from '../helpers/assertions';

test.describe('Public Pages / Library', () => {
  test('catalogue loads with heading, search, and either results or an empty state', async ({
    page,
  }) => {
    await page.goto('/en/library');
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expectMainContentVisible(page);
    await expectHeadingVisible(page);
    await expect(page.getByRole('searchbox')).toBeVisible();

    const hasCards = await page.locator('.ph-catalogue-card').count();
    if (hasCards === 0) {
      await expect(page.locator('.ph-state')).toBeVisible();
    }
  });
});
