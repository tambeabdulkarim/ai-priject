// docs/16-API-CONTRACT.md GET /orders/me, GET /admin/orders

import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListOrdersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['pending', 'paid', 'refunded', 'cancelled'])
  status?: string;
}

export class ListAdminOrdersQueryDto extends ListOrdersQueryDto {
  @IsOptional()
  @IsUUID()
  user?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
