'use client';

// TanStack Query provider — the ONLY place a QueryClient is constructed
// (docs/09-PLATFORM-ARCHITECTURE.md §8, docs/FRONTEND-PHASE-1-API-
// ARCHITECTURE.md §2.8/§2.13/§4).
//
// Default options implement this phase's documented retry/cache policy
// centrally, so individual hooks never redeclare it (avoids the
// duplicated-logic pitfall this phase is explicitly validated against):
//  - Queries: up to 3 retries with exponential backoff, but NEVER for a
//    4xx (a client-correctable condition per docs/16-API-CONTRACT.md's
//    Error Response Standard — retrying it identically just wastes a
//    request against the documented per-account rate limits).
//  - Mutations: no automatic retry by default. A future feature phase
//    may opt a specific idempotency-key-eligible mutation into retrying
//    (docs §2.8/§2.13) — that's a per-mutation override, not a global
//    default, since retrying a non-idempotent mutation by default risks
//    duplicating a side effect.

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@phoenix/api-client';

const MAX_QUERY_RETRIES = 3;

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) {
    return false;
  }
  if (error instanceof ApiError) {
    // 4xx: client-correctable, never retried. 5xx (and the non-ApiError
    // NetworkError/TimeoutError cases, which fall through to the `true`
    // below): transient, eligible for retry.
    return error.status >= 500;
  }
  return true;
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: shouldRetryQuery,
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Server: always a fresh client per request (no cross-request state
// leakage). Browser: exactly one client for the app's lifetime, so the
// cache survives client-side navigation.
let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return createQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(getQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
