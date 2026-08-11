// Data-access layer for MfaRecoveryCode (docs/10-SECURITY-BIBLE.md §5).
// Mirrors refresh-tokens.repository.ts's shape — same kind of hashed,
// single-use, individually-revocable secret record.

import { Injectable } from '@nestjs/common';
import { MfaRecoveryCode, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MfaRecoveryCodesRepository {
  constructor(private readonly prisma: PrismaService) {}

  createMany(userId: string, codeHashes: string[]): Promise<Prisma.BatchPayload> {
    return this.prisma.mfaRecoveryCode.createMany({
      data: codeHashes.map((codeHash) => ({ userId, codeHash })),
    });
  }

  findUnusedByUser(userId: string): Promise<MfaRecoveryCode[]> {
    return this.prisma.mfaRecoveryCode.findMany({
      where: { userId, usedAt: null },
    });
  }

  findByCodeHash(codeHash: string): Promise<MfaRecoveryCode | null> {
    return this.prisma.mfaRecoveryCode.findUnique({ where: { codeHash } });
  }

  markUsed(id: string): Promise<MfaRecoveryCode> {
    return this.prisma.mfaRecoveryCode.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  /** docs/10-SECURITY-BIBLE.md §5: "regenerating codes invalidates all previous codes" — a hard delete is correct here (unlike sessions/tokens, there's no reuse-detection value in keeping revoked recovery codes around; they carry no audit-relevant state once superseded). */
  deleteAllForUser(userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.mfaRecoveryCode.deleteMany({ where: { userId } });
  }
}
