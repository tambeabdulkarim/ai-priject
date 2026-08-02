// docs/16-API-CONTRACT.md §18 (Administration).

import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { AnalyticsService } from './analytics.service';
import { AuditLogsQueryService } from './audit-logs.service';
import { AnalyticsOverviewQueryDto } from './dto/analytics-overview-query.dto';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';
import { ListModerationQueueQueryDto } from './dto/list-moderation-queue-query.dto';
import { ModerationDecisionDto } from './dto/moderation-decision.dto';
import { ModerationService } from './moderation.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly auditLogsQueryService: AuditLogsQueryService,
    private readonly moderationService: ModerationService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get('audit-logs')
  @RequirePermissions('audit:read')
  listAuditLogs(@Query() query: ListAuditLogsQueryDto) {
    return this.auditLogsQueryService.list(query);
  }

  @Get('moderation/queue')
  @RequirePermissions('moderation:read')
  listModerationQueue(@Query() query: ListModerationQueueQueryDto) {
    return this.moderationService.listQueue(query);
  }

  @HttpCode(200)
  @Post('moderation/comments/:id/decision')
  @RequirePermissions('comment:moderate')
  decideComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModerationDecisionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.moderationService.decideComment(id, dto, user.sub);
  }

  @Get('analytics/overview')
  @RequirePermissions('analytics:read')
  getAnalyticsOverview(@Query() query: AnalyticsOverviewQueryDto) {
    return this.analyticsService.getOverview(query);
  }
}
