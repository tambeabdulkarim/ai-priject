// docs/15-SYSTEM-WORKFLOWS.md workflows 1-6 (Register, Verify Email, Login,
// Refresh, Logout, Forgot/Reset Password) and docs/10-SECURITY-BIBLE.md §2
// (account-enumeration prevention), §4 (password policy), §6 (session
// rotation/reuse detection).
//
// Email delivery (Phase 16): verification, password-reset, and MFA
// enable/disable/recovery-code-used notifications are now sent for real
// via EmailService (Postmark) — closes the "no email provider configured"
// Critical finding in docs/phase15-production-readiness-report.md. If
// POSTMARK_API_KEY/EMAIL_FROM_ADDRESS are unset (e.g. this dev
// environment), EmailService logs instead of sending — see its own file
// header for why these call sites deliberately never fail the underlying
// auth action just because the notification couldn't be delivered.
//
// Still BLOCKED (see docs/13-DATABASE-BLUEPRINT.md — no table exists for these):
//  - OAuth login (docs/10-SECURITY-BIBLE.md §2 "OAuth... converge on the
//    same internal identity record"): no OAuth-identity table exists in
//    docs/13-DATABASE-BLUEPRINT.md to link a provider account to a Users
//    row. oauthCallback remains NotImplemented.
//
// MFA (docs/10-SECURITY-BIBLE.md §5, TOTP) — implemented Phase 14.2.
// `LoginDto.mfaCode` (pre-existing, previously inert) is no longer used —
// see the two-step challenge/response flow below (`login`/
// `verifyMfaChallenge`) instead, chosen over an inline single-field
// approach precisely because the client can't know in advance whether an
// account has MFA enabled (see the Security Architecture Review's
// Architecture 1 vs. 2 comparison).

import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { User } from '@prisma/client';
import { AppConfig } from '../../config/configuration';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PasswordService } from '../../common/services/password.service';
import { BreachedPasswordService } from '../../common/services/breached-password.service';
import { MfaCryptoService } from '../../common/services/mfa-crypto.service';
import { EmailService } from '../../common/services/email.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { RedisService } from '../../redis/redis.service';
import { RolesService, DEFAULT_REGISTRATION_ROLE } from '../roles/roles.service';
import { SessionsService } from '../sessions/sessions.service';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service';
import { UsersService } from '../users/users.service';
import { MfaService } from './mfa.service';
import { MfaRecoveryCodesRepository } from './mfa-recovery-codes.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { MfaVerifyDto } from './dto/mfa-verify.dto';
import { MfaEnrollConfirmDto } from './dto/mfa-enroll-confirm.dto';

interface PurposeTokenPayload {
  sub: string;
  type: 'email_verification' | 'password_reset' | 'mfa_challenge';
  jti: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export type AuthenticatedLoginResult = AuthTokens & {
  user: { id: string; email: string; roles: string[]; locale: string };
};

export interface MfaChallengeResult {
  mfaRequired: true;
  challengeToken: string;
}

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

const EMAIL_VERIFICATION_TTL_SECONDS = 24 * 60 * 60;
// docs/10-SECURITY-BIBLE.md §4: "Password-reset tokens expire in 15 minutes."
const PASSWORD_RESET_TTL_SECONDS = 15 * 60;
// Short — this token only bridges "password verified" to "second factor
// verified"; there is no reason for it to outlive a normal user's time to
// find their authenticator app.
const MFA_CHALLENGE_TTL_SECONDS = 5 * 60;
const mfaChallengeKey = (userId: string): string => `mfa_challenge:${userId}`;

// docs/10-SECURITY-BIBLE.md §2: "progressive delays and temporary lockout
// after repeated failed attempts on a single account." No specific
// threshold/duration is given anywhere in the approved docs — this is a
// conservative operational default, same pattern as the concurrent-
// session-limit constant in SessionsService, not an architectural claim.
const FAILED_LOGIN_LOCKOUT_THRESHOLD = 5;
const FAILED_LOGIN_WINDOW_SECONDS = 15 * 60;
const failedLoginKey = (email: string): string => `login_fail:${email.toLowerCase()}`;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly sessionsService: SessionsService,
    private readonly refreshTokensService: RefreshTokensService,
    private readonly passwordService: PasswordService,
    private readonly breachedPasswordService: BreachedPasswordService,
    private readonly auditLogService: AuditLogService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly mfaService: MfaService,
    private readonly mfaCryptoService: MfaCryptoService,
    private readonly mfaRecoveryCodesRepository: MfaRecoveryCodesRepository,
    private readonly emailService: EmailService,
  ) {}

  /** docs/15-SYSTEM-WORKFLOWS.md §1 (Register). docs/16-API-CONTRACT.md POST /auth/register. */
  async register(
    dto: RegisterDto,
    meta: RequestMeta,
  ): Promise<{ userId: string; email: string; verificationRequired: true }> {
    const existing = await this.usersService.findByEmail(dto.email);

    // docs/10-SECURITY-BIBLE.md §2: identical response whether or not the
    // email already exists. docs/16-API-CONTRACT.md: "response shape
    // identical to success per enumeration prevention" — a random,
    // unlinked UUID is returned in place of the real (already-taken)
    // account's id, so the body is shape-identical without leaking the
    // existing account's real identifier.
    if (existing) {
      this.logger.warn(
        `Registration attempted for an existing email (${meta.ipAddress ?? 'unknown ip'}).`,
      );
      return { userId: randomUUID(), email: dto.email, verificationRequired: true };
    }

    // docs/16-API-CONTRACT.md POST /auth/register Validation Rules:
    // "breached-password check". Fixed during the Phase 13 final audit —
    // previously not implemented anywhere despite being unambiguously
    // required with the exact mechanism (HIBP range API) named.
    if (await this.breachedPasswordService.isBreached(dto.password)) {
      throw new BadRequestException(
        'This password has appeared in a known data breach — please choose another.',
      );
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

    return { userId: user.id, email: user.email, verificationRequired: true };
  }

  private async issueEmailVerificationToken(userId: string, email: string): Promise<void> {
    const jti = randomUUID();
    const token = this.signPurposeToken(
      { sub: userId, type: 'email_verification', jti },
      EMAIL_VERIFICATION_TTL_SECONDS,
    );
    await this.redisService.set(`email_verify:${userId}`, jti, EMAIL_VERIFICATION_TTL_SECONDS);
    await this.emailService.sendVerificationEmail(email, token);
  }

  /** docs/15-SYSTEM-WORKFLOWS.md §2 (Verify Email). docs/16-API-CONTRACT.md POST /auth/verify-email. */
  async verifyEmail(dto: VerifyEmailDto): Promise<{ verified: true }> {
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

    return { verified: true };
  }

  /** docs/16-API-CONTRACT.md POST /auth/resend-verification — enumeration-safe. */
  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (user && !user.emailVerifiedAt) {
      await this.issueEmailVerificationToken(user.id, user.email);
    }
    return {
      message: 'If this email exists and is unverified, a new verification link has been sent.',
    };
  }

  /**
   * docs/15-SYSTEM-WORKFLOWS.md §3 (Login). docs/16-API-CONTRACT.md
   * POST /auth/login: 423 (account locked) — docs/10-SECURITY-BIBLE.md
   * §2's "progressive delays and temporary lockout" requirement.
   */
  async login(
    dto: LoginDto,
    meta: RequestMeta,
  ): Promise<AuthenticatedLoginResult | MfaChallengeResult> {
    const failureKey = failedLoginKey(dto.email);
    const failureCountRaw = await this.redisService.get(failureKey);
    const failureCount = failureCountRaw ? parseInt(failureCountRaw, 10) : 0;
    if (failureCount >= FAILED_LOGIN_LOCKOUT_THRESHOLD) {
      throw new HttpException(
        'Account temporarily locked due to repeated failed login attempts.',
        423,
      );
    }

    const user = await this.usersService.findByEmail(dto.email);

    // docs/10-SECURITY-BIBLE.md §2: constant-shape verification whether or
    // not the account exists, to resist account-enumeration via timing.
    const hashToCheck =
      user?.passwordHash ??
      '$argon2id$v=19$m=65536,t=3,p=4$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const passwordValid = await this.passwordService
      .verify(hashToCheck, dto.password)
      .catch(() => false);

    if (!user || !passwordValid) {
      await this.redisService.set(
        failureKey,
        String(failureCount + 1),
        FAILED_LOGIN_WINDOW_SECONDS,
      );
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

    await this.redisService.del(failureKey);

    // docs/10-SECURITY-BIBLE.md §5 (Phase 14.2): password is verified —
    // if this account has MFA enabled, do NOT issue real tokens yet.
    // `LoginDto` no longer carries an inline `mfaCode` field at all (see
    // its own file header) — see the Security Architecture Review for
    // why the two-step challenge/response shape was chosen instead.
    if (user.mfaEnabled) {
      const challengeToken = await this.issueMfaChallengeToken(user.id);
      await this.auditLogService.record({
        actorUserId: user.id,
        action: 'user.login.mfa_challenge_issued',
        targetType: 'User',
        targetId: user.id,
        ipAddress: meta.ipAddress,
      });
      return { mfaRequired: true, challengeToken };
    }

    const roleNames = await this.rolesService.getRoleNamesForUser(user.id);
    return this.issueSessionAndRespond(user, roleNames, meta);
  }

  /**
   * docs/10-SECURITY-BIBLE.md §5 (Phase 14.2) — step 2 of the MFA
   * challenge/response flow. Reuses the exact purpose-token pattern
   * `email_verification`/`password_reset` already use (signed JWT +
   * independently-tracked Redis `jti`, making an otherwise-stateless JWT
   * single-use) rather than inventing a new mechanism.
   */
  async verifyMfaChallenge(
    dto: MfaVerifyDto,
    meta: RequestMeta,
  ): Promise<AuthenticatedLoginResult> {
    const payload = this.verifyPurposeToken(dto.challengeToken, 'mfa_challenge');
    const storedJti = await this.redisService.get(mfaChallengeKey(payload.sub));
    if (!storedJti || storedJti !== payload.jti) {
      throw new UnauthorizedException('Challenge token is invalid or has expired.');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      // Account state changed between challenge issuance and verification
      // (e.g. MFA was disabled from another session) — fail closed.
      throw new UnauthorizedException('MFA is not enabled for this account.');
    }

    const secret = this.mfaCryptoService.decrypt(user.mfaSecret);
    let usedRecoveryCode = false;
    let isValid = this.mfaService.verifyCode(secret, dto.code);

    if (!isValid) {
      const codeHash = this.mfaService.hashRecoveryCode(dto.code);
      const recoveryCode = await this.mfaRecoveryCodesRepository.findByCodeHash(codeHash);
      if (recoveryCode && recoveryCode.userId === user.id && !recoveryCode.usedAt) {
        await this.mfaRecoveryCodesRepository.markUsed(recoveryCode.id);
        isValid = true;
        usedRecoveryCode = true;
      }
    }

    if (!isValid) {
      await this.auditLogService.record({
        actorUserId: user.id,
        action: 'user.login.mfa_failed',
        targetType: 'User',
        targetId: user.id,
        ipAddress: meta.ipAddress,
      });
      throw new UnauthorizedException('Invalid code.');
    }

    // Single-use: the same challenge token cannot be replayed for a
    // second code attempt after success (matches the purpose-token
    // pattern's existing del-on-success behavior for email/password flows).
    await this.redisService.del(mfaChallengeKey(payload.sub));

    if (usedRecoveryCode) {
      await this.auditLogService.record({
        actorUserId: user.id,
        action: 'user.mfa.recovery_code_used',
        targetType: 'User',
        targetId: user.id,
        ipAddress: meta.ipAddress,
      });
      await this.emailService.sendMfaRecoveryCodeUsedEmail(user.email);
    }

    const roleNames = await this.rolesService.getRoleNamesForUser(user.id);
    return this.issueSessionAndRespond(user, roleNames, meta);
  }

  /**
   * Shared tail of both the no-MFA `login()` path and the post-challenge
   * `verifyMfaChallenge()` path — session creation, refresh-token
   * issuance, access-token signing, and the success audit log must stay
   * identical between the two, so this exists once rather than being
   * duplicated (engineering-standards §3).
   */
  private async issueSessionAndRespond(
    user: User,
    roleNames: string[],
    meta: RequestMeta,
  ): Promise<AuthenticatedLoginResult> {
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

  private async issueMfaChallengeToken(userId: string): Promise<string> {
    const jti = randomUUID();
    const token = this.signPurposeToken(
      { sub: userId, type: 'mfa_challenge', jti },
      MFA_CHALLENGE_TTL_SECONDS,
    );
    await this.redisService.set(mfaChallengeKey(userId), jti, MFA_CHALLENGE_TTL_SECONDS);
    return token;
  }

  /**
   * docs/10-SECURITY-BIBLE.md §5 — enrollment step 1: generate a secret,
   * store it (encrypted) but leave `mfaEnabled` false until a real code
   * is confirmed (`confirmMfaEnrollment`) — an abandoned enrollment must
   * never silently protect (or fail to protect) the account.
   */
  async beginMfaEnrollment(userId: string): Promise<{ secret: string; otpauthUri: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled on this account.');
    }

    const secret = this.mfaService.generateSecret();
    await this.usersService.setMfaSecret(userId, this.mfaCryptoService.encrypt(secret));

    return { secret, otpauthUri: this.mfaService.buildOtpauthUri(user.email, secret) };
  }

  /** docs/10-SECURITY-BIBLE.md §5 — enrollment step 2: confirm possession of a working authenticator before flipping mfaEnabled, then issue the one-time-visible recovery codes. */
  async confirmMfaEnrollment(
    userId: string,
    dto: MfaEnrollConfirmDto,
  ): Promise<{ recoveryCodes: string[] }> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.mfaSecret) {
      throw new BadRequestException(
        'No MFA enrollment in progress — call /auth/mfa/enroll/begin first.',
      );
    }
    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled on this account.');
    }

    const secret = this.mfaCryptoService.decrypt(user.mfaSecret);
    if (!this.mfaService.verifyCode(secret, dto.code)) {
      throw new UnauthorizedException('Invalid code.');
    }

    await this.usersService.setMfaEnabled(userId, true);
    const recoveryCodes = this.mfaService.generateRecoveryCodes();
    await this.mfaRecoveryCodesRepository.createMany(
      userId,
      recoveryCodes.map((code) => this.mfaService.hashRecoveryCode(code)),
    );

    // docs/10-SECURITY-BIBLE.md §5: "MFA enrollment ... logged as
    // security-sensitive events (§18) and trigger a notification to the
    // account's verified email." The audit log is real and unconditional;
    // the email is now real too (Phase 16 — see EmailService).
    await this.auditLogService.record({
      actorUserId: userId,
      action: 'user.mfa.enabled',
      targetType: 'User',
      targetId: userId,
    });
    await this.emailService.sendMfaEnabledEmail(user.email);

    return { recoveryCodes };
  }

  /** docs/10-SECURITY-BIBLE.md §5 — disabling MFA is a security-sensitive action; re-confirming the password (not just an authenticated session) matches this codebase's existing pattern for other sensitive account actions (ChangePasswordDto requires currentPassword). */
  async disableMfa(userId: string, password: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.passwordHash) {
      throw new NotFoundException('User not found.');
    }

    const passwordValid = await this.passwordService.verify(user.passwordHash, password);
    if (!passwordValid) {
      throw new UnauthorizedException('Incorrect password.');
    }

    await this.usersService.disableMfa(userId);
    await this.mfaRecoveryCodesRepository.deleteAllForUser(userId);

    await this.auditLogService.record({
      actorUserId: userId,
      action: 'user.mfa.disabled',
      targetType: 'User',
      targetId: userId,
    });
    await this.emailService.sendMfaDisabledEmail(user.email);
  }

  /** docs/10-SECURITY-BIBLE.md §5: "regenerating codes invalidates all previous codes." */
  async regenerateMfaRecoveryCodes(userId: string): Promise<{ recoveryCodes: string[] }> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled on this account.');
    }

    await this.mfaRecoveryCodesRepository.deleteAllForUser(userId);
    const recoveryCodes = this.mfaService.generateRecoveryCodes();
    await this.mfaRecoveryCodesRepository.createMany(
      userId,
      recoveryCodes.map((code) => this.mfaService.hashRecoveryCode(code)),
    );

    await this.auditLogService.record({
      actorUserId: userId,
      action: 'user.mfa.recovery_codes_regenerated',
      targetType: 'User',
      targetId: userId,
    });

    return { recoveryCodes };
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

  /** docs/16-API-CONTRACT.md POST /auth/logout-all — "Response Body: sessions_revoked: number". */
  async logoutAll(payload: JwtPayload): Promise<{ sessionsRevoked: number }> {
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
    return { sessionsRevoked: sessions.length };
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
      await this.emailService.sendPasswordResetEmail(email, token);
    }
    return { message: 'If this email exists, a password reset link has been sent.' };
  }

  /** docs/15-SYSTEM-WORKFLOWS.md §6 (Reset Password). docs/16-API-CONTRACT.md: "Response Body: success: true". */
  async resetPassword(dto: ResetPasswordDto): Promise<{ success: true }> {
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

    return { success: true };
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

  private verifyPurposeToken(
    token: string,
    expectedType: PurposeTokenPayload['type'],
  ): PurposeTokenPayload {
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
