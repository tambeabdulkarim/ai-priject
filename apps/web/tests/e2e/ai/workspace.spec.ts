import {
  expectCleanPageLoad,
  expectHeadingVisible,
  expectMainContentVisible,
} from '../helpers/assertions';
import { test, expect } from '../fixtures/roles';

// Phase 11.6: `learnerPage` is a worker-scoped fixture (fixtures/roles.ts)
// — one real login for the `learner` role, shared across every spec file
// that needs it, not just within this file.
test.describe('AI Workspace', () => {
  test('Dashboard loads with usage section and the request-lookup form', async ({
    learnerPage: page,
  }) => {
    await page.goto('/en/ai');
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expectMainContentVisible(page);
    await expectHeadingVisible(page);

    await expect(page.getByRole('textbox').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /try it now/i })).toBeVisible();
  });

  test('Quota loads with real usage data or the documented not-tracked-yet state', async ({
    learnerPage: page,
  }) => {
    await page.goto('/en/ai/quota');
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expectMainContentVisible(page);
    await expectHeadingVisible(page);

    // Real backend: a fresh fixture user has no AiUsage row — the page
    // must show the explicit "not tracked" notice, never a fake number.
    await expect(page.locator('.ph-form-error, .ph-form')).toBeVisible();
  });

  test('Request Lookup: a real-format but unknown request id shows the real backend error', async ({
    learnerPage: page,
  }) => {
    await page.goto('/en/ai');
    await page.waitForLoadState('networkidle');

    const unknownId = '00000000-0000-0000-0000-000000000000';
    await page.getByPlaceholder(/request id/i).fill(unknownId);
    await page.getByRole('button', { name: /^view$/i }).click();

    await page.waitForURL(new RegExp(`/en/ai/requests/${unknownId}`));
    await page.waitForLoadState('networkidle');
    await expectCleanPageLoad(page);
    // Real GET /ai/requests/:id -> 404 for a nonexistent id, surfaced as-is
    // (real copy: "Couldn't load this request." — src/app/[lang]/ai/requests/[id]/page.tsx).
    await expect(page.getByText(/couldn.?t load/i)).toBeVisible({ timeout: 10000 });
  });

  test('Blocked Request UI: trying to create an AI request shows the real 501 notice', async ({
    learnerPage: page,
  }) => {
    await page.goto('/en/ai');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /try it now/i }).click();

    // Real POST /ai/requests -> real, permanent HTTP 501 (see
    // packages/types/src/ai.ts) — never simulated client-side.
    await expect(page.getByText(/blocked by documentation/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/501/)).toBeVisible();
  });
});
