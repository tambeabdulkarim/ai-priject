import type {
  AnalyticsOverview,
  AnalyticsOverviewQuery,
  AuditLogEntry,
  CommentRecord,
  ListAuditLogsQuery,
  ModerationDecisionRequest,
  ModerationQueueQuery,
  ModerationQueueResponse,
  PaginatedResponse,
} from '@phoenix/types';
import type { RequestFn } from '../core/request';

/**
 * docs/16-API-CONTRACT.md §18 (Administration). Every call here requires a
 * permission the JWT's `roles` claim must resolve server-side
 * (`moderation:read`/`comment:moderate`/`audit:read` per
 * prisma/seed.ts) — a 403 from any of these for a `moderator`-only user
 * is expected and correct for `listAuditLogs` (moderator does not hold
 * `audit:read`), not a bug.
 */
export function createAdminResource(request: RequestFn) {
  return {
    listModerationQueue: (query: ModerationQueueQuery = {}) =>
      request<ModerationQueueResponse>({
        method: 'GET',
        path: '/admin/moderation/queue',
        query: { cursor: query.cursor, limit: query.limit, content_type: query.content_type },
      }),

    decideComment: (id: string, body: ModerationDecisionRequest) =>
      request<CommentRecord>({
        method: 'POST',
        path: `/admin/moderation/comments/${id}/decision`,
        body,
      }),

    listAuditLogs: (query: ListAuditLogsQuery = {}) =>
      request<PaginatedResponse<AuditLogEntry>>({
        method: 'GET',
        path: '/admin/audit-logs',
        query: {
          cursor: query.cursor,
          limit: query.limit,
          actor: query.actor,
          action: query.action,
          target_type: query.target_type,
          from: query.from,
          to: query.to,
        },
      }),

    /** `analytics:read` (admin/superadmin). A single flat overview object — no breakdown/segmentation endpoint exists anywhere in the backend. */
    getAnalyticsOverview: (query: AnalyticsOverviewQuery) =>
      request<AnalyticsOverview>({
        method: 'GET',
        path: '/admin/analytics/overview',
        query: { from: query.from, to: query.to },
      }),
  };
}

export type AdminResource = ReturnType<typeof createAdminResource>;
