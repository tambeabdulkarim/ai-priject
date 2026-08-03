'use client';

// "Permission guard" — named for symmetry with the backend's
// `resource:action` permission model (docs/10-SECURITY-BIBLE.md §3), but
// its actual client-side capability is role-level only.
//
// BLOCKED BY DOCUMENTATION (partial — see
// docs/FRONTEND-PHASE-1-API-ARCHITECTURE.md §2.11): the backend's real
// permission grants (Role_Permissions, e.g. `course:publish`,
// `user:ban`) are resolved server-side per request and are NOT embedded
// in the JWT (only `roles` is — common/interfaces/jwt-payload.interface.ts).
// There is no client-reachable "list this user's resolved permissions"
// endpoint documented in docs/16-API-CONTRACT.md, so a true
// `hasPermission('course:publish')` check cannot be built without
// inventing either a new endpoint or a client-side copy of the
// Role→Permission mapping table — both explicitly out of bounds for this
// phase. This component is therefore implemented as a role-based check
// (an explicit, named allowlist of roles known to hold the permission in
// question, supplied by the caller), not a generic permission resolver —
// the same honest limitation already documented in the architecture
// report, not silently narrowed here.

import { RequireRole, type RequireRoleProps } from './RequireRole';

export interface RequirePermissionProps extends Omit<RequireRoleProps, 'roles'> {
  /** The roles documented (docs/16-API-CONTRACT.md's "Authorization Required" column) as holding this permission — e.g. `rolesForPermission={['content_editor', 'admin']}` for `course:publish`. Supplied by the caller per-usage since there is no client-side permission table to look this up from generically. */
  rolesForPermission: string[];
}

export function RequirePermission({ rolesForPermission, ...rest }: RequirePermissionProps) {
  return <RequireRole roles={rolesForPermission} {...rest} />;
}
