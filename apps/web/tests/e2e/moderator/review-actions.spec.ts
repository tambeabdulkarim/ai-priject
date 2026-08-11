import { expectCleanPageLoad } from '../helpers/assertions';
import { test, expect } from '../fixtures/roles';
import { readFixtureIds } from '../setup/global-setup';

// Phase 11.6: `instructorPage`/`moderatorPage` are worker-scoped fixtures
// (fixtures/roles.ts) — one real login per role, shared across every spec
// file that needs it. This test drives two real, independent sessions in
// the same run: the instructor submits a real course for review, then the
// moderator reviews it — exercising the real cross-role workflow rather
// than assuming queue data already exists.
test.describe('Moderator / Review Actions', () => {
  test('a course submitted for review appears in the queue and shows the real permission boundary', async ({
    instructorPage,
    moderatorPage,
  }) => {
    const { courseCategoryId } = readFixtureIds();

    // --- Instructor: create and submit a course for review ---
    const courseTitle = `E2E Review Course ${Date.now()}`;

    await instructorPage.goto('/en/instructor/courses/new');
    await instructorPage.getByLabel(/course title/i).fill(courseTitle);
    await instructorPage.getByLabel(/category id/i).fill(courseCategoryId);
    await instructorPage.getByRole('button', { name: /create course/i }).click();
    await instructorPage.waitForURL(/\/en\/instructor\/courses\/.+\/edit/, { timeout: 15000 });

    // A course needs at least one module+lesson before it can be submitted
    // for review (real backend validation) — add one via the real form.
    await instructorPage.getByPlaceholder(/new module title/i).fill(`E2E Module ${Date.now()}`);
    await instructorPage.getByRole('button', { name: /^add module$/i }).click();
    await expect(instructorPage.getByRole('button', { name: /add lesson/i }).first()).toBeVisible({
      timeout: 10000,
    });
    await instructorPage
      .getByRole('button', { name: /add lesson/i })
      .first()
      .click();
    const lessonTitle = `E2E Lesson ${Date.now()}`;
    await instructorPage.getByPlaceholder(/new lesson title/i).fill(lessonTitle);
    // Content type defaults to 'text', which requires real body content
    // (apps/api's LessonsService.create — a genuine, intentional
    // validation rule, see docs/bugfix-text-lesson-body.md) — the create
    // form's body textarea must be filled or the real submit is a no-op.
    await instructorPage
      .getByPlaceholder(/lesson body/i)
      .fill('E2E real lesson body content for the review workflow test.');
    await instructorPage.getByRole('button', { name: /^add lesson$/i }).click();
    // Was `getByText(/text/).first()` — resolved to a hidden <option
    // value="text">text</option> inside the content-type <select> (native
    // dropdown options are never Playwright-"visible"), not real page
    // content. The lesson's own title is the real, visible confirmation
    // that it was added.
    await expect(instructorPage.getByText(lessonTitle)).toBeVisible({ timeout: 20000 });

    await instructorPage.getByRole('button', { name: /submit for review/i }).click();
    await expect(instructorPage.getByText(/in review/i).first()).toBeVisible({ timeout: 10000 });

    // --- Moderator: find it in the queue and open the review page ---
    await moderatorPage.goto('/en/moderator/queue');
    await moderatorPage.getByRole('button', { name: 'Courses', exact: true }).click();
    await moderatorPage.waitForLoadState('networkidle');

    const courseLink = moderatorPage.getByRole('link', { name: new RegExp(courseTitle) });
    await expect(courseLink).toBeVisible({ timeout: 10000 });
    await courseLink.click();

    await moderatorPage.waitForURL(/\/en\/moderator\/courses\/.+/);
    await expectCleanPageLoad(moderatorPage);
    await expect(moderatorPage.locator('h1')).toContainText(courseTitle);

    // Real, documented permission boundary: `moderator` does not hold
    // `course:publish` — the Publish button must NOT render, and the
    // real explanatory notice must.
    await expect(moderatorPage.getByRole('button', { name: /^publish course$/i })).toHaveCount(0);
    await expect(moderatorPage.getByText(/cannot act on this course/i)).toBeVisible();
  });
});
