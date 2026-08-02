import { ForbiddenException } from '@nestjs/common';

/**
 * Shared ownership-OR-privileged-role authorization pattern
 * (docs/16-API-CONTRACT.md uses this exact shape repeatedly: "owning
 * instructor or content_editor/admin" for Courses/Lessons, "admin/owner"
 * for Products). `ownerId` may be null (e.g. Product.ownerId — "future
 * vendor role", admin-owned at launch per docs/13-DATABASE-BLUEPRINT.md),
 * in which case only a privileged role can act.
 */
export function isOwnerOrRole(
  ownerId: string | null,
  actorId: string,
  actorRoles: string[],
  privilegedRoles: string[],
): boolean {
  const isOwner = ownerId !== null && ownerId === actorId;
  const isPrivileged = actorRoles.some((r) => privilegedRoles.includes(r));
  return isOwner || isPrivileged;
}

export function assertOwnerOrRole(
  ownerId: string | null,
  actorId: string,
  actorRoles: string[],
  privilegedRoles: string[],
): void {
  if (!isOwnerOrRole(ownerId, actorId, actorRoles, privilegedRoles)) {
    throw new ForbiddenException('Not authorized to modify this resource.');
  }
}

// docs/16-API-CONTRACT.md: "owning instructor or content_editor/admin" —
// the Courses/Lessons-specific instance of the pattern above.
const EDITORIAL_ROLES = ['content_editor', 'admin', 'superadmin'];

export function isOwnerOrEditorial(ownerId: string, actorId: string, actorRoles: string[]): boolean {
  return isOwnerOrRole(ownerId, actorId, actorRoles, EDITORIAL_ROLES);
}

export function assertOwnerOrEditorial(
  ownerId: string,
  actorId: string,
  actorRoles: string[],
): void {
  assertOwnerOrRole(ownerId, actorId, actorRoles, EDITORIAL_ROLES);
}
