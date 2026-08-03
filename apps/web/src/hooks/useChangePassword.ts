import { useMutation } from '@tanstack/react-query';
import type { ChangePasswordRequest } from '@phoenix/types';
import { apiClient } from '../services/api-client';

/** docs/16-API-CONTRACT.md POST /users/me/change-password — the real backend revokes every OTHER session on success (the acting one survives); no client-side session-list refresh is needed since this app doesn't render a session list this phase. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (body: ChangePasswordRequest) => apiClient.users.changePassword(body),
  });
}
