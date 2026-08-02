// docs/16-API-CONTRACT.md PATCH /marketplace/products/:id

import { IsIn, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @IsOptional()
  @IsUUID()
  fileId?: string;

  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: string;
}
