// docs/16-API-CONTRACT.md PATCH /users/:id/roles — full replacement set.

import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class UpdateUserRolesDto {
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  roleIds!: string[];
}
