import { Injectable } from '@nestjs/common';
import { UserSession } from '@prisma/client';
import { SessionsRepository } from './sessions.repository';

/** docs/10-SECURITY-BIBLE.md §5: MFA-mandatory roles are treated as admin-capable. */
const ADMIN_CAPABLE_ROLES = new Set([
  'instructor',
  'content_editor',
  'moderator',
  'support',
  'admin',
  'superadmin',
]);

/**
 * docs/10-SECURITY-BIBLE.md §6: "Concurrent session limits are configurable
 * per role; admin-capable roles are capped at a small number of concurrent
 * sessions." The document leaves the exact numbers as an operational
 * decision — these are a conservative, documented-consistent default, not
 * an architectural claim.
 */
const CONCURRENT_SESSION_LIMIT = { adminCapable: 3, learner: 10 } as const;

@Injectable()
export class SessionsService {
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  findActiveByUserId(userId: string): Promise<UserSession[]> {
    return this.sessionsRepository.findActiveByUserId(userId);
  }

  static isAdminCapable(roleNames: string[]): boolean {
    return roleNames.some((r) => ADMIN_CAPABLE_ROLES.has(r));
  }

  /** docs/10-SECURITY-BIBLE.md §6: idle timeout — 30 days learner, 12h admin-capable. */
  static computeExpiry(roleNames: string[]): Date {
    const hours = SessionsService.isAdminCapable(roleNames) ? 12 : 24 * 30;
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  /**
   * docs/15-SYSTEM-WORKFLOWS.md §3 (Login): creates the session record and
   * enforces the concurrent-session cap by revoking the oldest active
   * session(s) beyond the limit — never silently exceeding it.
   */
  async createForLogin(params: {
    userId: string;
    roleNames: string[];
    userAgent?: string;
    ipAddress?: string;
    deviceLabel?: string;
  }): Promise<UserSession> {
    const active = await this.sessionsRepository.findActiveByUserId(params.userId);
    const limit = SessionsService.isAdminCapable(params.roleNames)
      ? CONCURRENT_SESSION_LIMIT.adminCapable
      : CONCURRENT_SESSION_LIMIT.learner;

    if (active.length >= limit) {
      const toRevoke = active.slice(limit - 1);
      await Promise.all(toRevoke.map((s) => this.sessionsRepository.revoke(s.id)));
    }

    return this.sessionsRepository.create({
      user: { connect: { id: params.userId } },
      userAgent: params.userAgent,
      ipAddress: params.ipAddress,
      deviceLabel: params.deviceLabel,
      lastActiveAt: new Date(),
      expiresAt: SessionsService.computeExpiry(params.roleNames),
    });
  }

  revoke(sessionId: string): Promise<UserSession> {
    return this.sessionsRepository.revoke(sessionId);
  }

  revokeAllForUser(userId: string) {
    return this.sessionsRepository.revokeAllForUser(userId);
  }

  /** docs/16-API-CONTRACT.md POST /users/me/change-password: "revokes other sessions" — the caller's own session survives. */
  findActiveByUserIdExcept(userId: string, exceptSessionId: string): Promise<UserSession[]> {
    return this.sessionsRepository.findActiveByUserIdExcept(userId, exceptSessionId);
  }

  revokeAllForUserExcept(userId: string, exceptSessionId: string) {
    return this.sessionsRepository.revokeAllForUserExcept(userId, exceptSessionId);
  }

  findById(id: string): Promise<UserSession | null> {
    return this.sessionsRepository.findById(id);
  }

  touchLastActive(id: string): Promise<UserSession> {
    return this.sessionsRepository.touchLastActive(id);
  }
}
