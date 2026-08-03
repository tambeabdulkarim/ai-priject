// Next.js middleware — intended per docs/FRONTEND-PHASE-1-API-
// ARCHITECTURE.md §3/§4.8 as a cheap, cookie-presence-only fast path
// ahead of the real client-side check (guards/RequireAuth.tsx).
//
// INTEGRATION FINDING, discovered while implementing this phase (not a
// documentation gap to invent around — a real constraint of the verified
// backend contract, so this is a deliberate, honest deviation from the
// Phase 1 architecture doc's plan, not an oversight):
//
// apps/api's refresh cookie (auth.controller.ts `setRefreshCookie`) is
// set with NO `Domain` attribute and `path: '/api/v1/auth'` — a
// host-only cookie scoped to the API's own origin
// (e.g. localhost:4000), not the web app's origin (e.g. localhost:3000,
// or whatever production origin apps/web is served from). A browser only
// attaches/exposes a cookie to the origin that set it (or an explicitly
// shared parent domain via `Domain=`, which this backend does not set).
// Next.js middleware runs as part of apps/web's own server and only ever
// sees cookies sent to *apps/web's* origin — it structurally cannot see
// this cookie at all, regardless of whether the visitor has a valid
// session.
//
// Implementing the originally-planned "cookie present → let it through"
// check here would therefore always evaluate to "cookie absent," which
// would incorrectly redirect every visitor — including ones with a
// perfectly valid session — away from every protected route. That is
// worse than doing nothing, so this middleware is a deliberate,
// documented pass-through: real auth enforcement lives entirely in
// guards/RequireAuth.tsx and guards/RequireGuest.tsx, which check actual
// React state populated by a real `/auth/refresh` network call (see
// services/auth-client.ts's `recoverSession`), not a guess based on
// cookie visibility.
//
// Resolving this properly (making the fast-path viable) requires a
// deployment-level decision this phase is not authorized to make: either
// reverse-proxying apps/api under the same origin as apps/web (e.g.
// `/api/*` rewritten to the API), or having the API set `Domain=` to a
// shared parent domain. Neither is invented here.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
