// docs/16-API-CONTRACT.md §17 (Notifications). Verified against
// apps/api/src/modules/notifications/{notifications.service.ts,notifications.repository.ts}.

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  readAt: string | null;
  channel: 'in_app' | 'email' | 'push';
  sourceEventId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** GET /notifications/me's real shape: the paginated envelope PLUS `unreadCount` — not a plain PaginatedResponse. */
export interface ListNotificationsResponse {
  items: NotificationItem[];
  nextCursor: string | null;
  unreadCount: number;
}

export interface ListNotificationsQuery {
  cursor?: string;
  limit?: number;
  status?: 'read' | 'unread';
}

export interface MarkAllReadResponse {
  marked_read: number;
}
