import { useMutation } from '@tanstack/react-query';
import * as authClient from '../services/auth-client';

/** docs/16-API-CONTRACT.md POST /auth/forgot-password — thin useMutation wrapper over services/auth-client.ts, not a reimplementation (avoids duplicated logic). */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authClient.forgotPassword(email),
  });
}
