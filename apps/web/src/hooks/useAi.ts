import { useMutation, useQuery } from '@tanstack/react-query';
import type { CreateAiRequestInput } from '@phoenix/types';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/** docs/16-API-CONTRACT.md GET /ai/requests/:id — authenticated, resource-owner only. */
export function useAiRequest(id: string) {
  return useQuery({
    queryKey: queryKeys.ai.requestDetail(id),
    queryFn: async () => {
      const result = await apiClient.ai.getRequestById(id);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: id.length > 0,
  });
}

/** docs/16-API-CONTRACT.md GET /ai/usage/me — authenticated, resource-owner. Real zero/null state when no `AiUsage` row exists yet — not fabricated, see packages/types/src/ai.ts. */
export function useAiUsage() {
  return useQuery({
    queryKey: queryKeys.ai.usage(),
    queryFn: async () => {
      const result = await apiClient.ai.getMyUsage();
      if (result.error) throw result.error;
      return result.data;
    },
  });
}

/**
 * docs/16-API-CONTRACT.md POST /ai/requests — calls the REAL endpoint,
 * which always returns HTTP 501 (see packages/types/src/ai.ts's header
 * comment). Used only to power the Blocked Request UI's demonstration:
 * a genuine backend call whose real 501 response is rendered as-is, not
 * a fabricated error. No automatic retry is wired anywhere — the caller
 * (component) triggers this once per explicit user action.
 */
export function useCreateAiRequest() {
  return useMutation({
    mutationFn: (body: CreateAiRequestInput) => apiClient.ai.createRequest(body),
  });
}
