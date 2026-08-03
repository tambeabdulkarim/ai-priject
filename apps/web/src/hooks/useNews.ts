import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { ListNewsQuery } from '@phoenix/types';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/** docs/16-API-CONTRACT.md GET /news — cursor-paginated public list. */
export function useNewsList(query: Omit<ListNewsQuery, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.news.list(query),
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const result = await apiClient.news.list({ ...query, cursor: pageParam });
      if (result.error) throw result.error;
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/** docs/16-API-CONTRACT.md GET /news/:slug */
export function useNewsArticle(slug: string) {
  return useQuery({
    queryKey: queryKeys.news.detail(slug),
    queryFn: async () => {
      const result = await apiClient.news.getBySlug(slug);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: slug.length > 0,
  });
}
