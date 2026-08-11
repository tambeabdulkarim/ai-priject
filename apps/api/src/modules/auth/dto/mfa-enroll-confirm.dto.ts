// docs/10-SECURITY-BIBLE.md §5. POST /auth/mfa/enroll/confirm.

import { IsString } from 'class-validator';

export class MfaEnrollConfirmDto {
  @IsString()
  code!: string;
}
