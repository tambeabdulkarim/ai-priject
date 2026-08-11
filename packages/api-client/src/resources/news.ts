import type { ListNewsQuery, NewsDetail, NewsSummary, PaginatedResponse } from '@phoenix/types';
import type { RequestFn } from '../core/request';

/** docs/16-API-CONTRACT.md §16 (News) — public read endpoints only (GET /news, GET /news/:slug). Both `@Public()` on the real backend; no auth required, though an authenticated editorial-role caller additionally sees non-published articles (handled entirely server-side — this client sends whatever token is present, same as every other call). */
export function createNewsResource(request: RequestFn) {
  return {
    list: (query: ListNewsQuery = {}) =>
      request<PaginatedResponse<NewsSummary>>({
        method: 'GET',
        path: '/news',
        query: {
          cursor: query.cursor,
          limit: query.limit,
          category: query.category,
          tag: query.tag,
          q: query.q,
        },
      }),

    getBySlug: (slug: string) => request<NewsDetail>({ method: 'GET', path: `/news/${slug}` }),
  };
}

export type NewsResource = ReturnType<typeof createNewsResource>;
