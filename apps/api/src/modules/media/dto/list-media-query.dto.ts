// Phase 13.3 (Media Frontend) — GET /media/me. Same cursor-pagination
// convention as every other list endpoint (docs/16-API-CONTRACT.md
// "Pagination Standard"), mirroring ListCoursesQueryDto's shape.

import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const MEDIA_TYPES = ['video', 'image', 'audio'] as const;

export class ListMediaQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(MEDIA_TYPES)
  mediaType?: (typeof MEDIA_TYPES)[number];

  @IsOptional()
  @IsString()
  q?: string;
}
