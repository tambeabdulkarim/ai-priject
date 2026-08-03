// docs/16-API-CONTRACT.md §18 (Administration) — GET /admin/analytics/overview.
// Verified against apps/api/src/modules/admin/{analytics.service.ts,
// analytics.repository.ts,dto/analytics-overview-query.dto.ts}.
//
// This is a single flat overview object — no breakdown/segmentation
// endpoint exists anywhere in the backend (verified: grepping the whole
// `src` tree for "analytics" only hits these admin-module files). The
// response is hand-built snake_case (unlike Users/Settings, which are
// raw camelCase Prisma shapes) — verified field-by-field, not assumed
// uniform with the rest of the Admin workspace.

export interface AnalyticsOverviewQuery {
  /** Both required — the endpoint throws 400 if `from > to` (analytics.service.ts). ISO date strings. */
  from: string;
  to: string;
}

export interface AnalyticsOverview {
  from: string;
  to: string;
  revenue_cents: number;
  /** 0–100, rounded to 2 decimals; 0 when there are no enrollments in range. */
  completion_rate: number;
  /** Distinct active users on the `to` calendar day (UTC). */
  dau: number;
  /** Distinct active users in the trailing 30 days ending `to`. */
  mau: number;
}
