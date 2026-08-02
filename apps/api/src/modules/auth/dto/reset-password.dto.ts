// docs/16-API-CONTRACT.md POST /auth/reset-password

import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(10)
  newPassword!: string;
}
