import { ForbiddenException, NotFoundException, NotImplementedException } from '@nestjs/common';
import { AiService } from './ai.service';

describe('AiService', () => {
  const makeService = () => {
    const aiRepository = {
      findRequestById: jest.fn(),
      findCurrentUsage: jest.fn(),
    };
    const service = new AiService(aiRepository as never);
    return { service, aiRepository };
  };

  describe('createRequest', () => {
    it('is BLOCKED BY DOCUMENTATION — throws NotImplementedException', () => {
      const { service } = makeService();
      expect(() => service.createRequest()).toThrow(NotImplementedException);
    });
  });

  describe('getRequestById', () => {
    it('throws 404 for a nonexistent request', async () => {
      const { service, aiRepository } = makeService();
      aiRepository.findRequestById.mockResolvedValue(null);

      await expect(service.getRequestById('r1', 'u1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws 403 when the request belongs to a different user', async () => {
      const { service, aiRepository } = makeService();
      aiRepository.findRequestById.mockResolvedValue({ id: 'r1', userId: 'owner1' });

      await expect(service.getRequestById('r1', 'someone-else')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('returns the request for its owner', async () => {
      const { service, aiRepository } = makeService();
      aiRepository.findRequestById.mockResolvedValue({ id: 'r1', userId: 'u1', feature: 'chat' });

      const result = await service.getRequestById('r1', 'u1');

      expect(result.feature).toBe('chat');
    });
  });

  describe('getMyUsage', () => {
    it('returns a real zero state when no AI_Usage row exists for the current period', async () => {
      const { service, aiRepository } = makeService();
      aiRepository.findCurrentUsage.mockResolvedValue(null);

      const result = await service.getMyUsage('u1');

      expect(result).toEqual({
        periodStart: null,
        periodEnd: null,
        requestsUsed: 0,
        tokensUsed: 0,
        quotaLimit: null,
      });
    });

    it('returns the existing usage row when one exists for the current period', async () => {
      const { service, aiRepository } = makeService();
      const periodStart = new Date('2026-08-01');
      const periodEnd = new Date('2026-08-31');
      aiRepository.findCurrentUsage.mockResolvedValue({
        periodStart,
        periodEnd,
        requestsUsed: 5,
        tokensUsed: 1000,
        quotaLimit: 100,
      });

      const result = await service.getMyUsage('u1');

      expect(result).toEqual({
        periodStart,
        periodEnd,
        requestsUsed: 5,
        tokensUsed: 1000,
        quotaLimit: 100,
      });
    });
  });
});
