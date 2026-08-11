import type { AiRequestRecord, AiUsageResponse, CreateAiRequestInput } from '@phoenix/types';
import type { RequestFn } from '../core/request';

/**
 * docs/16-API-CONTRACT.md §15 (AI). `createRequest` calls the real
 * `POST /ai/requests` endpoint, which ALWAYS returns HTTP 501 —
 * verified against apps/api/src/modules/ai/ai.service.ts's own
 * "BLOCKED BY DOCUMENTATION" comment (no feature catalog, no per-feature
 * schema, no provider adapter implementation exists). It is wired here
 * so the frontend's Blocked Request UI can render the real backend error
 * rather than a fabricated one — not because a working request-creation
 * flow exists.
 */
export function createAiResource(request: RequestFn) {
  return {
    createRequest: (body: CreateAiRequestInput) =>
      request<never>({ method: 'POST', path: '/ai/requests', body }),

    getRequestById: (id: string) =>
      request<AiRequestRecord>({ method: 'GET', path: `/ai/requests/${id}` }),

    getMyUsage: () => request<AiUsageResponse>({ method: 'GET', path: '/ai/usage/me' }),
  };
}

export type AiResource = ReturnType<typeof createAiResource>;
