import { UsersService } from './users.service';

// Focused on the MFA-related behavior added in Phase 14.2 — the rest of
// UsersService (profile update, role assignment, password change) is
// pre-existing and out of this phase's scope to newly test.
describe('UsersService — MFA-related behavior (Phase 14.2)', () => {
  const baseUser = {
    id: 'u1',
    email: 'a@b.com',
    passwordHash: 'argon2-hash',
    mfaSecret: 'iv:tag:ciphertext',
    mfaEnabled: true,
    emailVerifiedAt: new Date(),
    status: 'active',
    locale: 'ar',
    createdAt: new Date(),
  };

  const makeService = () => {
    const usersRepository = {
      findById: jest.fn().mockResolvedValue(baseUser),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn().mockResolvedValue(baseUser),
      findMany: jest.fn(),
    };
    const passwordService = { hash: jest.fn(), verify: jest.fn() };
    const breachedPasswordService = { isBreached: jest.fn() };
    const auditLogService = { record: jest.fn() };
    const rolesService = { getRoleNamesForUser: jest.fn().mockResolvedValue(['learner']) };
    const sessionsService = {
      findActiveByUserIdExcept: jest.fn(),
      revokeAllForUserExcept: jest.fn(),
    };
    const refreshTokensService = { revokeAllForSession: jest.fn() };

    const service = new UsersService(
      usersRepository as never,
      passwordService as never,
      breachedPasswordService as never,
      auditLogService as never,
      rolesService as never,
      sessionsService as never,
      refreshTokensService as never,
    );

    return { service, usersRepository };
  };

  it('getMeView exposes mfaEnabled but never the raw mfaSecret', async () => {
    const { service } = makeService();

    const view = await service.getMeView('u1');

    expect(view.mfaEnabled).toBe(true);
    expect(view).not.toHaveProperty('mfaSecret');
  });

  it('getSafeById (SafeUser) strips mfaSecret exactly like it strips passwordHash', async () => {
    const { service } = makeService();

    const safe = await service.getSafeById('u1');

    expect(safe).not.toHaveProperty('mfaSecret');
    expect(safe).not.toHaveProperty('passwordHash');
    // Confirms this isn't accidentally stripping mfaEnabled too — that's a
    // legitimate, safe-to-expose boolean, only the secret itself is sensitive.
    expect(safe.mfaEnabled).toBe(true);
  });

  it('setMfaSecret persists only mfaSecret, without touching mfaEnabled', async () => {
    const { service, usersRepository } = makeService();

    await service.setMfaSecret('u1', 'new-encrypted-value');

    expect(usersRepository.update).toHaveBeenCalledWith('u1', { mfaSecret: 'new-encrypted-value' });
  });

  it('disableMfa clears both mfaEnabled and mfaSecret together (never leaves a stale secret behind)', async () => {
    const { service, usersRepository } = makeService();

    await service.disableMfa('u1');

    expect(usersRepository.update).toHaveBeenCalledWith('u1', {
      mfaEnabled: false,
      mfaSecret: null,
    });
  });
});
