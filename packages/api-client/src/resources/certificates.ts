import type {
  Certificate,
  CertificateWithPdfUrl,
  PaginatedResponse,
  VerifyCertificateResponse,
} from '@phoenix/types';
import type { RequestFn } from '../core/request';

/** docs/16-API-CONTRACT.md §8 (Certificates). `verifyPublic` is the one endpoint here that's actually `@Public()` — the other two require the caller to be the certificate's own owner (enforced server-side). */
export function createCertificatesResource(request: RequestFn) {
  return {
    listMine: (params: { cursor?: string; limit?: number } = {}) =>
      request<PaginatedResponse<Certificate>>({
        method: 'GET',
        path: '/certificates/me',
        query: { cursor: params.cursor, limit: params.limit },
      }),

    getById: (id: string) =>
      request<CertificateWithPdfUrl>({ method: 'GET', path: `/certificates/${id}` }),

    verifyPublic: (certificateNumber: string) =>
      request<VerifyCertificateResponse>({
        method: 'GET',
        path: `/certificates/verify/${certificateNumber}`,
      }),
  };
}

export type CertificatesResource = ReturnType<typeof createCertificatesResource>;
