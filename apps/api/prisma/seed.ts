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
//  - Grants: superadmin always receives every seeded permission (the
//    catalog's own apex role). Additional roles are granted a permission
//    ONLY where docs/16-API-CONTRACT.md's own "Authorization Required"
//    column explicitly names them (e.g. "course:create (instructor/
//    content_editor)" is a direct transcription, not a guess). Where
//    doc16 doesn't name specific roles (e.g. user:assign_role — "(superadmin)"
//    only), only superadmin is granted, since assigning it to `admin` vs
//    `support` vs `moderator` would be an undocumented product decision.
//    [Corrected during Phase 13 final audit: an earlier version of this
//    comment incorrectly claimed doc16 doesn't name roles for user:list,
//    user:read, user:ban, and audit:read — it does; see EXPLICIT_ROLE_GRANTS.]

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
  'course:create',
  'course:publish',
  'order:refund',
  'product:create',
  'order:list',
  'news:create',
  'news:publish',
  'media:reprocess',
  'moderation:read',
  'comment:moderate',
  'analytics:read',
  'settings:read',
  'settings:write',
  // Phase 26 — docs/16-API-CONTRACT.md §20. No new permission was needed
  // for Projects (grading/creation there is ownership-OR-editorial,
  // enforced in ProjectsService, the exact same pattern already used for
  // course:create's sibling actions like editing/archiving a course —
  // see docs/phase26-learning-path-project-architecture-report.md's
  // Authorization Model section for the full reasoning). LearningPaths
  // genuinely needed two new keys: a path spans multiple instructors'
  // courses, so — unlike course:create, open to any instructor — it
  // follows the news:create precedent (an editorial/curricular object,
  // content_editor/admin only).
  'learning_path:create',
  'learning_path:publish',
] as const;

// docs/16-API-CONTRACT.md "Authorization Required" — direct transcription,
// not an invented mapping. Every key here also implicitly goes to
// superadmin (handled separately below).
const EXPLICIT_ROLE_GRANTS: Record<string, string[]> = {
  // docs/16-API-CONTRACT.md: "user:list (admin/support)"
  'user:list': ['admin', 'support'],
  // docs/16-API-CONTRACT.md: "user:read (admin/support)"
  'user:read': ['admin', 'support'],
  // docs/16-API-CONTRACT.md: "user:ban (admin)"
  'user:ban': ['admin'],
  // docs/16-API-CONTRACT.md: "audit:read (admin/security)" — "security" is
  // not a role in docs/09-PLATFORM-ARCHITECTURE.md §5's 8-role catalog
  // (guest/learner/instructor/content_editor/moderator/support/admin/
  // superadmin), so only the real, named "admin" role is granted here;
  // the non-existent "security" role is a documentation gap, not invented.
  'audit:read': ['admin'],
  'course:create': ['instructor', 'content_editor'],
  'course:publish': ['content_editor', 'admin'],
  'order:refund': ['admin', 'support'],
  // docs/16-API-CONTRACT.md: "product:create (admin; future vendor role)"
  'product:create': ['admin'],
  // docs/16-API-CONTRACT.md: "order:list (admin)"
  'order:list': ['admin'],
  // docs/16-API-CONTRACT.md: "news:create (content_editor/admin)"
  'news:create': ['content_editor', 'admin'],
  // docs/16-API-CONTRACT.md: "news:publish (content_editor/admin)"
  'news:publish': ['content_editor', 'admin'],
  // docs/16-API-CONTRACT.md: "media:reprocess (admin)"
  'media:reprocess': ['admin'],
  // docs/16-API-CONTRACT.md: "moderation:read (moderator/admin)"
  'moderation:read': ['moderator', 'admin'],
  // docs/16-API-CONTRACT.md: "comment:moderate (moderator/admin)"
  'comment:moderate': ['moderator', 'admin'],
  // docs/16-API-CONTRACT.md: "analytics:read (admin)"
  'analytics:read': ['admin'],
  // docs/16-API-CONTRACT.md: "settings:read (superadmin)" and
  // "settings:write (superadmin)" — no explicit grant needed beyond the
  // default superadmin grant every permission already receives.
  // docs/16-API-CONTRACT.md §20: "content_editor/admin" — direct
  // transcription of the news:create precedent this phase's own contract
  // section explicitly cites.
  'learning_path:create': ['content_editor', 'admin'],
  'learning_path:publish': ['content_editor', 'admin'],
};

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

  const roles = await prisma.role.findMany({
    where: { name: { in: ROLE_NAMES as unknown as string[] } },
  });
  const roleByName = new Map(roles.map((r) => [r.name, r]));
  const permissions = await prisma.permission.findMany({
    where: { key: { in: [...PERMISSION_KEYS] } },
  });

  const superadmin = roleByName.get('superadmin');
  if (!superadmin) throw new Error('superadmin role missing after seed.');

  let grantCount = 0;
  for (const permission of permissions) {
    const roleNamesToGrant = new Set<string>([
      'superadmin',
      ...(EXPLICIT_ROLE_GRANTS[permission.key] ?? []),
    ]);
    for (const roleName of roleNamesToGrant) {
      const role = roleByName.get(roleName);
      if (!role) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
      grantCount += 1;
    }
  }

  console.log(
    `Seeded ${ROLE_NAMES.length} roles, ${PERMISSION_KEYS.length} permissions, ${grantCount} role-permission grants.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
