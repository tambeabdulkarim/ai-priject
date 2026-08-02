// docs/16-API-CONTRACT.md POST /admin/payments/:id/refund

import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class RefundPaymentDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  amountCents?: number;

  @IsString()
  @MinLength(3)
  reason!: string;
}
