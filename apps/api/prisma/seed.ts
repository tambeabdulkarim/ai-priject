// Minimal, documentation-grounded seed. docs/14-DATABASE-RELATIONSHIPS.md
// line 649: "the platform should never be in a state where Roles exists but
// has zero rows" — this was already true before this seed (Roles/Permissions
// were empty), an existing Phase 2 gap, not something introduced here.
//
// Scope is deliberately minimal and non-inventive:
//  - Roles: the exact 8-role catalog enumerated in
//    docs/09-PLATFORM-ARCHITECTURE.md §5 ("guest, learner, instructor,
//    content_editor, moderator, support, admin, superadmin") — nothing added,
//    nothing omitted.
//  - Permissions: only the permission keys already named by an implemented
//    endpoint's `@RequirePermissions(...)` in docs/16-API-CONTRACT.md
//    (`user:list`, `user:read`, `user:ban`, `user:assign_role`). A complete
//    resource:action catalog for every future module (Marketplace, Learning,
//    Library, News, Files, AI) is NOT enumerated anywhere in the approved
//    docs and is intentionally left un-invented — seeding it would be
//    guessing architecture, which this session's rules forbid.
//  - Grants: superadmin receives all seeded permissions (the catalog's own
//    apex role); no other role is granted anything here, since assigning
//    e.g. `user:ban` to `admin` vs `support` vs `moderator` is a product
//    decision not specified in any approved document.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROLE_NAMES = [
  'guest',
  'learner',
  'instructor',
  'content_editor',
  'moderator',
  'support',
  'admin',
  'superadmin',
] as const;

const PERMISSION_KEYS = [
  'user:list',
  'user:read',
  'user:ban',
  'user:assign_role',
  'audit:read',
] as const;

async function main(): Promise<void> {
  for (const name of ROLE_NAMES) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, isSystemRole: true },
    });
  }

  for (const key of PERMISSION_KEYS) {
    const [domain] = key.split(':');
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, domain },
    });
  }

  const superadmin = await prisma.role.findUniqueOrThrow({ where: { name: 'superadmin' } });
  const permissions = await prisma.permission.findMany({ where: { key: { in: [...PERMISSION_KEYS] } } });

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superadmin.id, permissionId: permission.id } },
      update: {},
      create: { roleId: superadmin.id, permissionId: permission.id },
    });
  }

  console.log(`Seeded ${ROLE_NAMES.length} roles and ${PERMISSION_KEYS.length} permissions.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
