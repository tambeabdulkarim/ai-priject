import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateMeRequest } from '@phoenix/types';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/** docs/16-API-CONTRACT.md PATCH /users/me — see packages/types/src/users.ts's UpdateMeRequest comment: only `locale`/`timezone` are real, editable fields on this backend. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMeRequest) => apiClient.users.updateMe(body),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      }
    },
  });
}
