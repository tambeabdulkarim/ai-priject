import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/** docs/16-API-CONTRACT.md GET /certificates/me */
export function useCertificatesList(params: { cursor?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.certificates.list(params),
    queryFn: async () => {
      const result = await apiClient.certificates.listMine(params);
      if (result.error) throw result.error;
      return result.data;
    },
  });
}

/** docs/16-API-CONTRACT.md GET /certificates/:id — owner-only server-side. */
export function useCertificate(id: string) {
  return useQuery({
    queryKey: queryKeys.certificates.detail(id),
    queryFn: async () => {
      const result = await apiClient.certificates.getById(id);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: id.length > 0,
  });
}

/** docs/16-API-CONTRACT.md GET /certificates/verify/:certificateNumber — public, no auth. */
export function useVerifyCertificate(certificateNumber: string) {
  return useQuery({
    queryKey: queryKeys.certificates.verify(certificateNumber),
    queryFn: async () => {
      const result = await apiClient.certificates.verifyPublic(certificateNumber);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: certificateNumber.length > 0,
  });
}
