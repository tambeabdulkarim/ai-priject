// docs/16-API-CONTRACT.md POST /auth/login. The former `mfaCode?`
// field (never checked server-side) is gone — replaced by the two-step
// challenge/response flow (docs/10-SECURITY-BIBLE.md §5, Phase 14.2):
// see MfaVerifyDto / POST /auth/mfa/verify.

import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
