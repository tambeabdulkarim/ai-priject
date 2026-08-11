// docs/16-API-CONTRACT.md POST /courses/:courseId/modules/:moduleId/lessons

import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

const CONTENT_TYPES = ['video', 'text', 'quiz'] as const;

export class CreateLessonDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsIn(CONTENT_TYPES)
  contentType!: (typeof CONTENT_TYPES)[number];

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsUUID()
  videoMediaId?: string;

  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;
}
