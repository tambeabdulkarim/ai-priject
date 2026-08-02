// Data-access layer for Permissions and Role_Permissions
// (docs/13-DATABASE-BLUEPRINT.md). Pure persistence — no authorization
// decisions are made here, only data retrieval.

import { Injectable } from '@nestjs/common';
import { Permission } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Permission[]> {
    return this.prisma.permission.findMany({ orderBy: { key: 'asc' } });
  }

  findByKey(key: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({ where: { key } });
  }

  findById(id: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({ where: { id } });
  }

  /**
   * Resolves the full set of permission keys granted to a user, by
   * traversing User_Roles -> Role_Permissions -> Permissions.
   * docs/13-DATABASE-BLUEPRINT.md Role_Permissions: "the actual
   * authorization source of truth checked on every API request".
   */
  async findPermissionKeysForUser(userId: string): Promise<string[]> {
    const roleAssignments = await this.prisma.userRole.findMany({
      where: { userId },
      select: {
        role: {
          select: {
            rolePermissions: {
              select: { permission: { select: { key: true } } },
            },
          },
        },
      },
    });

    const keys = new Set<string>();
    for (const assignment of roleAssignments) {
      for (const rp of assignment.role.rolePermissions) {
        keys.add(rp.permission.key);
      }
    }
    return Array.from(keys);
  }
}
