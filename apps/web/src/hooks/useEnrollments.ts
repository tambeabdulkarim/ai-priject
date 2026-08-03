import { useQuery } from '@tanstack/react-query';
import type { ListEnrollmentsQuery } from '@phoenix/types';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/** docs/16-API-CONTRACT.md GET /enrollments/me */
export function useEnrollmentsList(query: Omit<ListEnrollmentsQuery, 'cursor'> = {}) {
  return useQuery({
    queryKey: queryKeys.enrollments.list(query),
    queryFn: async () => {
      const result = await apiClient.enrollments.listMine(query);
      if (result.error) throw result.error;
      return result.data;
    },
  });
}

/** docs/16-API-CONTRACT.md GET /enrollments/:id */
export function useEnrollment(id: string) {
  return useQuery({
    queryKey: queryKeys.enrollments.detail(id),
    queryFn: async () => {
      const result = await apiClient.enrollments.getById(id);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: id.length > 0,
  });
}
