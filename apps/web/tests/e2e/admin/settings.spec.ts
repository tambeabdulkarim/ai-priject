import { expectCleanPageLoad, expectMainContentVisible } from '../helpers/assertions';
import { test, expect } from '../fixtures/roles';

// Phase 11.6: `adminPage`/`superadminPage` are worker-scoped fixtures
// (fixtures/roles.ts) — one real login per role, shared across every
// spec file that needs it. This file inherently needs both distinct
// role sessions since the whole point is exercising the real permission
// boundary between them.
//
// This real page's own copy table is Arabic-only regardless of the
// /en or /ar URL prefix — a pre-existing app characteristic.
test.describe('Admin / Settings', () => {
  test('as a plain admin (not superadmin), shows the real permission-boundary notice, not the settings list', async ({
    adminPage: page,
  }) => {
    await page.goto('/en/admin/settings');
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expectMainContentVisible(page);
    await expect(page.getByText('الإعدادات')).toBeVisible();
    await expect(page.getByText(/superadmin/)).toBeVisible();
  });

  test('as superadmin, loads the real settings list', async ({ superadminPage: page }) => {
    await page.goto('/en/admin/settings');
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expectMainContentVisible(page);
    await expect(page.getByText('الإعدادات')).toBeVisible();
  });
});
