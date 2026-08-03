// Typed, validated environment access — one file, fails fast (at module
// load, not deep inside some unrelated component) on a missing/malformed
// variable, per docs/FRONTEND-PHASE-1-API-ARCHITECTURE.md §3.
//
// Only NEXT_PUBLIC_-prefixed variables are read here deliberately — this
// module is imported by both server and client code (the API client is
// constructed the same way on both sides), and Next.js only inlines
// NEXT_PUBLIC_ vars into the client bundle. A server-only secret has no
// business being read through this file.
//
// `NEXT_PUBLIC_API_URL` (the API's bare origin, e.g. http://localhost:4000)
// is the variable name already established in apps/web/.env.example by
// the existing scaffold — reused as-is rather than introducing a second,
// differently-named variable for the same thing. The documented,
// constant `/api/v1` version prefix (docs/16-API-CONTRACT.md "Versioning
// Strategy") is appended here in code, not made independently
// configurable, since it isn't actually an environment-specific value.

import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .url()
    .refine((value) => !value.endsWith('/'), 'NEXT_PUBLIC_API_URL must not have a trailing slash'),
});

function loadEnv() {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  });

  if (!result.success) {
    // Fails the build/dev-server startup loudly rather than letting a
    // misconfigured deploy silently call the wrong API origin.
    throw new Error(
      `Invalid environment configuration:\n${result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')}`,
    );
  }

  return {
    ...result.data,
    apiBaseUrl: `${result.data.NEXT_PUBLIC_API_URL}/api/v1`,
  };
}

export const env = loadEnv();
