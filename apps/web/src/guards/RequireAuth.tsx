'use client';

// Route/component-layer auth check (docs/FRONTEND-PHASE-1-API-
// ARCHITECTURE.md §4.8) — the REAL check, distinct from middleware.ts's
// cheap cookie-presence fast-path. Every actual authorization decision
// still happens server-side on apps/api regardless of what this renders.

import { useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { ROUTES, withLang } from '../constants/routes';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ lang: string }>();

  useEffect(() => {
    if (status === 'anonymous') {
      const lang = params.lang ?? 'en';
      const redirectTarget = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.replace(`${withLang(ROUTES.login, lang)}${redirectTarget}`);
    }
  }, [status, router, pathname, params.lang]);

  if (status !== 'authenticated') {
    return null;
  }

  return <>{children}</>;
}
