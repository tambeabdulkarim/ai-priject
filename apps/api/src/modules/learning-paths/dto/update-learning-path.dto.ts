// docs/16-API-CONTRACT.md PATCH /learning-paths/:id

import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateLearningPathDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
