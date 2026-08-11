import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ListNotificationsQuery } from '@phoenix/types';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/**
 * docs/16-API-CONTRACT.md GET /notifications/me
 *
 * `enabled` (Phase 14.7, default true): the header's user menu reads
 * `unreadCount` from this same hook, but must not fire it for anonymous
 * visitors — every existing caller already only mounts once a session
 * exists, so the default preserves that behavior unchanged.
 */
export function useNotificationsList(
  query: Omit<ListNotificationsQuery, 'cursor'> = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.notifications.list(query),
    queryFn: async () => {
      const result = await apiClient.notifications.list(query);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: options.enabled ?? true,
  });
}

/** docs/16-API-CONTRACT.md PATCH /notifications/:id/read — invalidates the list so unreadCount and the item's readAt stay in sync, matching docs §2.8's "mutation invalidates its list" convention. */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.notifications.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
    },
  });
}

/** docs/16-API-CONTRACT.md POST /notifications/read-all */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.notifications.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
    },
  });
}
