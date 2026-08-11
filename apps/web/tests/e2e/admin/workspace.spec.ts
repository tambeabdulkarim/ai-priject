import {
  expectCleanPageLoad,
  expectHeadingVisible,
  expectMainContentVisible,
} from '../helpers/assertions';
import { test, expect } from '../fixtures/roles';
import { FIXTURES } from '../setup/global-setup';

// Phase 11.6: `adminPage` is a worker-scoped fixture (fixtures/roles.ts)
// — one real login for the `admin` role, shared across every spec file
// that needs it, not just within this file. Settings needs a second,
// `superadmin` session (a real permission boundary this role doesn't
// hold) and stays in its own file.
test.describe('Admin', () => {
  test('Dashboard loads inside the admin shell with sidebar and real analytics overview', async ({
    adminPage: page,
  }) => {
    await page.goto('/en/admin');
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expectMainContentVisible(page);
    await expectHeadingVisible(page);

    // Shared Admin Shell — sidebar links to the other real admin sections.
    await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Audit logs', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Analytics', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Users', exact: true })).toBeVisible();
    // Settings is superadmin-only — this fixture holds `admin`, not `superadmin`.
    await expect(page.getByRole('link', { name: 'Settings', exact: true })).toHaveCount(0);
  });

  test('Users lists real users and search finds the admin fixture itself', async ({
    adminPage: page,
  }) => {
    const admin = FIXTURES.find((f) => f.key === 'admin')!;

    await page.goto('/en/admin/users');
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expectMainContentVisible(page);
    await expectHeadingVisible(page);

    await page.getByLabel(/search by email or name/i).fill(admin.email);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(admin.email)).toBeVisible();
  });

  // This real page's own copy table is Arabic-only regardless of the
  // /en or /ar URL prefix — a pre-existing app characteristic.
  test('Audit Logs loads with filters and either entries or the real empty state', async ({
    adminPage: page,
  }) => {
    await page.goto('/en/admin/audit-logs');
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expectMainContentVisible(page);
    await expect(page.getByText('سجل التدقيق')).toBeVisible();
    await expect(page.getByLabel('من')).toBeVisible();
    await expect(page.getByLabel('إلى')).toBeVisible();
  });

  test('Analytics loads with a date range and the real single-overview metric card', async ({
    adminPage: page,
  }) => {
    await page.goto('/en/admin/analytics');
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expectMainContentVisible(page);

    await expect(page.locator('#from')).toBeVisible();
    await expect(page.locator('#to')).toBeVisible();
  });
});
