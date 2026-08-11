import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';

/**
 * Phase 13.3 (media-architecture-report.md §6, Performance/Caching):
 * signed URLs are short-lived (5 min TTL server-side) and cheap to mint
 * on demand — this hook is only ever called once a `MediaPreview` is
 * actually visible (see that component's IntersectionObserver gate), so
 * a Library page never pre-fetches a signed URL for every off-screen
 * card. `enabled` (not just the caller's own visibility gate) is the
 * real guard — this hook can be called unconditionally and still won't
 * fire a request until asked to.
 */
export function useSignedFileUrl(fileId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['files', 'signed-url', fileId],
    queryFn: async () => {
      const result = await apiClient.files.getFile(fileId as string);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: Boolean(fileId) && enabled,
    staleTime: 4 * 60 * 1000, // just under the real 5-minute server TTL
    retry: false,
  });
}
