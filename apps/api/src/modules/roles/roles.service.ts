import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PermissionsService } from '../permissions/permissions.service';
import { RolesRepository } from './roles.repository';

/** docs/09-PLATFORM-ARCHITECTURE.md §5 — the approved, fully-enumerated role catalog. */
export const DEFAULT_REGISTRATION_ROLE = 'learner';

/**
 * docs/16-API-CONTRACT.md PATCH /users/:id/roles: "admin-capable role
 * grants require the actor to hold superadmin." Scoped narrowly to the
 * roles that actually reach the admin dashboard (docs/09-PLATFORM-
 * ARCHITECTURE.md §4/§13) — distinct from SessionsService's broader
 * MFA-mandatory role list, which serves a different rule.
 */
const ADMIN_CAPABLE_ROLE_NAMES = new Set(['admin', 'superadmin']);

@Injectable()
export class RolesService {
  constructor(
    private readonly rolesRepository: RolesRepository,
    private readonly auditLogService: AuditLogService,
    private readonly permissionsService: PermissionsService,
  ) {}

  findAll(): Promise<Role[]> {
    return this.rolesRepository.findAll();
  }

  findById(id: string): Promise<Role | null> {
    return this.rolesRepository.findById(id);
  }

  async getRoleNamesForUser(userId: string): Promise<string[]> {
    const assignments = await this.rolesRepository.findRoleNamesForUser(userId);
    return assignments.map((a) => a.role.name);
  }

  /**
   * docs/16-API-CONTRACT.md PATCH /users/:id/roles — full-set replacement.
   * docs/13-DATABASE-BLUEPRINT.md User_Roles Security Notes: "role
   * assignment is superadmin-only per docs/10-SECURITY-BIBLE.md §3" — the
   * superadmin check itself is enforced by PermissionsGuard/@RequirePermissions
   * at the controller layer (`user:assign_role`); this method validates the
   * requested role IDs exist and records the audit trail the table's own
   * Security Notes require.
   */
  async assignRolesToUser(
    userId: string,
    roleIds: string[],
    grantedById: string | null,
    actorRoleNames: string[] = [],
  ): Promise<Role[]> {
    const existingAssignments = await this.rolesRepository.findRoleNamesForUser(userId);
    const beforeRoleIds = existingAssignments.map((a) => a.roleId);

    const allRolesUpfront = await this.rolesRepository.findAll();
    if (roleIds.length > 0) {
      const validIds = new Set(allRolesUpfront.map((r) => r.id));
      const unknown = roleIds.filter((id) => !validIds.has(id));
      if (unknown.length > 0) {
        throw new BadRequestException(`Unknown role id(s): ${unknown.join(', ')}`);
      }
    }

    const requestedRoleNames = allRolesUpfront
      .filter((r) => roleIds.includes(r.id))
      .map((r) => r.name);
    const grantsAdminCapableRole = requestedRoleNames.some((name) =>
      ADMIN_CAPABLE_ROLE_NAMES.has(name),
    );
    if (grantsAdminCapableRole && !actorRoleNames.includes('superadmin')) {
      throw new ForbiddenException('Only superadmin may grant an admin-capable role.');
    }

    await this.rolesRepository.replaceUserRoles(userId, roleIds, grantedById);
    await this.permissionsService.invalidateCacheForUser(userId);

    await this.auditLogService.record({
      actorUserId: grantedById,
      action: 'user.roles.replaced',
      targetType: 'User',
      targetId: userId,
      beforeState: { roleIds: beforeRoleIds },
      afterState: { roleIds },
    });

    return allRolesUpfront.filter((r) => roleIds.includes(r.id));
  }

  async findRoleIdByName(name: string): Promise<string | null> {
    const role = await this.rolesRepository.findByName(name);
    return role?.id ?? null;
  }
}
