import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/** docs/16-API-CONTRACT.md GET /lessons/:id — entitlement-gated server-side; a 401/403 here is real (not enrolled / not authenticated), not a client-side guess. */
export function useLesson(id: string) {
  return useQuery({
    queryKey: queryKeys.lessons.detail(id),
    queryFn: async () => {
      const result = await apiClient.lessons.getContent(id);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: id.length > 0,
    retry: false, // a 401/403/404 here is a real, stable authorization/existence outcome, not a transient failure worth QueryProvider's default retry-on-5xx-only policy touching (it wouldn't retry a 4xx anyway, this is just explicit for clarity at the call site).
  });
}
