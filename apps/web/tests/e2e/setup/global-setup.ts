import fs from 'fs';
import path from 'path';
import type { FullConfig } from '@playwright/test';

// Phase 11.4 — provisions the role-scoped fixture accounts the feature
// suites authenticate as. Session reuse is NOT done via file-based
// `storageState`: the real `refresh_token` cookie is `Secure`, and
// Chromium silently withholds a CDP-injected `Secure` cookie from
// requests over plain http://localhost (re-verified in Phase 11.6 by
// reading the raw outgoing Cookie header, not just the resulting
// redirect — empty even though the cookie sits correctly in the
// injected jar). Not a bug in the app — the cookie's Secure flag is
// correct, real backend behavior; only a CDP-injection limitation.
// Phase 11.6 instead reuses one real, organic login per role across the
// whole suite via worker-scoped fixtures — see fixtures/roles.ts.
//
// No mocks: every fixture user is created through the REAL
// `POST /auth/register` endpoint (so its password hash is produced by
// the real backend, not reimplemented here). The only direct-database
// step is what has no API equivalent at all — marking the seed email
// verified and granting non-default roles — the same minimal,
// documented gap already relied on in prior phases (no self-serve email
// verification without a real inbox, no self-serve admin bootstrap).
//
// Idempotent: re-running this against the same dev database reuses
// existing fixture users rather than erroring or duplicating them.

const API_BASE = 'http://localhost:4000/api/v1';

export const FIXTURE_PASSWORD = 'E2eFixture!Passw0rd123';

export interface Fixture {
  key: string;
  email: string;
  displayName: string;
  /** Additional roles beyond the 'learner' role every registration receives by default. */
  extraRoles: string[];
}

export const FIXTURES: Fixture[] = [
  { key: 'learner', email: 'e2e.learner@phoenix.test', displayName: 'E2E Learner', extraRoles: [] },
  {
    key: 'instructor',
    email: 'e2e.instructor@phoenix.test',
    displayName: 'E2E Instructor',
    extraRoles: ['instructor', 'content_editor'],
  },
  {
    key: 'moderator',
    email: 'e2e.moderator@phoenix.test',
    displayName: 'E2E Moderator',
    extraRoles: ['moderator'],
  },
  {
    key: 'admin',
    email: 'e2e.admin@phoenix.test',
    displayName: 'E2E Admin',
    extraRoles: ['admin'],
  },
  {
    key: 'superadmin',
    email: 'e2e.superadmin@phoenix.test',
    displayName: 'E2E Superadmin',
    extraRoles: ['superadmin'],
  },
];

/** Stable slug so re-runs find and reuse the same fixture product instead of creating duplicates. */
export const FIXTURE_PRODUCT_SLUG = 'e2e-fixture-product';
const FIXTURE_PRODUCT_TITLE = 'E2E Fixture Product';
const FIXTURE_CATEGORY_SLUG = 'e2e-fixture-marketplace-category';
const FIXTURE_COURSE_CATEGORY_SLUG = 'e2e-fixture-course-category';

interface FixtureIds {
  courseCategoryId: string;
}

function fixtureIdsPath(): string {
  return path.resolve(__dirname, '../.auth/fixtures.json');
}

/** Read back the ids written by this file's own global setup — used by specs (e.g. Instructor / Create Course) that need a real, valid `categoryId` to submit (no category-listing endpoint exists — see routes.ts's own comment on this real backend gap). */
export function readFixtureIds(): FixtureIds {
  return JSON.parse(fs.readFileSync(fixtureIdsPath(), 'utf8')) as FixtureIds;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureFixtureUser(prisma: any, fixture: Fixture): Promise<{ id: string }> {
  let user = await prisma.user.findUnique({ where: { email: fixture.email } });

  if (!user) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: fixture.email,
        password: FIXTURE_PASSWORD,
        displayName: fixture.displayName,
        locale: 'en',
      }),
    });
    if (!res.ok) {
      throw new Error(
        `Fixture registration failed for ${fixture.email}: ${res.status} ${await res.text()}`,
      );
    }
    const body = (await res.json()) as { userId: string };
    user = await prisma.user.update({
      where: { id: body.userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  if (fixture.extraRoles.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentRoles: any[] = await prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: true },
    });
    const have = new Set(currentRoles.map((r) => r.role.name as string));
    const missing = fixture.extraRoles.filter((r) => !have.has(r));
    if (missing.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const roleRows: any[] = await prisma.role.findMany({ where: { name: { in: missing } } });
      for (const role of roleRows) {
        await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
      }
    }
  }

  return user;
}

/**
 * Product Details / Filters / Checkout need one real, published,
 * priced marketplace product to navigate to and buy — there is no way
 * to run those flows against an empty catalogue without inventing fake
 * UI state. Created once via the REAL `POST /marketplace/products` +
 * `PATCH .../publish` endpoints, authenticated as the admin fixture
 * (product:create is admin-only per prisma/seed.ts). The category has
 * no API at all (CategoriesModule has no controller — a documented
 * backend gap from Frontend Phase 8), so it's the one row created
 * directly via Prisma, same as the manual Phase 10.2 smoke-test setup.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureFixtureProduct(prisma: any): Promise<void> {
  const existing = await prisma.product.findUnique({ where: { slug: FIXTURE_PRODUCT_SLUG } });
  if (existing) {
    return;
  }

  let category = await prisma.category.findUnique({ where: { slug: FIXTURE_CATEGORY_SLUG } });
  if (!category) {
    category = await prisma.category.create({
      data: { name: 'E2E Fixture Category', slug: FIXTURE_CATEGORY_SLUG, domain: 'marketplace' },
    });
  }

  const admin = FIXTURES.find((f) => f.key === 'admin')!;
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: admin.email, password: FIXTURE_PASSWORD }),
  });
  if (!loginRes.ok) {
    throw new Error(
      `Fixture admin login failed while provisioning the fixture product: ${loginRes.status}`,
    );
  }
  const { accessToken } = (await loginRes.json()) as { accessToken: string };

  const createRes = await fetch(`${API_BASE}/marketplace/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      title: FIXTURE_PRODUCT_TITLE,
      description:
        'Created by the Playwright E2E suite (Phase 11.4) — safe to leave in a dev database.',
      categoryId: category.id,
      priceCents: 1500,
    }),
  });
  if (!createRes.ok) {
    throw new Error(
      `Fixture product creation failed: ${createRes.status} ${await createRes.text()}`,
    );
  }
  const product = (await createRes.json()) as { id: string; slug: string };

  const publishRes = await fetch(`${API_BASE}/marketplace/products/${product.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ status: 'published' }),
  });
  if (!publishRes.ok) {
    throw new Error(
      `Fixture product publish failed: ${publishRes.status} ${await publishRes.text()}`,
    );
  }

  if (product.slug !== FIXTURE_PRODUCT_SLUG) {
    throw new Error(
      `Fixture product slug drifted from the expected '${FIXTURE_PRODUCT_SLUG}' to '${product.slug}' — ` +
        'update FIXTURE_PRODUCT_SLUG or clear the stale row.',
    );
  }
}

/** Course creation (Instructor workspace) needs a real `categoryId` — same documented gap as products: no category-listing endpoint exists, so the frontend form takes a raw id. Created directly via Prisma (no category API), idempotent on slug. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureCourseCategory(prisma: any): Promise<string> {
  let category = await prisma.category.findUnique({
    where: { slug: FIXTURE_COURSE_CATEGORY_SLUG },
  });
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'E2E Fixture Course Category',
        slug: FIXTURE_COURSE_CATEGORY_SLUG,
        domain: 'courses',
      },
    });
  }
  return category.id as string;
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  // apps/web has no direct dependency on @prisma/client or apps/api's
  // .env — both are reached deliberately (npm workspace hoisting makes
  // @prisma/client resolvable; apps/api/.env is read directly) since
  // there is no other way to bootstrap non-default roles without an
  // existing admin, mirroring the manual fixture setup used in prior
  // phases' live verification work.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config({ path: path.resolve(__dirname, '../../../../api/.env') });
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  let courseCategoryId: string;
  try {
    for (const fixture of FIXTURES) {
      await ensureFixtureUser(prisma, fixture);
    }
    await ensureFixtureProduct(prisma);
    courseCategoryId = await ensureCourseCategory(prisma);
  } finally {
    await prisma.$disconnect();
  }

  const ids: FixtureIds = { courseCategoryId };
  fs.mkdirSync(path.dirname(fixtureIdsPath()), { recursive: true });
  fs.writeFileSync(fixtureIdsPath(), JSON.stringify(ids, null, 2));
}
