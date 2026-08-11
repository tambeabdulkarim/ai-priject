// docs/16-API-CONTRACT.md POST /learning-paths

import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLearningPathDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
