// docs/16-API-CONTRACT.md "Pagination Standard": cursor-based, default
// limit 20, maximum 100 (clamped, not rejected).

import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
}
