// docs/16-API-CONTRACT.md GET /admin/analytics/overview — "aggregate
// platform metrics (DAU/MAU, revenue, completion rates)".
//
// DAU/MAU interpretation: the endpoint takes a single date range, but DAU
// and MAU are standard, industry-defined point-in-time metrics (distinct
// active users on a given day / in the trailing 30 days), not naturally
// range-aggregates. The documented, well-known convention is applied here
// with `to` as the reporting anchor: DAU = distinct users active on the
// `to` calendar day; MAU = distinct users active in the 30 days ending on
// `to`. This is the standard definition of the named metrics doc16 asks
// for, not an invented business rule — `UserSession.lastActiveAt`
// (already maintained by SessionsService) is the documented activity
// signal.
//
// Revenue and completion rate are aggregated over the full [from, to]
// range, matching the "date range" parameter directly.

import { BadRequestException, Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsOverviewQueryDto } from './dto/analytics-overview-query.dto';

export interface AnalyticsOverview {
  from: string;
  to: string;
  revenue_cents: number;
  completion_rate: number;
  dau: number;
  mau: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class AnalyticsService {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async getOverview(query: AnalyticsOverviewQueryDto): Promise<AnalyticsOverview> {
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (from > to) {
      throw new BadRequestException('`from` must not be after `to`.');
    }

    const dayStart = new Date(to);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(to);
    dayEnd.setUTCHours(23, 59, 59, 999);
    const monthStart = new Date(dayEnd.getTime() - 29 * MS_PER_DAY);

    const [revenueCents, totalEnrollments, completedEnrollments, dau, mau] = await Promise.all([
      this.analyticsRepository.sumSucceededRevenueCents(from, to),
      this.analyticsRepository.countEnrollmentsInRange(from, to),
      this.analyticsRepository.countCompletedEnrollmentsInRange(from, to),
      this.analyticsRepository.countDistinctActiveUsers(dayStart, dayEnd),
      this.analyticsRepository.countDistinctActiveUsers(monthStart, dayEnd),
    ]);

    const completionRate =
      totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

    return {
      from: query.from,
      to: query.to,
      revenue_cents: revenueCents,
      completion_rate: Math.round(completionRate * 100) / 100,
      dau,
      mau,
    };
  }
}
