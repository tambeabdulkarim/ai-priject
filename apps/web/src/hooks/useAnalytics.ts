import { useQuery } from '@tanstack/react-query';
import type { AnalyticsOverviewQuery } from '@phoenix/types';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/** docs/16-API-CONTRACT.md GET /admin/analytics/overview — `analytics:read` (admin/superadmin). A single flat overview object (revenue/completion/DAU/MAU) — no breakdown/segmentation endpoint exists in the real backend, so no such option is offered here. */
export function useAnalyticsOverview(query: AnalyticsOverviewQuery) {
  return useQuery({
    queryKey: queryKeys.admin.analyticsOverview(query as unknown as Record<string, unknown>),
    queryFn: async () => {
      const result = await apiClient.admin.getAnalyticsOverview(query);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: Boolean(query.from && query.to),
  });
}
