// docs/10-SECURITY-BIBLE.md §5. POST /auth/mfa/verify — step 2 of the
// login challenge/response flow. `code` deliberately accepts either a
// 6-digit TOTP code or an XXXXX-XXXXX recovery code (AuthService tries
// both) — a single input field, matching the real UX (the user just
// types whatever their authenticator app or saved recovery list gives
// them; the server doesn't need the client to declare which kind it is).

import { IsString } from 'class-validator';

export class MfaVerifyDto {
  @IsString()
  challengeToken!: string;

  @IsString()
  code!: string;
}
