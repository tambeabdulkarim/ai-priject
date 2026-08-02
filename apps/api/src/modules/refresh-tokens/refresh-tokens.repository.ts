// Data-access layer for Refresh_Tokens (docs/13-DATABASE-BLUEPRINT.md).
// docs/10-SECURITY-BIBLE.md §8: only the hash is ever persisted.

import { Injectable } from '@nestjs/common';
import { Prisma, RefreshToken } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RefreshTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.RefreshTokenCreateInput): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data });
  }

  findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  markUsed(id: string): Promise<RefreshToken> {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  revoke(id: string, reason: string): Promise<RefreshToken> {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
  }

  revokeAllForSession(sessionId: string, reason: string): Promise<Prisma.BatchPayload> {
    return this.prisma.refreshToken.updateMany({
      where: { sessionId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
  }
}
