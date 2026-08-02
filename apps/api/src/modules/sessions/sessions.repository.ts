// Data-access layer for User_Sessions (docs/13-DATABASE-BLUEPRINT.md).

import { Injectable } from '@nestjs/common';
import { Prisma, UserSession } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.UserSessionCreateInput): Promise<UserSession> {
    return this.prisma.userSession.create({ data });
  }

  findById(id: string): Promise<UserSession | null> {
    return this.prisma.userSession.findUnique({ where: { id } });
  }

  findActiveByUserId(userId: string): Promise<UserSession[]> {
    return this.prisma.userSession.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  touchLastActive(id: string): Promise<UserSession> {
    return this.prisma.userSession.update({
      where: { id },
      data: { lastActiveAt: new Date() },
    });
  }

  revoke(id: string): Promise<UserSession> {
    return this.prisma.userSession.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  revokeAllForUser(userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  findActiveByUserIdExcept(userId: string, exceptSessionId: string): Promise<UserSession[]> {
    return this.prisma.userSession.findMany({
      where: { userId, revokedAt: null, id: { not: exceptSessionId } },
    });
  }

  revokeAllForUserExcept(userId: string, exceptSessionId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null, id: { not: exceptSessionId } },
      data: { revokedAt: new Date() },
    });
  }
}
