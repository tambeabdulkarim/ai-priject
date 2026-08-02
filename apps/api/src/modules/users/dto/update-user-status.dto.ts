// docs/16-API-CONTRACT.md PATCH /users/:id/status

import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateUserStatusDto {
  @IsIn(['active', 'suspended', 'deactivated'])
  status!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
