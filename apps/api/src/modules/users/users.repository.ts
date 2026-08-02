// Data-access layer for Users (docs/13-DATABASE-BLUEPRINT.md). Pure
// persistence only — password verification, enumeration-safe login
// handling, etc. live in AuthService/UsersService, not here.

import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async findMany(params: {
    cursor?: string;
    limit: number;
    status?: string;
    search?: string;
    roleName?: string;
  }): Promise<{ items: User[]; nextCursor: string | null }> {
    const where: Prisma.UserWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { email: { contains: params.search, mode: 'insensitive' } },
              { displayName: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(params.roleName
        ? { roleAssignments: { some: { role: { name: params.roleName } } } }
        : {}),
    };

    const items = await this.prisma.user.findMany({
      take: params.limit + 1,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      where,
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = items.length > params.limit;
    const page = hasMore ? items.slice(0, params.limit) : items;

    return {
      items: page,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }
}
