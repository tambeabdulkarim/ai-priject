import type {
  ListNotificationsQuery,
  ListNotificationsResponse,
  MarkAllReadResponse,
  NotificationItem,
} from '@phoenix/types';
import type { RequestFn } from '../core/request';

/** docs/16-API-CONTRACT.md §17 (Notifications) — all three require authentication (resource-owner only), verified against notifications.controller.ts. */
export function createNotificationsResource(request: RequestFn) {
  return {
    list: (query: ListNotificationsQuery = {}) =>
      request<ListNotificationsResponse>({
        method: 'GET',
        path: '/notifications/me',
        query: { cursor: query.cursor, limit: query.limit, status: query.status },
      }),

    markRead: (id: string) =>
      request<NotificationItem>({ method: 'PATCH', path: `/notifications/${id}/read` }),

    markAllRead: () =>
      request<MarkAllReadResponse>({ method: 'POST', path: '/notifications/read-all' }),
  };
}

export type NotificationsResource = ReturnType<typeof createNotificationsResource>;
