// docs/16-API-CONTRACT.md POST /auth/oauth/:provider/callback

import { IsString } from 'class-validator';

export class OAuthCallbackDto {
  @IsString()
  code!: string;

  @IsString()
  state!: string;
}
