import { test, expect } from '@playwright/test';
import {
  expectCleanPageLoad,
  expectHeadingVisible,
  expectMainContentVisible,
} from '../helpers/assertions';

// Basic "does the public marketplace page load" smoke test — deeper
// interaction (listing detail, filters, checkout) lives in
// tests/e2e/marketplace/.
test.describe('Public Pages / Marketplace', () => {
  test('loads with heading, filters, and the documented "no featured products" notice', async ({
    page,
  }) => {
    await page.goto('/en/marketplace');
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expectMainContentVisible(page);
    await expectHeadingVisible(page);
    await expect(page.getByRole('searchbox')).toBeVisible();

    // Real, documented backend gap (no featured-products endpoint) — the
    // page states this explicitly rather than fabricating a section.
    await expect(page.getByText(/featured/i)).toBeVisible();
  });
});
