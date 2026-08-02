// docs/16-API-CONTRACT.md PUT /library/items/:id/progress

import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateReadingProgressDto {
  // docs/13-DATABASE-BLUEPRINT.md Reading_Progress.last_position is a
  // free-form String (e.g. a page number, CFI, or scroll offset) — bounds
  // validation is limited to a sane non-empty length, since the field's
  // actual shape is reader-format-specific and not further specified.
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  lastPosition!: string;
}
