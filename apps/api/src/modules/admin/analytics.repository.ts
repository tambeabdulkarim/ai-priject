// docs/16-API-CONTRACT.md GET /admin/analytics/overview.
//
// docs/09-PLATFORM-ARCHITECTURE.md §7: "admin analytics run against a read
// replica, never the primary". This environment provisions a single Neon
// Postgres instance with no read replica (the same infra gap already
// documented for object storage and background workers in prior phases) —
// these queries run against the only connection that exists (the primary,
// via PrismaService). Not a workaround, not invented: it is the honest
// consequence of the undocumented/unprovisioned replica infrastructure.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async sumSucceededRevenueCents(from: Date, to: Date): Promise<number> {
    const result = await this.prisma.payment.aggregate({
      where: { status: 'succeeded', paidAt: { gte: from, lte: to } },
      _sum: { amountCents: true },
    });
    return result._sum.amountCents ?? 0;
  }

  async countEnrollmentsInRange(from: Date, to: Date): Promise<number> {
    return this.prisma.enrollment.count({ where: { enrolledAt: { gte: from, lte: to } } });
  }

  async countCompletedEnrollmentsInRange(from: Date, to: Date): Promise<number> {
    return this.prisma.enrollment.count({
      where: { enrolledAt: { gte: from, lte: to }, completedAt: { not: null } },
    });
  }

  async countDistinctActiveUsers(from: Date, to: Date): Promise<number> {
    const rows = await this.prisma.userSession.findMany({
      where: { lastActiveAt: { gte: from, lte: to } },
      distinct: ['userId'],
      select: { userId: true },
    });
    return rows.length;
  }
}
