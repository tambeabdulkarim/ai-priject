// docs/16-API-CONTRACT.md PUT /progress/lessons/:lessonId

import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateLessonProgressDto {
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercent!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lastPositionSeconds?: number;
}
