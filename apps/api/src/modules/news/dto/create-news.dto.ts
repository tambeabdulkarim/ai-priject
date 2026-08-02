// docs/16-API-CONTRACT.md POST /news

import { ArrayUnique, IsArray, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateNewsDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(1)
  body!: string;

  @IsUUID()
  categoryId!: string;

  // docs/13-DATABASE-BLUEPRINT.md Tags: "shared, freeform tag vocabulary" —
  // no separate tag-management endpoint exists anywhere in doc16, so
  // tags are accepted here as freeform names and resolved (find-or-create
  // by unique name) in the service — the only way this documented field
  // can ever be usable.
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  tags?: string[];
}
