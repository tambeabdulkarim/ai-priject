'use client';

// Inverse of RequireAuth — for /login, /register, etc. when the visitor
// is already authenticated (docs/FRONTEND-PHASE-1-API-ARCHITECTURE.md
// §3's `RequireGuest`). Redirects to the dashboard rather than rendering
// a login form to someone already signed in.

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { ROUTES, withLang } from '../constants/routes';

export function RequireGuest({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const params = useParams<{ lang: string }>();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(withLang(ROUTES.dashboard, params.lang ?? 'en'));
    }
  }, [status, router, params.lang]);

  if (status === 'authenticated') {
    return null;
  }

  return <>{children}</>;
}
