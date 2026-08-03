// apps/web's configured instance of the shared packages/api-client SDK —
// wired to this app's token storage/refresh strategy (services/auth-
// client.ts). Every hook/component that needs to call the API imports
// `apiClient` from here, never `createApiClient` directly.
// (docs/FRONTEND-PHASE-1-API-ARCHITECTURE.md §2.1)

import { createApiClient, ApiError } from '@phoenix/api-client';
import { env } from '../config/env';
import { getAccessToken, handleUnauthorized } from './auth-client';

export const apiClient = createApiClient({
  baseUrl: env.apiBaseUrl,
  getAccessToken,
  onUnauthorized: handleUnauthorized,
  onForbidden: (error: ApiError) => {
    // Cross-cutting 403 hook point (docs §4.13) — deliberately minimal
    // this phase (no router/navigation wiring here, core/request.ts
    // already returns the ApiError to the caller regardless). A future
    // feature phase may extend this to redirect admin-area 403s to
    // ROUTES.forbidden; not added ahead of a real place that needs it.
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[api] 403 Forbidden: ${error.message} (request_id: ${error.requestId})`);
    }
  },
});
