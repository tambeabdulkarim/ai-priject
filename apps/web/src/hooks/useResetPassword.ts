import { useMutation } from '@tanstack/react-query';
import * as authClient from '../services/auth-client';

/** docs/16-API-CONTRACT.md POST /auth/reset-password. */
export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authClient.resetPassword(token, newPassword),
  });
}
