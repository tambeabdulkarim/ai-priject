// docs/16-API-CONTRACT.md POST /users/me/change-password
// docs/10-SECURITY-BIBLE.md §4: minimum 10 characters.

import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(10)
  newPassword!: string;
}
