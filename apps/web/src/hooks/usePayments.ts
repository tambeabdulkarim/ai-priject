import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/** docs/16-API-CONTRACT.md GET /payments/:id — owner-of-parent-order or admin/support/superadmin. */
export function usePayment(id: string) {
  return useQuery({
    queryKey: queryKeys.payments.detail(id),
    queryFn: async () => {
      const result = await apiClient.payments.getById(id);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: id.length > 0,
  });
}
