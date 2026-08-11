// docs/10-SECURITY-BIBLE.md §5. POST /auth/mfa/disable — password
// re-confirmation required, matching ChangePasswordDto's existing pattern
// for other security-sensitive account actions.

import { IsString } from 'class-validator';

export class MfaDisableDto {
  @IsString()
  password!: string;
}
