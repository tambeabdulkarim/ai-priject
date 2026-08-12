// docs/16-API-CONTRACT.md §16 (News). Verified against
// apps/api/src/modules/news/{news.repository.ts,news.controller.ts}.
//
// The list endpoint (`findMany`) returns News rows plus their public
// `category` (id/name/slug only — the same public taxonomy data already
// exposed on the detail endpoint for the same anonymous caller, added
// for the homepage News badge). Author/tags are still NOT joined in on
// the list — only the detail endpoint (`findBySlug`) includes those, and
// scopes `author` to `{ id, displayName, avatarFileId }` (never the full
// User row — that scoping was a real bug fix earlier in this project's
// history, kept intentionally narrow here rather than widened).

export interface NewsSummary {
  id: string;
  authorId: string;
  categoryId: string;
  category: NewsCategorySummary;
  title: string;
  slug: string;
  body: string;
  status: 'draft' | 'in_review' | 'published';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewsAuthorSummary {
  id: string;
  displayName: string;
  avatarFileId: string | null;
}

export interface NewsCategorySummary {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsTag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsTagAssignment {
  newsId: string;
  tagId: string;
  tag: NewsTag;
  createdAt: string;
}

export interface NewsDetail extends NewsSummary {
  author: NewsAuthorSummary;
  category: NewsCategorySummary;
  tagAssignments: NewsTagAssignment[];
}

export interface ListNewsQuery {
  cursor?: string;
  limit?: number;
  category?: string;
  tag?: string;
  q?: string;
}
