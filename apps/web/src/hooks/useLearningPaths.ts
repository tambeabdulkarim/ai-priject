import { useQuery } from '@tanstack/react-query';
import type { ListLearningPathsQuery } from '@phoenix/types';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/** docs/16-API-CONTRACT.md GET /learning-paths — public, cursor-paginated. */
export function useLearningPathsList(query: ListLearningPathsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.learningPaths.list(query as Record<string, unknown>),
    queryFn: async () => {
      const result = await apiClient.learningPaths.list(query);
      if (result.error) throw result.error;
      return result.data;
    },
  });
}

/** docs/16-API-CONTRACT.md GET /learning-paths/:slug — public; a draft path 404s for an unauthenticated/non-editorial viewer, entirely server-side. */
export function useLearningPath(slug: string) {
  return useQuery({
    queryKey: queryKeys.learningPaths.detail(slug),
    queryFn: async () => {
      const result = await apiClient.learningPaths.getBySlug(slug);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: slug.length > 0,
  });
}
