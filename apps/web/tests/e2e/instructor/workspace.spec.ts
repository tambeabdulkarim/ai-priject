import { expectCleanPageLoad } from '../helpers/assertions';
import { test, expect } from '../fixtures/roles';
import { readFixtureIds } from '../setup/global-setup';

// Phase 11.6: `instructorPage` is a worker-scoped fixture (fixtures/roles.ts)
// — one real login for the `instructor` role, shared across every spec
// file that needs it, not just within this file.
test.describe('Instructor', () => {
  test('Dashboard loads with the stats grid and a link to create a course', async ({
    instructorPage: page,
  }) => {
    await page.goto('/en/instructor');
    await page.waitForLoadState('networkidle');

    await expectCleanPageLoad(page);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('link', { name: /new course/i })).toBeVisible();
  });

  test('Create Course: submitting the real form creates a draft course and redirects to its editor', async ({
    instructorPage: page,
  }) => {
    const { courseCategoryId } = readFixtureIds();

    await page.goto('/en/instructor/courses/new');
    await page.waitForLoadState('networkidle');
    await expectCleanPageLoad(page);

    const title = `E2E Fixture Course ${Date.now()}`;
    await page.getByLabel(/course title/i).fill(title);
    await page.getByLabel(/category id/i).fill(courseCategoryId);
    await page.getByRole('button', { name: /create course/i }).click();

    await page.waitForURL(/\/en\/instructor\/courses\/.+\/edit/, { timeout: 15000 });
    await expectCleanPageLoad(page);
    await expect(page.locator('h1')).toContainText(title);
  });

  test('Course Editor shows workflow status, details form, and module management', async ({
    instructorPage: page,
  }) => {
    const { courseCategoryId } = readFixtureIds();

    // Reach the editor through the real creation flow — this test does
    // not assume any pre-existing course.
    await page.goto('/en/instructor/courses/new');
    await page.getByLabel(/course title/i).fill(`E2E Editor Course ${Date.now()}`);
    await page.getByLabel(/category id/i).fill(courseCategoryId);
    await page.getByRole('button', { name: /create course/i }).click();
    await page.waitForURL(/\/en\/instructor\/courses\/.+\/edit/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expectCleanPageLoad(page);

    // Real workflow state for a brand-new course: Draft, submit-for-review available.
    await expect(page.getByText(/workflow status/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /submit for review/i })).toBeVisible();

    // Real Module Management — add one module via the real endpoint.
    const moduleTitle = `E2E Module ${Date.now()}`;
    await page.getByPlaceholder(/new module title/i).fill(moduleTitle);
    await page.getByRole('button', { name: /^add module$/i }).click();
    await expect(page.getByText(moduleTitle)).toBeVisible({ timeout: 10000 });
  });
});
