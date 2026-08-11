import type { LibraryItemSummary, ListLibraryItemsQuery, PaginatedResponse } from '@phoenix/types';
import type { RequestFn } from '../core/request';

/**
 * docs/16-API-CONTRACT.md §9 (Library) — public catalogue read endpoints
 * only (GET /library/items, GET /library/items/:slug), both `@Public()`
 * and unconditionally published-only server-side. The entitlement-gated
 * `POST /library/items/:id/access` (actual file download) is deliberately
 * NOT included here — it requires authentication and belongs to an
 * authenticated-library feature phase, not this public-catalogue phase.
 */
export function createLibraryResource(request: RequestFn) {
  return {
    list: (query: ListLibraryItemsQuery = {}) =>
      request<PaginatedResponse<LibraryItemSummary>>({
        method: 'GET',
        path: '/library/items',
        query: {
          cursor: query.cursor,
          limit: query.limit,
          category: query.category,
          author: query.author,
          q: query.q,
        },
      }),

    getBySlug: (slug: string) =>
      request<LibraryItemSummary>({ method: 'GET', path: `/library/items/${slug}` }),
  };
}

export type LibraryResource = ReturnType<typeof createLibraryResource>;
