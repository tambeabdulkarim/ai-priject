import type { ListProductsQuery, MarketplaceCategoryNode, PaginatedResponse, ProductRecord } from '@phoenix/types';
import type { RequestFn } from '../core/request';

/**
 * docs/16-API-CONTRACT.md §10 (Marketplace) — Products + Categories, both
 * `@Public()`. `getCategoryTree` returns the full SHARED Category tree
 * (courses/library/marketplace all mixed) — see
 * packages/types/src/marketplace.ts's header comment; callers filter by
 * `domain === 'marketplace'` themselves.
 */
export function createMarketplaceResource(request: RequestFn) {
  return {
    listProducts: (query: ListProductsQuery = {}) =>
      request<PaginatedResponse<ProductRecord>>({
        method: 'GET',
        path: '/marketplace/products',
        query: {
          cursor: query.cursor,
          limit: query.limit,
          category: query.category,
          minPriceCents: query.minPriceCents,
          maxPriceCents: query.maxPriceCents,
          q: query.q,
        },
      }),

    getProductBySlug: (slug: string) =>
      request<ProductRecord>({ method: 'GET', path: `/marketplace/products/${slug}` }),

    getCategoryTree: () => request<MarketplaceCategoryNode[]>({ method: 'GET', path: '/marketplace/categories' }),
  };
}

export type MarketplaceResource = ReturnType<typeof createMarketplaceResource>;
