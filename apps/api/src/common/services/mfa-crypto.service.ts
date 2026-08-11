// docs/10-SECURITY-BIBLE.md §5 (MFA Policy). Phase 14.2 Security
// Architecture Review, Decision 1 (TOTP secret protection strategy):
// AES-256-GCM symmetric encryption at rest, keyed by MFA_ENCRYPTION_KEY
// (a per-install secret, same pattern as PasswordService's pepper).
//
// Why encryption, not hashing (unlike passwordHash/refreshToken/recovery
// codes elsewhere in this codebase): a TOTP secret must be recoverable in
// plaintext to compute the expected code at verification time — hashing
// is one-way and would make verification impossible. This is the one
// place in the auth system where a reversible transform is the correct
// choice, not a shortcut.
//
// Why AES-256-GCM specifically: authenticated encryption (GCM's tag
// detects tampering/corruption, unlike CBC), a single well-reviewed
// Node.js `crypto` primitive (no new dependency), and a 96-bit random IV
// per encryption (never reused) as GCM requires.
//
// Why an env-var key, not a KMS/secrets-manager (rejected alternative):
// no such infrastructure is provisioned anywhere in this project today —
// the same situation Storage was in before Phase 13.6 chose a provider.
// Introducing a net-new KMS dependency to ship this phase would repeat
// that unresolved-infrastructure pattern instead of learning from it. The
// encryption is isolated entirely to this one service, so swapping the
// key source for a real KMS later is a contained, non-breaking change.

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { AppConfig } from '../../config/configuration';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // 96-bit IV, the size GCM is designed for.

@Injectable()
export class MfaCryptoService {
  private readonly key: Buffer;

  constructor(configService: ConfigService<AppConfig, true>) {
    const rawKey = configService.get('security', { infer: true }).mfaEncryptionKey;
    // Deliberately not thrown here for an empty key (mirrors
    // StorageService's assertConfigured-on-use pattern, not
    // fail-at-construction) — MFA enrollment simply cannot succeed until
    // a real key is configured, exactly like Storage before Phase 13.6/13.7.
    this.key = rawKey ? Buffer.from(rawKey, 'base64') : Buffer.alloc(0);
  }

  private assertConfigured(): void {
    if (this.key.length !== 32) {
      throw new Error(
        'MFA is not configured: MFA_ENCRYPTION_KEY is empty or not a 32-byte base64 key.',
      );
    }
  }

  /** Returns `iv:authTag:ciphertext`, each base64, colon-joined (no ambiguity — base64 never contains ':'). */
  encrypt(plaintext: string): string {
    this.assertConfigured();
    const iv = randomBytes(IV_LENGTH_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join(
      ':',
    );
  }

  decrypt(payload: string): string {
    this.assertConfigured();
    const [ivB64, authTagB64, ciphertextB64] = payload.split(':');
    if (!ivB64 || !authTagB64 || !ciphertextB64) {
      throw new Error('Malformed MFA secret payload.');
    }
    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextB64, 'base64')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  }
}
