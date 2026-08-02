// docs/16-API-CONTRACT.md GET /admin/audit-logs — pagination, filter by
// actor, action, target_type, date range.

import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsUUID, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListAuditLogsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  actor?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  target_type?: string;

  @IsOptional()
  @Type(() => String)
  @IsDateString()
  from?: string;

  @IsOptional()
  @Type(() => String)
  @IsDateString()
  to?: string;
}
