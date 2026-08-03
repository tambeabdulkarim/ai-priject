import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { ListLibraryItemsQuery } from '@phoenix/types';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/** docs/16-API-CONTRACT.md GET /library/items — cursor-paginated public catalogue, published items only (server-enforced). */
export function useLibraryList(query: Omit<ListLibraryItemsQuery, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.library.list(query),
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const result = await apiClient.library.list({ ...query, cursor: pageParam });
      if (result.error) throw result.error;
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/** docs/16-API-CONTRACT.md GET /library/items/:slug */
export function useLibraryItem(slug: string) {
  return useQuery({
    queryKey: queryKeys.library.detail(slug),
    queryFn: async () => {
      const result = await apiClient.library.getBySlug(slug);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: slug.length > 0,
  });
}
