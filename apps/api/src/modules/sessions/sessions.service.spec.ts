import { SessionsService } from './sessions.service';

describe('SessionsService', () => {
  const makeService = () => {
    const sessionsRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findActiveByUserId: jest.fn(),
      touchLastActive: jest.fn(),
      revoke: jest.fn(),
      revokeAllForUser: jest.fn(),
    };
    const service = new SessionsService(sessionsRepository as never);
    return { service, sessionsRepository };
  };

  it('computes a short (12h) expiry for admin-capable roles', () => {
    const expiry = SessionsService.computeExpiry(['admin']);
    const hours = (expiry.getTime() - Date.now()) / (60 * 60 * 1000);
    expect(hours).toBeCloseTo(12, 0);
  });

  it('computes a long (30 day) expiry for learner-only roles', () => {
    const expiry = SessionsService.computeExpiry(['learner']);
    const days = (expiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(days).toBeCloseTo(30, 0);
  });

  it('revokes the oldest sessions beyond the admin-capable concurrent-session cap', async () => {
    const { service, sessionsRepository } = makeService();
    const active = [{ id: 's1' }, { id: 's2' }, { id: 's3' }];
    sessionsRepository.findActiveByUserId.mockResolvedValue(active);
    sessionsRepository.create.mockResolvedValue({ id: 's4' });

    await service.createForLogin({ userId: 'u1', roleNames: ['admin'] });

    expect(sessionsRepository.revoke).toHaveBeenCalled();
    expect(sessionsRepository.create).toHaveBeenCalled();
  });
});
