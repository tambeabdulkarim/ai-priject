// docs/16-API-CONTRACT.md GET /notifications/me — pagination, filter by read/unread.

import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListNotificationsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['read', 'unread'])
  status?: 'read' | 'unread';
}
