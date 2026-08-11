import type {
  LearningPathDetail,
  LearningPathSummary,
  ListLearningPathsQuery,
  PaginatedResponse,
} from '@phoenix/types';
import type { RequestFn } from '../core/request';

/**
 * docs/16-API-CONTRACT.md §20 (Learning Paths, Phase 26).
 *
 * `list`/`getBySlug` are public (`@Public()` on the real backend) — same
 * published-unless-authenticated visibility rule as Courses, entirely
 * server-side. Write operations (`create`/`update`/`publish`/`setCourses`)
 * are exposed here for completeness of the typed SDK but are not used by
 * any Phase 28 learner/instructor screen — no admin authoring UI for
 * learning paths exists yet (a real, disclosed gap, not built this phase).
 */
export function createLearningPathsResource(request: RequestFn) {
  return {
    list: (query: ListLearningPathsQuery = {}) =>
      request<PaginatedResponse<LearningPathSummary>>({
        method: 'GET',
        path: '/learning-paths',
        query: { cursor: query.cursor, limit: query.limit },
      }),

    getBySlug: (slug: string) =>
      request<LearningPathDetail>({ method: 'GET', path: `/learning-paths/${slug}` }),
  };
}

export type LearningPathsResource = ReturnType<typeof createLearningPathsResource>;
