'use client';

// UI-convenience role gate ONLY — never the security boundary
// (docs/09-PLATFORM-ARCHITECTURE.md §5: "UI hides actions the user can't
// perform... never the security boundary"). The backend re-checks every
// one of these on every request regardless of what this component does.

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { ROUTES, withLang } from '../constants/routes';

export interface RequireRoleProps {
  roles: string[];
  children: React.ReactNode;
  /** Rendered instead of redirecting, for an inline "you don't have access" state rather than a full-page bounce — used when the surrounding page is otherwise legitimately reachable (docs §4.13's distinction between a wrong-navigation redirect and an in-context denial). */
  fallback?: React.ReactNode;
}

export function RequireRole({ roles, children, fallback }: RequireRoleProps) {
  const { status, hasAnyRole } = useAuth();
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const allowed = status === 'authenticated' && hasAnyRole(roles);

  useEffect(() => {
    if (status === 'authenticated' && !allowed && !fallback) {
      router.replace(withLang(ROUTES.forbidden, params.lang ?? 'en'));
    }
  }, [status, allowed, fallback, router, params.lang]);

  if (status !== 'authenticated') {
    return null;
  }
  if (!allowed) {
    return fallback ? <>{fallback}</> : null;
  }
  return <>{children}</>;
}
