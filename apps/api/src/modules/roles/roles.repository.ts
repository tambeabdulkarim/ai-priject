// Data-access layer for Roles and User_Roles (docs/13-DATABASE-BLUEPRINT.md).

import { Injectable } from '@nestjs/common';
import { Role, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Role[]> {
    return this.prisma.role.findMany({ orderBy: { name: 'asc' } });
  }

  findById(id: string): Promise<Role | null> {
    return this.prisma.role.findUnique({ where: { id } });
  }

  findByName(name: string): Promise<Role | null> {
    return this.prisma.role.findUnique({ where: { name } });
  }

  findManyByNames(names: string[]): Promise<Role[]> {
    return this.prisma.role.findMany({ where: { name: { in: names } } });
  }

  findRoleNamesForUser(userId: string): Promise<(UserRole & { role: Role })[]> {
    return this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
  }

  /** docs/16-API-CONTRACT.md PATCH /users/:id/roles — full-set replacement. */
  async replaceUserRoles(userId: string, roleIds: string[], grantedById: string | null): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId } }),
      this.prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({ userId, roleId, grantedById })),
      }),
    ]);
  }
}
