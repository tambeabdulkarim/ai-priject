// docs/16-API-CONTRACT.md POST /projects/submissions/:id/evaluate

import { IsBoolean, IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class EvaluateSubmissionDto {
  @IsInt()
  @Min(0)
  @Max(100)
  scorePercent!: number;

  @IsBoolean()
  passed!: boolean;

  @IsString()
  @MinLength(1)
  feedback!: string;
}
