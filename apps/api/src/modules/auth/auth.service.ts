// docs/15-SYSTEM-WORKFLOWS.md workflows 1-6 (Register, Verify Email, Login,
// Refresh, Logout, Forgot/Reset Password) and docs/10-SECURITY-BIBLE.md §2
// (account-enumeration prevention), §4 (password policy), §6 (session
// rotation/reuse detection).
//
// BLOCKED (see docs/13-DATABASE-BLUEPRINT.md — no table exists for these):
//  - Email/SMS delivery of verification and reset links: no email-provider
//    credentials exist in .env/.env.example (only Storage/Stripe/AI keys
//    are provisioned). Tokens are generated and logged; actual delivery is
//    a separate, explicitly out-of-scope integration.
//  - OAuth login (docs/10-SECURITY-BIBLE.md §2 "OAuth... converge on the
//    same internal identity record"): no OAuth-identity table exists in
//    docs/13-DATABASE-BLUEPRINT.md to link a provider account to a Users
//    row. oauthCallback remains NotImplemented.
//  - MFA (docs/10-SECURITY-BIBLE.md §5, TOTP): no column/table stores a
//    TOTP secret or recovery codes anywhere in docs/13-DATABASE-BLUEPRINT.md.
//    LoginDto.mfaCode is accepted but never checked — no user can have MFA
//    enabled given the current schema, so this is inert rather than a
//    security gap.

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { AppConfig } from '../../config/configuration';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PasswordService } from '../../common/services/password.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { RedisService } from '../../redis/redis.service';
import { RolesService, DEFAULT_REGISTRATION_ROLE } from '../roles/roles.service';
import { SessionsService } from '../sessions/sessions.service';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

interface PurposeTokenPayload {
  sub: string;
  type: 'email_verification' | 'password_reset';
  jti: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

const EMAIL_VERIFICATION_TTL_SECONDS = 24 * 60 * 60;
// docs/10-SECURITY-BIBLE.md §4: "Password-reset tokens expire in 15 minutes."
const PASSWORD_RESET_TTL_SECONDS = 15 * 60;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly sessionsService: SessionsService,
    private readonly refreshTokensService: RefreshTokensService,
    private readonly passwordService: PasswordService,
    private readonly auditLogService: AuditLogService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  /** docs/15-SYSTEM-WORKFLOWS.md §1 (Register). */
  async register(dto: RegisterDto, meta: RequestMeta): Promise<{ message: string }> {
    const existing = await this.usersService.findByEmail(dto.email);

    // docs/10-SECURITY-BIBLE.md §2: identical response whether or not the
    // email already exists — only the internal branch differs.
    if (existing) {
      this.logger.warn(`Registration attempted for an existing email (${meta.ipAddress ?? 'unknown ip'}).`);
      return { message: 'If this email is available, a verification link has been sent.' };
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const user = await this.usersService.createUser({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
      locale: dto.locale ?? 'ar',
      status: 'active',
    });

    const learnerRoleId = await this.rolesService.findRoleIdByName(DEFAULT_REGISTRATION_ROLE);
    if (learnerRoleId) {
      await this.rolesService.assignRolesToUser(user.id, [learnerRoleId], null);
    } else {
      this.logger.error(
        `BLOCKED: default role "${DEFAULT_REGISTRATION_ROLE}" does not exist — Roles table has no seed data. User ${user.id} registered with no role assigned.`,
      );
    }

    await this.issueEmailVerificationToken(user.id, user.email);

    await this.auditLogService.record({
      actorUserId: user.id,
      action: 'user.registered',
      targetType: 'User',
      targetId: user.id,
      ipAddress: meta.ipAddress,
    });

    return { message: 'If this email is available, a verification link has been sent.' };
  }

  private async issueEmailVerificationToken(userId: string, email: string): Promise<void> {
    const jti = randomUUID();
    const token = this.signPurposeToken({ sub: userId, type: 'email_verification', jti }, EMAIL_VERIFICATION_TTL_SECONDS);
    await this.redisService.set(`email_verify:${userId}`, jti, EMAIL_VERIFICATION_TTL_SECONDS);
    // BLOCKED: no email provider configured — logged instead of delivered.
    this.logger.log(`Email verification token for ${email} (delivery BLOCKED — no email provider configured): ${token}`);
  }

  /** docs/15-SYSTEM-WORKFLOWS.md §2 (Verify Email). */
  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    const payload = this.verifyPurposeToken(dto.token, 'email_verification');
    const storedJti = await this.redisService.get(`email_verify:${payload.sub}`);

    if (!storedJti || storedJti !== payload.jti) {
      throw new UnauthorizedException('Verification token is invalid or has expired.');
    }

    await this.usersService.markEmailVerified(payload.sub);
    await this.redisService.del(`email_verify:${payload.sub}`);

    await this.auditLogService.record({
      actorUserId: payload.sub,
      action: 'user.email_verified',
      targetType: 'User',
      targetId: payload.sub,
    });

    return { message: 'Email verified.' };
  }

  /** docs/16-API-CONTRACT.md POST /auth/resend-verification — enumeration-safe. */
  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (user && !user.emailVerifiedAt) {
      await this.issueEmailVerificationToken(user.id, user.email);
    }
    return { message: 'If this email exists and is unverified, a new verification link has been sent.' };
  }

  /** docs/15-SYSTEM-WORKFLOWS.md §3 (Login). */
  async login(dto: LoginDto, meta: RequestMeta): Promise<AuthTokens & { user: { id: string; email: string; roles: string[]; locale: string } }> {
    const user = await this.usersService.findByEmail(dto.email);

    // docs/10-SECURITY-BIBLE.md §2: constant-shape verification whether or
    // not the account exists, to resist account-enumeration via timing.
    const hashToCheck = user?.passwordHash ?? '$argon2id$v=19$m=65536,t=3,p=4$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const passwordValid = await this.passwordService.verify(hashToCheck, dto.password).catch(() => false);

    if (!user || !passwordValid) {
      await this.auditLogService.record({
        action: 'user.login.failed',
        targetType: 'User',
        ipAddress: meta.ipAddress,
        afterState: { email: dto.email },
      });
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException(`Account is ${user.status}.`);
    }

    // mfaCode (dto.mfaCode) intentionally unchecked — BLOCKED, see file header.

    const roleNames = await this.rolesService.getRoleNamesForUser(user.id);
    const session = await this.sessionsService.createForLogin({
      userId: user.id,
      roleNames,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });
    const { raw: refreshToken, record } = await this.refreshTokensService.issue(
      user.id,
      session.id,
      session.expiresAt,
    );

    const accessToken = this.signAccessToken(user.id, session.id, roleNames);

    await this.auditLogService.record({
      actorUserId: user.id,
      action: 'user.login.success',
      targetType: 'User',
      targetId: user.id,
      ipAddress: meta.ipAddress,
    });

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt: record.expiresAt,
      user: { id: user.id, email: user.email, roles: roleNames, locale: user.locale },
    };
  }

  /** docs/15-SYSTEM-WORKFLOWS.md §4 (Refresh). */
  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    const { raw: refreshToken, record } = await this.refreshTokensService.rotate(rawRefreshToken);
    const session = await this.sessionsService.findById(record.sessionId);
    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Session has been revoked.');
    }

    const roleNames = await this.rolesService.getRoleNamesForUser(record.userId);
    await this.sessionsService.touchLastActive(session.id);
    const accessToken = this.signAccessToken(record.userId, session.id, roleNames);

    return { accessToken, refreshToken, refreshTokenExpiresAt: record.expiresAt };
  }

  /** docs/15-SYSTEM-WORKFLOWS.md §5 (Logout). */
  async logout(payload: JwtPayload): Promise<void> {
    await this.sessionsService.revoke(payload.sessionId);
    await this.refreshTokensService.revokeAllForSession(payload.sessionId, 'logout');
    await this.auditLogService.record({
      actorUserId: payload.sub,
      action: 'user.logout',
      targetType: 'UserSession',
      targetId: payload.sessionId,
    });
  }

  /** docs/16-API-CONTRACT.md POST /auth/logout-all. */
  async logoutAll(payload: JwtPayload): Promise<void> {
    const sessions = await this.sessionsService.findActiveByUserId(payload.sub);
    await this.sessionsService.revokeAllForUser(payload.sub);
    await Promise.all(
      sessions.map((s) => this.refreshTokensService.revokeAllForSession(s.id, 'logout_all')),
    );
    await this.auditLogService.record({
      actorUserId: payload.sub,
      action: 'user.logout_all',
      targetType: 'User',
      targetId: payload.sub,
    });
  }

  /** docs/15-SYSTEM-WORKFLOWS.md §6 (Forgot Password) — enumeration-safe. */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (user) {
      const jti = randomUUID();
      const token = this.signPurposeToken(
        { sub: user.id, type: 'password_reset', jti },
        PASSWORD_RESET_TTL_SECONDS,
      );
      // Overwriting the key invalidates any previously issued reset token
      // for this user — docs/10-SECURITY-BIBLE.md §4's single-active-token rule.
      await this.redisService.set(`pwd_reset:${user.id}`, jti, PASSWORD_RESET_TTL_SECONDS);
      this.logger.log(`Password reset token for ${email} (delivery BLOCKED — no email provider configured): ${token}`);
    }
    return { message: 'If this email exists, a password reset link has been sent.' };
  }

  /** docs/15-SYSTEM-WORKFLOWS.md §6 (Reset Password). */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const payload = this.verifyPurposeToken(dto.token, 'password_reset');
    const storedJti = await this.redisService.get(`pwd_reset:${payload.sub}`);

    if (!storedJti || storedJti !== payload.jti) {
      throw new UnauthorizedException('Reset token is invalid or has expired.');
    }

    const newHash = await this.passwordService.hash(dto.newPassword);
    await this.usersService.setPasswordHash(payload.sub, newHash);
    await this.redisService.del(`pwd_reset:${payload.sub}`);

    // Defense in depth: a password reset invalidates every existing session,
    // consistent with docs/10-SECURITY-BIBLE.md §6's theft-response pattern.
    const sessions = await this.sessionsService.findActiveByUserId(payload.sub);
    await this.sessionsService.revokeAllForUser(payload.sub);
    await Promise.all(
      sessions.map((s) => this.refreshTokensService.revokeAllForSession(s.id, 'password_reset')),
    );

    await this.auditLogService.record({
      actorUserId: payload.sub,
      action: 'user.password.reset',
      targetType: 'User',
      targetId: payload.sub,
    });

    return { message: 'Password has been reset.' };
  }

  private signAccessToken(userId: string, sessionId: string, roles: string[]): string {
    const payload: JwtPayload & { type: 'access' } = {
      sub: userId,
      sessionId,
      roles,
      type: 'access',
    };
    return this.jwtService.sign(payload);
  }

  private signPurposeToken(payload: PurposeTokenPayload, ttlSeconds: number): string {
    const jwtConfig = this.configService.get('jwt', { infer: true });
    return this.jwtService.sign(payload, { expiresIn: ttlSeconds, issuer: jwtConfig.issuer });
  }

  private verifyPurposeToken(token: string, expectedType: PurposeTokenPayload['type']): PurposeTokenPayload {
    let payload: PurposeTokenPayload;
    try {
      payload = this.jwtService.verify<PurposeTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Token is invalid or has expired.');
    }
    if (payload.type !== expectedType) {
      throw new UnauthorizedException('Token is invalid for this operation.');
    }
    return payload;
  }
}
