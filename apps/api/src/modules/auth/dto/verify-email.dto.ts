// docs/16-API-CONTRACT.md POST /auth/verify-email

import { IsString } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  token!: string;
}
