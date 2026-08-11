import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

// docs/10-SECURITY-BIBLE.md §5 (Phase 14.2). Mirrors useChangePassword.ts's
// shape — thin useMutation wrappers, no business logic duplicated here
// (that lives in AuthService on the backend).

export function useMfaEnrollBegin() {
  return useMutation({
    mutationFn: () => apiClient.auth.mfaEnrollBegin(),
  });
}

export function useMfaEnrollConfirm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => apiClient.auth.mfaEnrollConfirm({ code }),
    onSuccess: (result) => {
      // mfaEnabled flips on the backend — refetch GET /users/me so the
      // settings page reflects the new state without a manual reload.
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      }
    },
  });
}

export function useMfaDisable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => apiClient.auth.mfaDisable({ password }),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      }
    },
  });
}

export function useMfaRegenerateRecoveryCodes() {
  return useMutation({
    mutationFn: () => apiClient.auth.mfaRegenerateRecoveryCodes(),
  });
}
