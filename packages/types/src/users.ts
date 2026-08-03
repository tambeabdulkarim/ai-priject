// docs/16-API-CONTRACT.md GET/PATCH /users/me. Verified against the real
// backend (users.service.ts `getMeView`/`updateProfile`).

export interface MeProfile {
  id: string;
  email: string;
  emailVerified: boolean;
  roles: string[];
  status: 'active' | 'suspended' | 'deactivated';
  locale: string;
  createdAt: string;
}

/**
 * docs/16-API-CONTRACT.md PATCH /users/me — Request Body is documented as
 * `locale, timezone, notification_preferences`, but the REAL backend's
 * `UpdateMeDto` (verified) only accepts `locale` and `timezone`.
 * `notification_preferences` has no backing column anywhere in
 * docs/13-DATABASE-BLUEPRINT.md (the same gap `PATCH /notifications/
 * preferences` is already blocked on) — not sent here, not invented.
 */
export interface UpdateMeRequest {
  locale?: 'ar' | 'en';
  timezone?: string;
}

/**
 * PATCH /users/me's real response is the full Prisma `User` row minus
 * `passwordHash` (`SafeUser` in users.service.ts) — a WIDER shape than
 * `MeProfile` (GET /users/me's hand-picked view). Verified, not
 * idealized: the two endpoints genuinely return different shapes on this
 * backend.
 */
export interface SafeUser {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  displayName: string;
  avatarFileId: string | null;
  locale: string;
  timezone: string;
  status: 'active' | 'suspended' | 'deactivated';
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: true;
}

// docs/16-API-CONTRACT.md §2 (Users) admin-scoped endpoints — GET /users,
// GET /users/:id, PATCH /users/:id/{status,roles}. Verified against
// apps/api/src/modules/users/{users.controller.ts,users.service.ts,dto/*}.
// All require permissions held only by admin/superadmin (`user:list`,
// `user:read`, `user:ban`) except `user:assign_role`, which per
// prisma/seed.ts's EXPLICIT_ROLE_GRANTS has NO explicit grant at all —
// only superadmin (which implicitly holds every permission) can call
// PATCH /users/:id/roles. A plain `admin` gets a real 403 on that one
// endpoint — reflected in the frontend by hiding/disabling the role
// editor for non-superadmin admins, not by pretending it isn't real.

/** GET /users/:id's response: SafeUser + the user's CURRENT role names only — no historical role-assignment timeline exists anywhere in the schema (users.service.ts's own comment on the doc16 gap), so `roles` is the full extent of what's available. */
export interface AdminUserDetail extends SafeUser {
  roles: string[];
}

export interface ListUsersQuery {
  cursor?: string;
  limit?: number;
  status?: 'active' | 'suspended' | 'deactivated';
  role?: string;
  q?: string;
}

export interface UpdateUserStatusRequest {
  status: 'active' | 'suspended' | 'deactivated';
  /**
   * REAL BACKEND GAP: docs/16-API-CONTRACT.md documents a `409 (invalid
   * transition)` rule for this endpoint, but `UsersService.updateStatus`
   * performs no transition-legality check at all — any status can be set
   * from any other status, and no 409 is ever thrown. Not worked around
   * here; the frontend does not attempt to pre-validate transitions
   * either, since there is no documented legal-transition table to
   * validate against.
   */
  reason?: string;
}

/** Mirrors the Prisma `Role` model, returned as-is by PATCH /users/:id/roles (full role objects, not just names/ids). */
export interface RoleRecord {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Full-set replacement, not additive (RolesService.assignRolesToUser) — at least one role must remain, and granting `admin`/`superadmin` itself requires the acting user to already hold `superadmin`. */
export interface UpdateUserRolesRequest {
  roleIds: string[];
}
