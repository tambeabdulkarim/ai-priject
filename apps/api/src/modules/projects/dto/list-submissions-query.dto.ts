// docs/16-API-CONTRACT.md GET /courses/:courseId/projects/submissions

import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListSubmissionsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
