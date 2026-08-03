import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';

/**
 * docs/16-API-CONTRACT.md GET /files/:id — reused as-is (no dedicated
 * `/products/:id/download` endpoint exists). Entitlement is resolved
 * entirely server-side: `FilesRepository.hasPaidOrderForProduct` checks
 * for a paid `OrderItem` for this product, owner bypass included. This
 * hook does NOT pre-check or guess entitlement client-side — `enabled:
 * false` means nothing is fetched until the caller explicitly requests
 * it (e.g. a "Get download link" click), and whatever the real backend
 * returns (a signed URL, a 403, or a 425 "still scanning") is rendered
 * as-is — never fabricated.
 */
export function useProductDownload(fileId: string | null) {
  return useQuery({
    queryKey: ['files', 'detail', fileId],
    queryFn: async () => {
      const result = await apiClient.files.getFile(fileId as string);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: false,
    retry: false,
  });
}
