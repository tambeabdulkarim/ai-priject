import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { ListCoursesQuery } from '@phoenix/types';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/** docs/16-API-CONTRACT.md GET /courses — cursor-paginated public catalogue. */
export function useCoursesList(query: Omit<ListCoursesQuery, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.courses.list(query),
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const result = await apiClient.courses.list({ ...query, cursor: pageParam });
      if (result.error) throw result.error;
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/** docs/16-API-CONTRACT.md GET /courses/:slug — draft visibility and lesson-body redaction are entirely server-side (see packages/api-client/src/resources/courses.ts). */
export function useCourse(slug: string) {
  return useQuery({
    queryKey: queryKeys.courses.detail(slug),
    queryFn: async () => {
      const result = await apiClient.courses.getBySlug(slug);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: slug.length > 0,
  });
}
