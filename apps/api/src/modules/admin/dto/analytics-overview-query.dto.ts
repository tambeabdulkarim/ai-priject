// docs/16-API-CONTRACT.md GET /admin/analytics/overview — Request
// Parameters: date range. Both bounds are required: the endpoint has no
// documented default period, and inventing one (e.g. "last 30 days")
// would be an undocumented business decision.

import { IsDateString } from 'class-validator';

export class AnalyticsOverviewQueryDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;
}
