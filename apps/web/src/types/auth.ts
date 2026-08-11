// App-local types (apps/web-specific) — distinct from packages/types,
// which holds shapes shared across consumers of the API (apps/web today,
// a future apps/mobile — apps/admin is retired, see
// docs/09-PLATFORM-ARCHITECTURE.md §16). AuthContextValue is a apps/web UI-layer concern
// (how this specific app models "current session"), not a wire-format
// shape, so it belongs here.

import type { AuthUser, MeProfile } from '@phoenix/types';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthContextValue {
  status: AuthStatus;
  /** From the JWT embedded in the login/refresh response — available as soon as `status === 'authenticated'`. */
  user: AuthUser | null;
  /** From GET /users/me — fetched once after authentication resolves; may briefly lag `user` being non-null. */
  profile: MeProfile | null;
  login: (
    email: string,
    password: string,
  ) => Promise<
    | { success: true }
    | { success: false; message: string }
    | { success: false; mfaRequired: true; challengeToken: string }
  >;
  /** Step 2 of the MFA challenge/response flow (docs/10-SECURITY-BIBLE.md §5) — called after `login` returns `mfaRequired`. */
  verifyMfa: (
    challengeToken: string,
    code: string,
  ) => Promise<{ success: true } | { success: false; message: string }>;
  register: (params: {
    email: string;
    password: string;
    displayName: string;
    locale?: 'ar' | 'en';
  }) => Promise<{ success: true } | { success: false; message: string }>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}
