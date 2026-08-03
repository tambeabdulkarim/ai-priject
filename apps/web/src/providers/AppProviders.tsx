'use client';

// Composes every global provider this phase defines, mounted once in the
// root layout. Order matters: QueryProvider must wrap AuthProvider, since
// AuthProvider's profile fetch uses `useQuery` internally.

import { AuthProvider } from './AuthProvider';
import { QueryProvider } from './QueryProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}
