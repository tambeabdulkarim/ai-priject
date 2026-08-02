import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PasswordService } from '../../common/services/password.service';
import { BreachedPasswordService } from '../../common/services/breached-password.service';
import { PaginatedResult } from '../../common/dto/pagination-query.dto';
import { RolesService } from '../roles/roles.service';
import { SessionsService } from '../sessions/sessions.service';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UsersRepository } from './users.repository';

export type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
    private readonly breachedPasswordService: BreachedPasswordService,
    private readonly auditLogService: AuditLogService,
    private readonly rolesService: RolesService,
    private readonly sessionsService: SessionsService,
    private readonly refreshTokensService: RefreshTokensService,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  /** Used by AuthService — registration is authentication business logic, not a Users-module concern. */
  createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.usersRepository.create(data);
  }

  /** Used by AuthService (email verification). */
  async markEmailVerified(userId: string): Promise<void> {
    await this.usersRepository.update(userId, { emailVerifiedAt: new Date() });
  }

  /** Used by AuthService (password reset — no currentPassword to verify, unlike ChangePasswordDto's flow). */
  async setPasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.usersRepository.update(userId, { passwordHash });
  }

  /**
   * docs/16-API-CONTRACT.md GET /users/:id — "full user record (admin
   * view, including status/role history summary)".
   *
   * Partially fixed during the Phase 13 final audit: this previously
   * returned the bare user row (minus passwordHash) with no roles at all,
   * even though the current role list is trivially available — exactly
   * what `getMeView` already resolves via `RolesService`. A full
   * chronological "role history" (who granted what, when) has no backing
   * table anywhere in docs/13-DATABASE-BLUEPRINT.md — `Role_Permissions`
   * models role→permission grants, not a per-user audit trail of role
   * assignment over time — so that specific piece remains unavailable;
   * only the current role list (the derivable part of "role history
   * summary") is added here.
   */
  async getSafeById(id: string): Promise<SafeUser & { roles: string[] }> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const roles = await this.rolesService.getRoleNamesForUser(id);
    return { ...this.toSafeUser(user), roles };
  }

  /**
   * docs/16-API-CONTRACT.md GET /users/me — the documented response is
   * exactly `id, email, email_verified, roles, status, locale, created_at`,
   * distinct from getSafeById's broader admin-view shape (used by
   * GET /users/:id, which doc16 explicitly scopes as "full user record").
   */
  async getMeView(id: string): Promise<{
    id: string;
    email: string;
    emailVerified: boolean;
    roles: string[];
    status: string;
    locale: string;
    createdAt: Date;
  }> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const roles = await this.rolesService.getRoleNamesForUser(id);
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerifiedAt !== null,
      roles,
      status: user.status,
      locale: user.locale,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, dto: UpdateMeDto): Promise<SafeUser> {
    const user = await this.usersRepository.update(userId, {
      ...(dto.locale ? { locale: dto.locale } : {}),
      ...(dto.timezone ? { timezone: dto.timezone } : {}),
    });
    return this.toSafeUser(user);
  }

  /**
   * docs/16-API-CONTRACT.md POST /users/me/change-password — "Validation
   * Rules: ... revokes other sessions." Mirrors AuthService.resetPassword's
   * session/refresh-token revocation, except the caller's own current
   * session (the one used to make this authenticated request) survives —
   * "other sessions", not all sessions.
   */
  async changePassword(userId: string, currentSessionId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.usersRepository.findById(userId);
    if (!user || !user.passwordHash) {
      throw new NotFoundException('User not found.');
    }

    const isValid = await this.passwordService.verify(user.passwordHash, dto.currentPassword);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    // docs/10-SECURITY-BIBLE.md §4: breached-password check "at
    // registration and password-change time". Fixed during the Phase 13
    // final audit alongside the same gap in AuthService.register.
    if (await this.breachedPasswordService.isBreached(dto.newPassword)) {
      throw new BadRequestException('This password has appeared in a known data breach — please choose another.');
    }

    const newHash = await this.passwordService.hash(dto.newPassword);
    await this.usersRepository.update(userId, { passwordHash: newHash });

    const otherSessions = await this.sessionsService.findActiveByUserIdExcept(userId, currentSessionId);
    await this.sessionsService.revokeAllForUserExcept(userId, currentSessionId);
    await Promise.all(
      otherSessions.map((s) => this.refreshTokensService.revokeAllForSession(s.id, 'password_changed')),
    );

    await this.auditLogService.record({
      actorUserId: userId,
      action: 'user.password.changed',
      targetType: 'User',
      targetId: userId,
    });
  }

  /** docs/16-API-CONTRACT.md GET /users — pagination, status filter, search. */
  async listUsers(query: ListUsersQueryDto): Promise<PaginatedResult<SafeUser>> {
    const result = await this.usersRepository.findMany({
      cursor: query.cursor,
      limit: query.limit,
      status: query.status,
      search: query.q,
      roleName: query.role,
    });
    return {
      items: result.items.map((u) => this.toSafeUser(u)),
      nextCursor: result.nextCursor,
    };
  }

  /** docs/16-API-CONTRACT.md PATCH /users/:id/status */
  async updateStatus(
    targetUserId: string,
    status: string,
    reason: string | undefined,
    actorUserId: string,
  ): Promise<SafeUser> {
    const before = await this.usersRepository.findById(targetUserId);
    if (!before) {
      throw new NotFoundException('User not found.');
    }

    const updated = await this.usersRepository.update(targetUserId, { status });

    await this.auditLogService.record({
      actorUserId,
      action: 'user.status.updated',
      targetType: 'User',
      targetId: targetUserId,
      beforeState: { status: before.status },
      afterState: { status, reason },
    });

    return this.toSafeUser(updated);
  }

  /** docs/16-API-CONTRACT.md PATCH /users/:id/roles — delegates to RolesService. */
  async updateRoles(
    targetUserId: string,
    roleIds: string[],
    actorUserId: string,
    actorRoleNames: string[],
  ): Promise<Role[]> {
    const target = await this.usersRepository.findById(targetUserId);
    if (!target) {
      throw new NotFoundException('User not found.');
    }
    if (roleIds.length === 0) {
      throw new BadRequestException('At least one role must remain assigned.');
    }
    return this.rolesService.assignRolesToUser(targetUserId, roleIds, actorUserId, actorRoleNames);
  }

  private toSafeUser(user: User): SafeUser {
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }
}
