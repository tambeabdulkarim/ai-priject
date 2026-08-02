// docs/16-API-CONTRACT.md PATCH /users/me

import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @IsIn(['ar', 'en'])
  locale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;
}
