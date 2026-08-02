import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { RefreshTokensService } from './refresh-tokens.service';

describe('RefreshTokensService', () => {
  const makeService = () => {
    const refreshTokensRepository = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      markUsed: jest.fn(),
      revoke: jest.fn(),
      revokeAllForSession: jest.fn(),
    };
    const sessionsRepository = { revoke: jest.fn() };
    const service = new RefreshTokensService(
      refreshTokensRepository as never,
      sessionsRepository as never,
    );
    return { service, refreshTokensRepository, sessionsRepository };
  };

  it('rejects rotation for an unknown token', async () => {
    const { service, refreshTokensRepository } = makeService();
    refreshTokensRepository.findByTokenHash.mockResolvedValue(null);

    await expect(service.rotate('garbage-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects rotation for an expired token', async () => {
    const { service, refreshTokensRepository } = makeService();
    refreshTokensRepository.findByTokenHash.mockResolvedValue({
      id: 't1',
      sessionId: 's1',
      userId: 'u1',
      usedAt: null,
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(service.rotate('expired-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('treats reuse of an already-used token as theft and revokes the whole session family', async () => {
    const { service, refreshTokensRepository, sessionsRepository } = makeService();
    refreshTokensRepository.findByTokenHash.mockResolvedValue({
      id: 't1',
      sessionId: 's1',
      userId: 'u1',
      usedAt: new Date(),
      revokedAt: null,
      expiresAt: new Date(Date.now() + 100000),
    });

    await expect(service.rotate('reused-token')).rejects.toBeInstanceOf(ForbiddenException);
    expect(refreshTokensRepository.revokeAllForSession).toHaveBeenCalledWith('s1', 'reuse_detected');
    expect(sessionsRepository.revoke).toHaveBeenCalledWith('s1');
  });

  it('rotates a valid, unused token: marks it used and issues a new one chained to it', async () => {
    const { service, refreshTokensRepository } = makeService();
    const expiresAt = new Date(Date.now() + 100000);
    refreshTokensRepository.findByTokenHash.mockResolvedValue({
      id: 't1',
      sessionId: 's1',
      userId: 'u1',
      usedAt: null,
      revokedAt: null,
      expiresAt,
    });
    refreshTokensRepository.create.mockResolvedValue({ id: 't2', expiresAt });

    const result = await service.rotate('valid-token');

    expect(refreshTokensRepository.markUsed).toHaveBeenCalledWith('t1');
    expect(refreshTokensRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ previousToken: { connect: { id: 't1' } } }),
    );
    expect(result.raw).toBeDefined();
    expect(result.record).toEqual({ id: 't2', expiresAt });
  });
});
