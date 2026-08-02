// docs/16-API-CONTRACT.md POST /auth/login

import { IsEmail, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  mfaCode?: string;
}
