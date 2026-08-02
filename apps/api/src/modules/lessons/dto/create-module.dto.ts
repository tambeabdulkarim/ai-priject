// Not documented in docs/16-API-CONTRACT.md — no endpoint for creating a
// Module is specified anywhere, even though Lesson creation requires an
// existing moduleId and the Module table itself is fully defined in
// docs/13-DATABASE-BLUEPRINT.md. This is the minimal endpoint needed to
// make the documented Lesson endpoints usable; not a database change.

import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateModuleDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
