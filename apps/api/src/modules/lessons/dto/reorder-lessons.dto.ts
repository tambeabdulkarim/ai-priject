// docs/16-API-CONTRACT.md POST .../lessons/reorder

import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class ReorderLessonsDto {
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  lessonIds!: string[];
}
