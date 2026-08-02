import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PermissionsService } from '../permissions/permissions.service';
import { RolesRepository } from './roles.repository';

/** docs/09-PLATFORM-ARCHITECTURE.md §5 — the approved, fully-enumerated role catalog. */
export const DEFAULT_REGISTRATION_ROLE = 'learner';

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
  ): Promise<Role[]> {
    const existingAssignments = await this.rolesRepository.findRoleNamesForUser(userId);
    const beforeRoleIds = existingAssignments.map((a) => a.roleId);

    if (roleIds.length > 0) {
      const roles = await this.rolesRepository.findAll();
      const validIds = new Set(roles.map((r) => r.id));
      const unknown = roleIds.filter((id) => !validIds.has(id));
      if (unknown.length > 0) {
        throw new BadRequestException(`Unknown role id(s): ${unknown.join(', ')}`);
      }
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

    const allRoles = await this.rolesRepository.findAll();
    return allRoles.filter((r) => roleIds.includes(r.id));
  }

  async findRoleIdByName(name: string): Promise<string | null> {
    const role = await this.rolesRepository.findByName(name);
    return role?.id ?? null;
  }
}
