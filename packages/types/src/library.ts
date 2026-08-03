// docs/16-API-CONTRACT.md §9 (Library). Verified against
// apps/api/src/modules/library/library.repository.ts — both the list and
// detail queries return PLAIN LibraryItem rows (no author/category join
// at all, only raw FK ids), and both are unconditionally scoped to
// `status: 'published'` server-side. There is no separate "free vs paid"
// field to branch on beyond `priceCents` — a null or 0 value is free,
// matching `LibraryService.assertEntitled`'s own `isFree` check.
//
// Deliberately excludes: `POST /library/items/:id/access` (the
// entitlement-gated download flow), `bookmark`, and `progress` — all
// require authentication and belong to an authenticated-library feature
// phase, not this public-catalogue phase.

export interface LibraryItemSummary {
  id: string;
  authorId: string;
  categoryId: string;
  fileId: string;
  title: string;
  slug: string;
  description: string | null;
  status: 'draft' | 'published';
  priceCents: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListLibraryItemsQuery {
  cursor?: string;
  limit?: number;
  category?: string;
  author?: string;
  q?: string;
}
