import { type Page, expect } from '@playwright/test';

/**
 * The common "did this page load cleanly" check every spec in this
 * suite runs: the document rendered a body, has a non-empty title, and
 * shows none of Next.js's own error-page/error-overlay markers. This is
 * a structural check (works across both locales/languages) rather than
 * copy-text matching, so it doesn't need updating when translated
 * strings change.
 */
export async function expectCleanPageLoad(page: Page): Promise<void> {
  await expect(page.locator('body')).toBeVisible();
  await expect(page).toHaveTitle(/.+/);
  await expect(page.getByText(/application error/i)).toHaveCount(0);
  await expect(page.getByText(/unhandled runtime error/i)).toHaveCount(0);
  await expect(page.getByText(/this page could not be found/i)).toHaveCount(0);
}

/** The real, shared page shell every authenticated/public Phoenix page renders — `main.ph-page` — used as the "critical UI component" marker across suites that don't need a more specific check. */
export async function expectMainContentVisible(page: Page): Promise<void> {
  await expect(page.locator('main')).toBeVisible();
}

/** Asserts the page's `<h1>` (every real page in this app renders exactly one, via `ph-page-title`) is visible and non-empty. */
export async function expectHeadingVisible(page: Page): Promise<void> {
  const heading = page.locator('h1').first();
  await expect(heading).toBeVisible();
  await expect(heading).not.toHaveText('');
}
