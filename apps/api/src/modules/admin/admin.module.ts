import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { AdminController } from './admin.controller';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsService } from './analytics.service';
import { AuditLogsQueryService } from './audit-logs.service';
import { AuditLogsRepository } from './audit-logs.repository';
import { ModerationRepository } from './moderation.repository';
import { ModerationService } from './moderation.service';

@Module({
  imports: [CommonModule],
  controllers: [AdminController],
  providers: [
    AuditLogsQueryService,
    AuditLogsRepository,
    ModerationService,
    ModerationRepository,
    AnalyticsService,
    AnalyticsRepository,
  ],
})
export class AdminModule {}
