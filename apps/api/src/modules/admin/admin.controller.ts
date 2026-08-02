// docs/16-API-CONTRACT.md §18 (Administration).

import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuditLogsQueryService } from './audit-logs.service';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly auditLogsQueryService: AuditLogsQueryService) {}

  @Get('audit-logs')
  @RequirePermissions('audit:read')
  listAuditLogs(@Query() query: ListAuditLogsQueryDto) {
    return this.auditLogsQueryService.list(query);
  }
}
