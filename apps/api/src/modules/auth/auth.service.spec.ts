import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const makeService = (
    overrides: {
      user?: unknown;
      passwordValid?: boolean;
      mfaVerifyResult?: boolean;
      recoveryCode?: unknown;
      redisGet?: Record<string, string | null>;
    } = {},
  ) => {
    const usersService = {
      findByEmail: jest.fn().mockResolvedValue(overrides.user ?? null),
      findById: jest.fn().mockResolvedValue(overrides.user ?? null),
      createUser: jest.fn(),
      markEmailVerified: jest.fn(),
      setPasswordHash: jest.fn(),
      setMfaSecret: jest.fn(),
      setMfaEnabled: jest.fn(),
      disableMfa: jest.fn(),
    };
    const rolesService = {
      getRoleNamesForUser: jest.fn().mockResolvedValue(['learner']),
      findRoleIdByName: jest.fn(),
      assignRolesToUser: jest.fn(),
    };
    const sessionsService = {
      createForLogin: jest
        .fn()
        .mockResolvedValue({ id: 'session-1', expiresAt: new Date(Date.now() + 100000) }),
      findActiveByUserId: jest.fn(),
      revokeAllForUser: jest.fn(),
    };
    const refreshTokensService = {
      issue: jest.fn().mockResolvedValue({ raw: 'raw-refresh', record: { expiresAt: new Date() } }),
      revokeAllForSession: jest.fn(),
    };
    const passwordService = {
      hash: jest.fn(),
      verify: jest.fn().mockResolvedValue(overrides.passwordValid ?? false),
    };
    const breachedPasswordService = { isBreached: jest.fn().mockResolvedValue(false) };
    const auditLogService = { record: jest.fn() };
    const redisStore = overrides.redisGet ?? {};
    const redisService = {
      get: jest.fn().mockImplementation((key: string) => Promise.resolve(redisStore[key] ?? null)),
      set: jest.fn(),
      del: jest.fn(),
    };
    const jwtService = {
      sign: jest.fn().mockReturnValue('signed.jwt.token'),
      verify: jest
        .fn()
        .mockImplementation(() => ({ sub: 'u1', type: 'mfa_challenge', jti: 'jti-1' })),
    };
    const configService = { get: jest.fn().mockReturnValue({ issuer: 'phoenix-platform' }) };
    const mfaService = {
      generateSecret: jest.fn().mockReturnValue('BASE32SECRET'),
      buildOtpauthUri: jest.fn().mockReturnValue('otpauth://totp/...'),
      verifyCode: jest.fn().mockReturnValue(overrides.mfaVerifyResult ?? false),
      generateRecoveryCodes: jest.fn().mockReturnValue(['AAAAA-BBBBB']),
      hashRecoveryCode: jest.fn().mockReturnValue('hashed-code'),
    };
    const mfaCryptoService = {
      encrypt: jest.fn().mockReturnValue('iv:tag:ciphertext'),
      decrypt: jest.fn().mockReturnValue('BASE32SECRET'),
    };
    const mfaRecoveryCodesRepository = {
      createMany: jest.fn(),
      findUnusedByUser: jest.fn().mockResolvedValue([]),
      findByCodeHash: jest.fn().mockResolvedValue(overrides.recoveryCode ?? null),
      markUsed: jest.fn(),
      deleteAllForUser: jest.fn(),
    };
    const emailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(false),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(false),
      sendMfaEnabledEmail: jest.fn().mockResolvedValue(false),
      sendMfaDisabledEmail: jest.fn().mockResolvedValue(false),
      sendMfaRecoveryCodeUsedEmail: jest.fn().mockResolvedValue(false),
    };

    const service = new AuthService(
      usersService as never,
      rolesService as never,
      sessionsService as never,
      refreshTokensService as never,
      passwordService as never,
      breachedPasswordService as never,
      auditLogService as never,
      redisService as never,
      jwtService as never,
      configService as never,
      mfaService as never,
      mfaCryptoService as never,
      mfaRecoveryCodesRepository as never,
      emailService as never,
    );

    return {
      service,
      usersService,
      passwordService,
      breachedPasswordService,
      auditLogService,
      redisService,
      mfaService,
      mfaCryptoService,
      mfaRecoveryCodesRepository,
      emailService,
    };
  };

  describe('login', () => {
    it('rejects login with the same error for a nonexistent account (enumeration-safe)', async () => {
      const { service, auditLogService } = makeService({ user: null });

      await expect(
        service.login({ email: 'ghost@example.com', password: 'whatever12345' }, {}),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.login({ email: 'ghost@example.com', password: 'whatever12345' }, {}),
      ).rejects.toThrow('Invalid email or password.');
      expect(auditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user.login.failed' }),
      );
    });

    it('rejects login with the identical error message for a wrong password', async () => {
      const { service } = makeService({
        user: { id: 'u1', email: 'a@b.com', passwordHash: 'hash', status: 'active', locale: 'ar' },
        passwordValid: false,
      });

      await expect(
        service.login({ email: 'a@b.com', password: 'wrong-password' }, {}),
      ).rejects.toThrow('Invalid email or password.');
    });

    it('rejects login for a non-active account even with a correct password', async () => {
      const { service } = makeService({
        user: {
          id: 'u1',
          email: 'a@b.com',
          passwordHash: 'hash',
          status: 'suspended',
          locale: 'ar',
        },
        passwordValid: true,
      });

      await expect(service.login({ email: 'a@b.com', password: 'correct-pw' }, {})).rejects.toThrow(
        'Account is suspended.',
      );
    });

    it('succeeds for a correct password on an active account with MFA disabled (backward-compatible, unchanged path)', async () => {
      const { service } = makeService({
        user: {
          id: 'u1',
          email: 'a@b.com',
          passwordHash: 'hash',
          status: 'active',
          locale: 'ar',
          mfaEnabled: false,
        },
        passwordValid: true,
      });

      const result = await service.login({ email: 'a@b.com', password: 'correct-pw' }, {});

      if (!('accessToken' in result)) {
        throw new Error('Expected a token result, got an MFA challenge.');
      }
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.refreshToken).toBe('raw-refresh');
      expect(result.user).toEqual({ id: 'u1', email: 'a@b.com', roles: ['learner'], locale: 'ar' });
    });

    it('returns an MFA challenge instead of tokens when the account has MFA enabled', async () => {
      const { service, auditLogService } = makeService({
        user: {
          id: 'u1',
          email: 'admin@b.com',
          passwordHash: 'hash',
          status: 'active',
          locale: 'ar',
          mfaEnabled: true,
          mfaSecret: 'iv:tag:ciphertext',
        },
        passwordValid: true,
      });

      const result = await service.login({ email: 'admin@b.com', password: 'correct-pw' }, {});

      expect('mfaRequired' in result && result.mfaRequired).toBe(true);
      if (!('challengeToken' in result)) {
        throw new Error('Expected an MFA challenge result.');
      }
      expect(result.challengeToken).toBe('signed.jwt.token');
      expect(auditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user.login.mfa_challenge_issued' }),
      );
    });
  });

  describe('verifyMfaChallenge', () => {
    const mfaUser = {
      id: 'u1',
      email: 'admin@b.com',
      passwordHash: 'hash',
      status: 'active',
      locale: 'ar',
      mfaEnabled: true,
      mfaSecret: 'iv:tag:ciphertext',
    };

    it('issues real tokens for a correct TOTP code', async () => {
      const { service, redisService } = makeService({
        user: mfaUser,
        mfaVerifyResult: true,
        redisGet: { 'mfa_challenge:u1': 'jti-1' },
      });

      const result = await service.verifyMfaChallenge(
        { challengeToken: 'challenge.jwt', code: '123456' },
        {},
      );

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user.id).toBe('u1');
      // Single-use: the challenge jti must be deleted after a successful verify.
      expect(redisService.del).toHaveBeenCalledWith('mfa_challenge:u1');
    });

    it('rejects an invalid TOTP code and a non-matching recovery code, with no session issued', async () => {
      const { service, auditLogService } = makeService({
        user: mfaUser,
        mfaVerifyResult: false,
        recoveryCode: null,
        redisGet: { 'mfa_challenge:u1': 'jti-1' },
      });

      await expect(
        service.verifyMfaChallenge({ challengeToken: 'challenge.jwt', code: '000000' }, {}),
      ).rejects.toThrow('Invalid code.');
      expect(auditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user.login.mfa_failed' }),
      );
    });

    it('accepts a valid, unused recovery code as a fallback when the TOTP code is wrong, and marks it used', async () => {
      const { service, mfaRecoveryCodesRepository, auditLogService } = makeService({
        user: mfaUser,
        mfaVerifyResult: false,
        recoveryCode: { id: 'rc1', userId: 'u1', codeHash: 'hashed-code', usedAt: null },
        redisGet: { 'mfa_challenge:u1': 'jti-1' },
      });

      const result = await service.verifyMfaChallenge(
        { challengeToken: 'challenge.jwt', code: 'AAAAA-BBBBB' },
        {},
      );

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(mfaRecoveryCodesRepository.markUsed).toHaveBeenCalledWith('rc1');
      expect(auditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user.mfa.recovery_code_used' }),
      );
    });

    it('rejects an already-used recovery code', async () => {
      const { service } = makeService({
        user: mfaUser,
        mfaVerifyResult: false,
        recoveryCode: { id: 'rc1', userId: 'u1', codeHash: 'hashed-code', usedAt: new Date() },
        redisGet: { 'mfa_challenge:u1': 'jti-1' },
      });

      await expect(
        service.verifyMfaChallenge({ challengeToken: 'challenge.jwt', code: 'AAAAA-BBBBB' }, {}),
      ).rejects.toThrow('Invalid code.');
    });

    it('rejects a challenge token whose jti no longer matches Redis (expired/already consumed)', async () => {
      const { service } = makeService({
        user: mfaUser,
        mfaVerifyResult: true,
        redisGet: {}, // nothing stored — challenge already used or expired
      });

      await expect(
        service.verifyMfaChallenge({ challengeToken: 'challenge.jwt', code: '123456' }, {}),
      ).rejects.toThrow('Challenge token is invalid or has expired.');
    });

    it('fails closed if MFA was disabled between challenge issuance and verification', async () => {
      const { service } = makeService({
        user: { ...mfaUser, mfaEnabled: false, mfaSecret: null },
        mfaVerifyResult: true,
        redisGet: { 'mfa_challenge:u1': 'jti-1' },
      });

      await expect(
        service.verifyMfaChallenge({ challengeToken: 'challenge.jwt', code: '123456' }, {}),
      ).rejects.toThrow('MFA is not enabled for this account.');
    });
  });

  describe('MFA enrollment / disablement', () => {
    it('beginMfaEnrollment stores an encrypted secret without enabling MFA', async () => {
      const { service, usersService, mfaCryptoService } = makeService({
        user: { id: 'u1', email: 'a@b.com', mfaEnabled: false },
      });

      const result = await service.beginMfaEnrollment('u1');

      expect(result.secret).toBe('BASE32SECRET');
      expect(usersService.setMfaSecret).toHaveBeenCalledWith('u1', 'iv:tag:ciphertext');
      expect(usersService.setMfaEnabled).not.toHaveBeenCalled();
      expect(mfaCryptoService.encrypt).toHaveBeenCalledWith('BASE32SECRET');
    });

    it('beginMfaEnrollment rejects if MFA is already enabled', async () => {
      const { service } = makeService({ user: { id: 'u1', email: 'a@b.com', mfaEnabled: true } });

      await expect(service.beginMfaEnrollment('u1')).rejects.toThrow(BadRequestException);
    });

    it('beginMfaEnrollment rejects for a nonexistent user', async () => {
      const { service } = makeService({ user: null });

      await expect(service.beginMfaEnrollment('ghost')).rejects.toThrow(NotFoundException);
    });

    it('confirmMfaEnrollment enables MFA and returns recovery codes on a correct code', async () => {
      const { service, usersService, mfaRecoveryCodesRepository, auditLogService } = makeService({
        user: { id: 'u1', email: 'a@b.com', mfaEnabled: false, mfaSecret: 'iv:tag:ciphertext' },
        mfaVerifyResult: true,
      });

      const result = await service.confirmMfaEnrollment('u1', { code: '123456' });

      expect(result.recoveryCodes).toEqual(['AAAAA-BBBBB']);
      expect(usersService.setMfaEnabled).toHaveBeenCalledWith('u1', true);
      expect(mfaRecoveryCodesRepository.createMany).toHaveBeenCalledWith('u1', ['hashed-code']);
      expect(auditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user.mfa.enabled' }),
      );
    });

    it('confirmMfaEnrollment rejects a wrong code and does not enable MFA', async () => {
      const { service, usersService } = makeService({
        user: { id: 'u1', email: 'a@b.com', mfaEnabled: false, mfaSecret: 'iv:tag:ciphertext' },
        mfaVerifyResult: false,
      });

      await expect(service.confirmMfaEnrollment('u1', { code: '000000' })).rejects.toThrow(
        'Invalid code.',
      );
      expect(usersService.setMfaEnabled).not.toHaveBeenCalled();
    });

    it('confirmMfaEnrollment rejects if no enrollment is in progress', async () => {
      const { service } = makeService({
        user: { id: 'u1', email: 'a@b.com', mfaEnabled: false, mfaSecret: null },
      });

      await expect(service.confirmMfaEnrollment('u1', { code: '123456' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('disableMfa requires a correct password and clears MFA state + recovery codes', async () => {
      const { service, usersService, mfaRecoveryCodesRepository, auditLogService } = makeService({
        user: { id: 'u1', email: 'a@b.com', passwordHash: 'hash', mfaEnabled: true },
        passwordValid: true,
      });

      await service.disableMfa('u1', 'correct-pw');

      expect(usersService.disableMfa).toHaveBeenCalledWith('u1');
      expect(mfaRecoveryCodesRepository.deleteAllForUser).toHaveBeenCalledWith('u1');
      expect(auditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user.mfa.disabled' }),
      );
    });

    it('disableMfa rejects an incorrect password and makes no changes', async () => {
      const { service, usersService } = makeService({
        user: { id: 'u1', email: 'a@b.com', passwordHash: 'hash', mfaEnabled: true },
        passwordValid: false,
      });

      await expect(service.disableMfa('u1', 'wrong-pw')).rejects.toThrow(UnauthorizedException);
      expect(usersService.disableMfa).not.toHaveBeenCalled();
    });

    it('regenerateMfaRecoveryCodes rejects if MFA is not enabled', async () => {
      const { service } = makeService({ user: { id: 'u1', email: 'a@b.com', mfaEnabled: false } });

      await expect(service.regenerateMfaRecoveryCodes('u1')).rejects.toThrow(BadRequestException);
    });

    it('regenerateMfaRecoveryCodes replaces all existing codes when MFA is enabled', async () => {
      const { service, mfaRecoveryCodesRepository } = makeService({
        user: { id: 'u1', email: 'a@b.com', mfaEnabled: true },
      });

      const result = await service.regenerateMfaRecoveryCodes('u1');

      expect(result.recoveryCodes).toEqual(['AAAAA-BBBBB']);
      expect(mfaRecoveryCodesRepository.deleteAllForUser).toHaveBeenCalledWith('u1');
      expect(mfaRecoveryCodesRepository.createMany).toHaveBeenCalledWith('u1', ['hashed-code']);
    });
  });
});
