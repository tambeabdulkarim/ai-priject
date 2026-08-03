import { useMutation } from '@tanstack/react-query';
import * as authClient from '../services/auth-client';

/** docs/16-API-CONTRACT.md POST /auth/verify-email. */
export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => authClient.verifyEmail(token),
  });
}
