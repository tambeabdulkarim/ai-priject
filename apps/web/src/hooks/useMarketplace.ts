import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { ListProductsQuery, MarketplaceCategoryNode } from '@phoenix/types';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/** docs/16-API-CONTRACT.md GET /marketplace/products — `@Public()`, cursor-paginated, filters by category/price/q. `q` is a plain Postgres `ILIKE` substring match, not a search index (see packages/types/src/marketplace.ts's header comment). */
export function useProductsList(query: Omit<ListProductsQuery, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.marketplace.products.list(query),
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const result = await apiClient.marketplace.listProducts({ ...query, cursor: pageParam });
      if (result.error) throw result.error;
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/** docs/16-API-CONTRACT.md GET /marketplace/products/:slug — `@Public()`, only `status: 'published'` products are ever returned (404 otherwise, including for a real-but-unpublished/draft product). */
export function useProduct(slug: string) {
  return useQuery({
    queryKey: queryKeys.marketplace.products.detail(slug),
    queryFn: async () => {
      const result = await apiClient.marketplace.getProductBySlug(slug);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: slug.length > 0,
  });
}

function filterMarketplaceDomain(nodes: MarketplaceCategoryNode[]): MarketplaceCategoryNode[] {
  return nodes
    .filter((node) => node.domain === 'marketplace')
    .map((node) => ({ ...node, children: filterMarketplaceDomain(node.children) }));
}

/**
 * docs/16-API-CONTRACT.md GET /marketplace/categories — `@Public()`.
 * REAL BACKEND GAP: the endpoint returns the full SHARED Category tree
 * (courses/library/marketplace all mixed via a `domain` field) — it is
 * NOT filtered server-side. This hook applies the `domain ===
 * 'marketplace'` filter recursively client-side over the real response;
 * it does not call a marketplace-specific endpoint that doesn't exist.
 */
export function useMarketplaceCategories() {
  return useQuery({
    queryKey: queryKeys.marketplace.categories(),
    queryFn: async () => {
      const result = await apiClient.marketplace.getCategoryTree();
      if (result.error) throw result.error;
      return filterMarketplaceDomain(result.data);
    },
  });
}
