// Data-access layer for AI_Requests / AI_Usage (docs/13-DATABASE-BLUEPRINT.md).

import { Injectable } from '@nestjs/common';
import { AiRequest, AiUsage } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AiRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRequestById(id: string): Promise<AiRequest | null> {
    return this.prisma.aiRequest.findUnique({ where: { id } });
  }

  /**
   * docs/16-API-CONTRACT.md GET /ai/usage/me: "current billing-period
   * usage vs. quota". docs/12-AI-INTEGRATION-BIBLE.md §9 says quota resets
   * follow "the account's billing cycle boundary" without ever defining
   * that boundary (monthly? per §5 cost-tracking period?) — this reads
   * whichever AI_Usage row's period currently contains `now`, which is
   * exactly what the schema itself encodes (period_start/period_end),
   * without this code inventing a cycle length.
   */
  findCurrentUsage(userId: string, now: Date): Promise<AiUsage | null> {
    return this.prisma.aiUsage.findFirst({
      where: { userId, periodStart: { lte: now }, periodEnd: { gte: now } },
      orderBy: { periodStart: 'desc' },
    });
  }
}
