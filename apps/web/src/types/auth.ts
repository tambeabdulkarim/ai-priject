// App-local types (apps/web-specific) — distinct from packages/types,
// which holds only shapes shared across apps/web, apps/admin, and the
// future apps/mobile. AuthContextValue is a apps/web UI-layer concern
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
  login: (email: string, password: string) => Promise<{ success: true } | { success: false; message: string }>;
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
