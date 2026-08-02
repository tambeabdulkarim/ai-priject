// docs/16-API-CONTRACT.md POST /enrollments/:id/refund

import { IsString, MinLength } from 'class-validator';

export class RefundReasonDto {
  @IsString()
  @MinLength(3)
  reason!: string;
}
