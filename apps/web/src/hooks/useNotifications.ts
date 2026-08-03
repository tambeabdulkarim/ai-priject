import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ListNotificationsQuery } from '@phoenix/types';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/** docs/16-API-CONTRACT.md GET /notifications/me */
export function useNotificationsList(query: Omit<ListNotificationsQuery, 'cursor'> = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.list(query),
    queryFn: async () => {
      const result = await apiClient.notifications.list(query);
      if (result.error) throw result.error;
      return result.data;
    },
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
