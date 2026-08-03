// docs/16-API-CONTRACT.md "Pagination Standard": cursor-based, item array +
// next_cursor + optional total_count. Verified against the actual backend
// shape (common/dto/pagination-query.dto.ts's PaginatedResult<T>):
// `{ items: T[]; nextCursor: string | null }` — camelCase, no
// `total_count` field is actually emitted anywhere in this backend today
// (every list repository in apps/api returns exactly `{ items, nextCursor }`,
// never a count), so it's typed as always-absent here rather than assumed
// present per the doc's "where inexpensive to compute" wording.

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
}

export interface CursorParams {
  cursor?: string;
  limit?: number;
}
