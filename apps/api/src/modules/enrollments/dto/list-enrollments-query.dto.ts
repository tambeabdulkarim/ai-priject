// docs/16-API-CONTRACT.md GET /enrollments/me

import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListEnrollmentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['active', 'expired', 'refunded'])
  status?: string;
}
