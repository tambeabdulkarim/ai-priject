import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ListAuditLogsQuery,
  ModerationContentType,
  ModerationDecisionRequest,
} from '@phoenix/types';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/**
 * docs/16-API-CONTRACT.md GET /admin/moderation/queue — `moderation:read`.
 *
 * REAL BACKEND GAP: when `contentType` is omitted, the backend's own
 * documented Phase 13 fix caps the combined view to each list's first
 * page only (a single cursor can't paginate two different tables at
 * once — see moderation.service.ts). `getNextPageParam` correctly
 * resolves to `undefined` in that case, so "load more" is naturally
 * unavailable for the unfiltered view rather than silently broken.
 */
export function useModerationQueue(contentType?: ModerationContentType) {
  return useInfiniteQuery({
    queryKey: queryKeys.moderation.queue(contentType),
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const result = await apiClient.admin.listModerationQueue({
        content_type: contentType,
        cursor: pageParam,
        limit: 20,
      });
      if (result.error) throw result.error;
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.courses?.nextCursor ?? lastPage.comments?.nextCursor ?? undefined,
  });
}

/** docs/16-API-CONTRACT.md POST /admin/moderation/comments/:id/decision — `comment:moderate`. `reason` is required by the DTO on every decision (approve or hide). */
export function useDecideComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: ModerationDecisionRequest & { id: string }) =>
      apiClient.admin.decideComment(id, body),
    onSuccess: (result) => {
      if (!result.error) queryClient.invalidateQueries({ queryKey: ['moderation', 'queue'] });
    },
  });
}

/** docs/16-API-CONTRACT.md POST /courses/:id/publish — `course:publish`, held by content_editor/admin/superadmin, NOT moderator (prisma/seed.ts). Kept here (not in useInstructorCourses.ts) since this is the moderation-context caller and invalidates the moderation queue rather than the instructor's owned-courses cache. */
export function usePublishCourseReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.courses.publish(id),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: ['moderation', 'queue'] });
        queryClient.invalidateQueries({ queryKey: ['courses'] });
      }
    },
  });
}

/** docs/16-API-CONTRACT.md GET /admin/audit-logs — `audit:read`, held only by admin/superadmin (prisma/seed.ts) — NOT moderator. Callers must gate `enabled` on `hasAnyRole(AUDIT_READ_ROLES)` themselves; this hook does not assume the caller's role. */
export function useAuditLogs(query: ListAuditLogsQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.auditLogs(query as Record<string, unknown>),
    queryFn: async () => {
      const result = await apiClient.admin.listAuditLogs(query);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled,
  });
}

/**
 * docs/16-API-CONTRACT.md GET /admin/audit-logs — cursor-paginated
 * "Load more" variant for the Admin Workspace's full Audit Logs page
 * (the plain `useAuditLogs` above is a single fixed-size fetch, used by
 * the Moderator Dashboard's small recent-activity widget). All filters
 * (`actor`/`action`/`target_type`) are exact-match server-side
 * (audit-logs.repository.ts uses plain Prisma equality, never
 * `contains`) — not a fuzzy search, reflected as such in the UI copy.
 */
export function useAuditLogsInfinite(filters: Omit<ListAuditLogsQuery, 'cursor' | 'limit'> = {}) {
  return useInfiniteQuery({
    queryKey: ['admin', 'audit-logs', 'infinite', filters],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const result = await apiClient.admin.listAuditLogs({
        ...filters,
        cursor: pageParam,
        limit: 20,
      });
      if (result.error) throw result.error;
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
