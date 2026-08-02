import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AuditLogsQueryService } from './audit-logs.service';
import { AuditLogsRepository } from './audit-logs.repository';

@Module({
  controllers: [AdminController],
  providers: [AuditLogsQueryService, AuditLogsRepository],
})
export class AdminModule {}
