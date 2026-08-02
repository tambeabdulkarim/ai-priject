import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService.login', () => {
  const makeService = (overrides: { user?: unknown; passwordValid?: boolean } = {}) => {
    const usersService = {
      findByEmail: jest.fn().mockResolvedValue(overrides.user ?? null),
      createUser: jest.fn(),
      markEmailVerified: jest.fn(),
      setPasswordHash: jest.fn(),
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
      issue: jest
        .fn()
        .mockResolvedValue({ raw: 'raw-refresh', record: { expiresAt: new Date() } }),
      revokeAllForSession: jest.fn(),
    };
    const passwordService = {
      hash: jest.fn(),
      verify: jest.fn().mockResolvedValue(overrides.passwordValid ?? false),
    };
    const breachedPasswordService = { isBreached: jest.fn().mockResolvedValue(false) };
    const auditLogService = { record: jest.fn() };
    const redisService = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
    const jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token'), verify: jest.fn() };
    const configService = { get: jest.fn().mockReturnValue({ issuer: 'phoenix-platform' }) };

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
    );

    return { service, usersService, passwordService, breachedPasswordService, auditLogService };
  };

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
      user: { id: 'u1', email: 'a@b.com', passwordHash: 'hash', status: 'suspended', locale: 'ar' },
      passwordValid: true,
    });

    await expect(service.login({ email: 'a@b.com', password: 'correct-pw' }, {})).rejects.toThrow(
      'Account is suspended.',
    );
  });

  it('succeeds for a correct password on an active account and returns tokens + roles', async () => {
    const { service } = makeService({
      user: { id: 'u1', email: 'a@b.com', passwordHash: 'hash', status: 'active', locale: 'ar' },
      passwordValid: true,
    });

    const result = await service.login({ email: 'a@b.com', password: 'correct-pw' }, {});

    expect(result.accessToken).toBe('signed.jwt.token');
    expect(result.refreshToken).toBe('raw-refresh');
    expect(result.user).toEqual({ id: 'u1', email: 'a@b.com', roles: ['learner'], locale: 'ar' });
  });
});
