// docs/10-SECURITY-BIBLE.md §18 / docs/13-DATABASE-BLUEPRINT.md Audit_Logs:
// append-only, security- and compliance-relevant event trail. Never updated
// or deleted by application code.

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface AuditLogEntry {
  actorUserId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: entry.actorUserId ?? null,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        beforeState: (entry.beforeState ?? undefined) as Prisma.InputJsonValue | undefined,
        afterState: (entry.afterState ?? undefined) as Prisma.InputJsonValue | undefined,
        ipAddress: entry.ipAddress ?? null,
      },
    });
  }
}
