// docs/16-API-CONTRACT.md POST /auth/resend-verification, POST /auth/forgot-password
// Shared shape — both endpoints accept only an email.

import { IsEmail } from 'class-validator';

export class EmailOnlyDto {
  @IsEmail()
  email!: string;
}
