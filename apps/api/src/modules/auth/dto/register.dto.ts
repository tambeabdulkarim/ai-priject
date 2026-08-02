// docs/16-API-CONTRACT.md POST /auth/register
// docs/10-SECURITY-BIBLE.md §4: minimum 10 characters (actual breached-
// password/strength checks are business logic, applied at registration time).

import { IsEmail, IsOptional, IsString, IsIn, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  password!: string;

  @IsString()
  @MaxLength(120)
  displayName!: string;

  @IsOptional()
  @IsIn(['ar', 'en'])
  locale?: string;
}
