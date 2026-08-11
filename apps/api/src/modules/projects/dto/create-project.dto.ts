// docs/16-API-CONTRACT.md POST /courses/:courseId/projects

import { IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  // Links to an existing project-brief Lesson instead of duplicating its
  // content — see Project's schema.prisma doc comment (Phase 26).
  @IsOptional()
  @IsUUID()
  sourceLessonId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
