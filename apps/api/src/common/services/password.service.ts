// docs/10-SECURITY-BIBLE.md §4: "Hashing: Argon2id, with per-install pepper
// stored in the secrets manager (§17) in addition to the standard per-password
// salt." Argon2's own salt handling covers the salt; the pepper is a
// server-only secret concatenated before hashing so a stolen password-hash
// database alone is insufficient to run offline cracking.

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { AppConfig } from '../../config/configuration';

@Injectable()
export class PasswordService {
  private readonly pepper: string;

  constructor(configService: ConfigService<AppConfig, true>) {
    this.pepper = configService.get('security', { infer: true }).passwordPepper;
  }

  hash(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword + this.pepper, { type: argon2.argon2id });
  }

  verify(hash: string, plainPassword: string): Promise<boolean> {
    return argon2.verify(hash, plainPassword + this.pepper);
  }
}
