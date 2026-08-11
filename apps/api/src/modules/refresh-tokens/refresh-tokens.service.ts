// docs/10-SECURITY-BIBLE.md §6/§8: refresh tokens are stored server-side
// hashed (never plaintext), rotated on every use, and reuse of an
// already-rotated token is treated as theft — the entire session family is
// revoked immediately. Refresh tokens are high-entropy random secrets (not
// human-chosen), so a fast deterministic hash (SHA-256) is the correct
// choice here — unlike passwords (docs/10-SECURITY-BIBLE.md §4, Argon2id),
// slow hashing would only add latency without a meaningful security benefit
// against a 256-bit-entropy secret, and a deterministic hash is required to
// look the token up by hash in O(1) rather than comparing against every row.

import { createHash, randomBytes } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RefreshToken } from '@prisma/client';
import { SessionsRepository } from '../sessions/sessions.repository';
import { RefreshTokensRepository } from './refresh-tokens.repository';

export interface IssuedRefreshToken {
  raw: string;
  record: RefreshToken;
}

@Injectable()
export class RefreshTokensService {
  constructor(
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  private hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  findByTokenHash(tokenHash: string) {
    return this.refreshTokensRepository.findByTokenHash(tokenHash);
  }

  async issue(userId: string, sessionId: string, expiresAt: Date): Promise<IssuedRefreshToken> {
    const raw = randomBytes(48).toString('hex');
    const record = await this.refreshTokensRepository.create({
      user: { connect: { id: userId } },
      session: { connect: { id: sessionId } },
      tokenHash: this.hash(raw),
      expiresAt,
    });
    return { raw, record };
  }

  /**
   * docs/15-SYSTEM-WORKFLOWS.md §4 (Refresh): validates, detects reuse, and
   * rotates. docs/16-API-CONTRACT.md POST /auth/refresh: "401
   * (invalid/expired/reused token — reused triggers full session-family
   * revocation)" — reuse is a 401 like every other failure mode here, not
   * a 403; the session-family revocation still happens either way.
   */
  async rotate(rawToken: string): Promise<IssuedRefreshToken> {
    const tokenHash = this.hash(rawToken);
    const existing = await this.refreshTokensRepository.findByTokenHash(tokenHash);

    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (existing.revokedAt || existing.usedAt) {
      // Reuse of an already-rotated or revoked token — treat as theft.
      await this.refreshTokensRepository.revokeAllForSession(existing.sessionId, 'reuse_detected');
      await this.sessionsRepository.revoke(existing.sessionId);
      throw new UnauthorizedException('Refresh token reuse detected — session revoked.');
    }

    if (existing.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token has expired.');
    }

    const raw = randomBytes(48).toString('hex');
    const record = await this.refreshTokensRepository.markUsedAndCreateNext(existing.id, {
      user: { connect: { id: existing.userId } },
      session: { connect: { id: existing.sessionId } },
      tokenHash: this.hash(raw),
      previousToken: { connect: { id: existing.id } },
      expiresAt: existing.expiresAt,
    });

    return { raw, record };
  }

  revoke(id: string, reason: string) {
    return this.refreshTokensRepository.revoke(id, reason);
  }

  revokeAllForSession(sessionId: string, reason: string) {
    return this.refreshTokensRepository.revokeAllForSession(sessionId, reason);
  }
}
