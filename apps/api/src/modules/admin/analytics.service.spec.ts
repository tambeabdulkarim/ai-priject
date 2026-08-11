import { BadRequestException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  const makeService = () => {
    const analyticsRepository = {
      sumSucceededRevenueCents: jest.fn().mockResolvedValue(0),
      countEnrollmentsInRange: jest.fn().mockResolvedValue(0),
      countCompletedEnrollmentsInRange: jest.fn().mockResolvedValue(0),
      countDistinctActiveUsers: jest.fn().mockResolvedValue(0),
    };
    const service = new AnalyticsService(analyticsRepository as never);
    return { service, analyticsRepository };
  };

  it('throws 400 when from is after to', async () => {
    const { service } = makeService();

    await expect(
      service.getOverview({ from: '2026-02-01', to: '2026-01-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('computes completion_rate as completed/total over the range', async () => {
    const { service, analyticsRepository } = makeService();
    analyticsRepository.countEnrollmentsInRange.mockResolvedValue(4);
    analyticsRepository.countCompletedEnrollmentsInRange.mockResolvedValue(1);

    const result = await service.getOverview({ from: '2026-01-01', to: '2026-01-31' });

    expect(result.completion_rate).toBe(25);
  });

  it('returns 0 completion_rate when there are no enrollments in range (avoids division by zero)', async () => {
    const { service, analyticsRepository } = makeService();
    analyticsRepository.countEnrollmentsInRange.mockResolvedValue(0);

    const result = await service.getOverview({ from: '2026-01-01', to: '2026-01-31' });

    expect(result.completion_rate).toBe(0);
  });

  it('passes revenue straight through from the repository', async () => {
    const { service, analyticsRepository } = makeService();
    analyticsRepository.sumSucceededRevenueCents.mockResolvedValue(125_000);

    const result = await service.getOverview({ from: '2026-01-01', to: '2026-01-31' });

    expect(result.revenue_cents).toBe(125_000);
  });

  it('queries DAU for the to-date calendar day and MAU for the trailing 30 days ending on to', async () => {
    const { service, analyticsRepository } = makeService();

    await service.getOverview({ from: '2026-01-01', to: '2026-01-31' });

    expect(analyticsRepository.countDistinctActiveUsers).toHaveBeenCalledTimes(2);
    const [dauCall, mauCall] = analyticsRepository.countDistinctActiveUsers.mock.calls;
    const [dauFrom, dauTo] = dauCall as [Date, Date];
    const [mauFrom, mauTo] = mauCall as [Date, Date];

    expect(dauTo.getTime() - dauFrom.getTime()).toBeLessThan(24 * 60 * 60 * 1000);
    expect(mauTo.getTime() - mauFrom.getTime()).toBeGreaterThan(29 * 24 * 60 * 60 * 1000 - 1000);
  });
});
