import type {
  AdminUserDetail,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ListUsersQuery,
  MeProfile,
  PaginatedResponse,
  RoleRecord,
  SafeUser,
  UpdateMeRequest,
  UpdateUserRolesRequest,
  UpdateUserStatusRequest,
} from '@phoenix/types';
import type { RequestFn } from '../core/request';

/**
 * docs/16-API-CONTRACT.md §2 (Users) — "me" endpoints plus the
 * admin-scoped user-management endpoints (GET /users, GET /users/:id,
 * PATCH /users/:id/{status,roles}), all on the same real controller
 * (users.controller.ts mixes self-service and admin routes, not a
 * separate admin-scoped controller).
 */
export function createUsersResource(request: RequestFn) {
  return {
    getMe: () => request<MeProfile>({ method: 'GET', path: '/users/me' }),

    /** Real backend only accepts `locale`/`timezone` — see packages/types/src/users.ts's UpdateMeRequest comment for why displayName/bio/avatar aren't here (no Profiles module exists). */
    updateMe: (body: UpdateMeRequest) => request<SafeUser>({ method: 'PATCH', path: '/users/me', body }),

    changePassword: (body: ChangePasswordRequest) =>
      request<ChangePasswordResponse>({ method: 'POST', path: '/users/me/change-password', body }),

    /** `user:list` (admin/support/superadmin). */
    list: (query: ListUsersQuery = {}) =>
      request<PaginatedResponse<SafeUser>>({
        method: 'GET',
        path: '/users',
        query: { cursor: query.cursor, limit: query.limit, status: query.status, role: query.role, q: query.q },
      }),

    /** `user:read` (admin/support/superadmin). */
    getById: (id: string) => request<AdminUserDetail>({ method: 'GET', path: `/users/${id}` }),

    /** `user:ban` (admin/superadmin). No transition-legality check exists server-side — see UpdateUserStatusRequest's comment. */
    updateStatus: (id: string, body: UpdateUserStatusRequest) =>
      request<SafeUser>({ method: 'PATCH', path: `/users/${id}/status`, body }),

    /** `user:assign_role` — superadmin only (no explicit grant in prisma/seed.ts). Full-set replacement, returns the updated Role[]. */
    updateRoles: (id: string, body: UpdateUserRolesRequest) =>
      request<RoleRecord[]>({ method: 'PATCH', path: `/users/${id}/roles`, body }),
  };
}

export type UsersResource = ReturnType<typeof createUsersResource>;
