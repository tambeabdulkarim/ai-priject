import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';

/** docs/16-API-CONTRACT.md GET /media/:id. A 425 (still processing) is a real, expected state, not a transient failure — no retry. */
export function useMediaPlayback(mediaId: string | null) {
  return useQuery({
    queryKey: ['media', 'detail', mediaId],
    queryFn: async () => {
      const result = await apiClient.media.getById(mediaId as string);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: Boolean(mediaId),
    retry: false,
  });
}
