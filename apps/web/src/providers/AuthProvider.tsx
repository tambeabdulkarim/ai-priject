'use client';

// The one app-wide Context this phase defines
// (docs/FRONTEND-PHASE-1-API-ARCHITECTURE.md §5 "Belongs in Context").
// Owns: decoded JWT claims / auth status, the full profile (GET
// /users/me, via React Query so it benefits from the same cache/
// invalidation machinery as everything else), and the login/register/
// logout/logoutAll/role-check actions every guard and nav element needs.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthUser } from '@phoenix/types';
import { AuthContext } from '../contexts/AuthContext';
import type { AuthContextValue, AuthStatus } from '../types/auth';
import { apiClient } from '../services/api-client';
import * as authClient from '../services/auth-client';
import { getErrorMessage } from '../utils/errors';
import { queryKeys } from '../hooks/queryKeys';

const ME_QUERY_KEY = queryKeys.auth.me();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const queryClient = useQueryClient();

  // Session recovery on mount (docs §4.11): one silent refresh attempt
  // before rendering any authenticated UI, relying entirely on the
  // httpOnly refresh_token cookie.
  useEffect(() => {
    let cancelled = false;
    authClient.recoverSession().then((recoveredUser) => {
      if (cancelled) return;
      setUser(recoveredUser);
      setStatus(recoveredUser ? 'authenticated' : 'anonymous');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const profileQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      const result = await apiClient.users.getMe();
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: status === 'authenticated',
    staleTime: 0,
  });

  const login = useCallback<AuthContextValue['login']>(
    async (email, password) => {
      const result = await authClient.login(email, password);
      if (result.error) {
        return { success: false, message: getErrorMessage(result.error) };
      }
      // docs/10-SECURITY-BIBLE.md §5 (Phase 14.2): MFA-enabled account —
      // no session yet, hand the challenge back to the caller (the login
      // page) to render the second-step form.
      if ('mfaRequired' in result.data) {
        return { success: false, mfaRequired: true, challengeToken: result.data.challengeToken };
      }
      setUser(result.data.user);
      setStatus('authenticated');
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      return { success: true };
    },
    [queryClient],
  );

  const verifyMfa = useCallback<AuthContextValue['verifyMfa']>(
    async (challengeToken, code) => {
      const result = await authClient.verifyMfa(challengeToken, code);
      if (result.error) {
        return { success: false, message: getErrorMessage(result.error) };
      }
      setUser(result.data.user);
      setStatus('authenticated');
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      return { success: true };
    },
    [queryClient],
  );

  const register = useCallback<AuthContextValue['register']>(async (params) => {
    const result = await authClient.register(params);
    if (result.error) {
      return { success: false, message: getErrorMessage(result.error) };
    }
    // docs §4.2: registration never signs the user in — verification is
    // required first. Status intentionally stays whatever it already was.
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await authClient.logout();
    setUser(null);
    setStatus('anonymous');
    queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
  }, [queryClient]);

  const logoutAll = useCallback(async () => {
    await authClient.logoutAll();
    setUser(null);
    setStatus('anonymous');
    queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
  }, [queryClient]);

  const hasRole = useCallback((role: string) => user?.roles.includes(role) ?? false, [user]);
  const hasAnyRole = useCallback(
    (roles: string[]) => roles.some((r) => user?.roles.includes(r)),
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      profile: profileQuery.data ?? null,
      login,
      verifyMfa,
      register,
      logout,
      logoutAll,
      hasRole,
      hasAnyRole,
    }),
    [
      status,
      user,
      profileQuery.data,
      login,
      verifyMfa,
      register,
      logout,
      logoutAll,
      hasRole,
      hasAnyRole,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
