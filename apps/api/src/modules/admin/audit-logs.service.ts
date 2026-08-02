import { Injectable } from '@nestjs/common';
import { AuditLog } from '@prisma/client';
import { PaginatedResult } from '../../common/dto/pagination-query.dto';
import { AuditLogsRepository } from './audit-logs.repository';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

@Injectable()
export class AuditLogsQueryService {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  list(query: ListAuditLogsQueryDto): Promise<PaginatedResult<AuditLog>> {
    return this.auditLogsRepository.findMany(
      {
        actorUserId: query.actor,
        action: query.action,
        targetType: query.target_type,
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
      },
      { cursor: query.cursor, limit: query.limit },
    );
  }
}
