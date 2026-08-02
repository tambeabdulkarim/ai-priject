// Read-only query layer for Audit_Logs (docs/13-DATABASE-BLUEPRINT.md).
// Writes go through common/services/audit-log.service.ts — this repository
// only serves docs/16-API-CONTRACT.md GET /admin/audit-logs.

import { Injectable } from '@nestjs/common';
import { AuditLog, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface AuditLogFilters {
  actorUserId?: string;
  action?: string;
  targetType?: string;
  from?: Date;
  to?: Date;
}

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    filters: AuditLogFilters,
    params: { cursor?: string; limit: number },
  ): Promise<{ items: AuditLog[]; nextCursor: string | null }> {
    const where: Prisma.AuditLogWhereInput = {
      ...(filters.actorUserId ? { actorUserId: filters.actorUserId } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.targetType ? { targetType: filters.targetType } : {}),
      ...(filters.from || filters.to
        ? {
            occurredAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    };

    const items = await this.prisma.auditLog.findMany({
      take: params.limit + 1,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      where,
      orderBy: { occurredAt: 'desc' },
    });

    const hasMore = items.length > params.limit;
    const page = hasMore ? items.slice(0, params.limit) : items;

    return { items: page, nextCursor: hasMore ? page[page.length - 1].id : null };
  }
}
