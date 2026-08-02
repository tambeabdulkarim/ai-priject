// docs/16-API-CONTRACT.md PATCH /admin/settings/:key — Request Body: `value`.
//
// BLOCKED BY DOCUMENTATION (partial): doc16 says "value validated against
// the setting's declared type/schema", but the `Settings` model
// (docs/13-DATABASE-BLUEPRINT.md) has no `type`/`schema` column or any
// type registry anywhere in the approved schema — there is nothing to
// validate the value's type against. Only the part that IS backed by the
// schema is validated here (value is a non-empty string, matching the
// column's own type); the declared-type/schema check itself is not
// invented.

import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateSettingDto {
  @IsString()
  @IsNotEmpty()
  value!: string;
}
