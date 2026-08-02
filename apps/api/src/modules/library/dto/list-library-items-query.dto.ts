// docs/16-API-CONTRACT.md GET /library/items

import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListLibraryItemsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  category?: string;

  @IsOptional()
  @IsUUID()
  author?: string;

  @IsOptional()
  @IsString()
  q?: string;
}
