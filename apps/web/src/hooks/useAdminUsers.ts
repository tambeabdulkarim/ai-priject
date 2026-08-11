import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ListUsersQuery,
  UpdateUserRolesRequest,
  UpdateUserStatusRequest,
} from '@phoenix/types';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/** docs/16-API-CONTRACT.md GET /users — `user:list` (admin/superadmin). Cursor-paginated, filters by status/role/free-text `q` (DB `ILIKE`, not a search index). */
export function useAdminUsersList(query: ListUsersQuery = {}) {
  return useQuery({
    queryKey: queryKeys.admin.users.list(query as unknown as Record<string, unknown>),
    queryFn: async () => {
      const result = await apiClient.users.list(query);
      if (result.error) throw result.error;
      return result.data;
    },
  });
}

/** docs/16-API-CONTRACT.md GET /users/:id — `user:read` (admin/superadmin). Includes the user's CURRENT roles only — no historical role-change timeline exists (see packages/types/src/users.ts's AdminUserDetail comment). */
export function useAdminUserDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.users.detail(id),
    queryFn: async () => {
      const result = await apiClient.users.getById(id);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: id.length > 0,
  });
}

/** docs/16-API-CONTRACT.md PATCH /users/:id/status — `user:ban` (admin/superadmin). The real backend performs no transition-legality check (see UpdateUserStatusRequest's comment) — not pre-validated client-side either. */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateUserStatusRequest & { id: string }) =>
      apiClient.users.updateStatus(id, body),
    onSuccess: (result, variables) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.detail(variables.id) });
      }
    },
  });
}

/** docs/16-API-CONTRACT.md PATCH /users/:id/roles — `user:assign_role`, superadmin only (no explicit grant in prisma/seed.ts). Full-set replacement. */
export function useUpdateUserRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateUserRolesRequest & { id: string }) =>
      apiClient.users.updateRoles(id, body),
    onSuccess: (result, variables) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.detail(variables.id) });
      }
    },
  });
}
