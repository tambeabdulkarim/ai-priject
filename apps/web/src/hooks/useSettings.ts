import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/** docs/16-API-CONTRACT.md GET /admin/settings — `settings:read`, superadmin only (no explicit grant in prisma/seed.ts). Sensitive values arrive pre-redacted to `null` — never fetched or reconstructed here. */
export function useAdminSettings() {
  return useQuery({
    queryKey: queryKeys.admin.settings.list(),
    queryFn: async () => {
      const result = await apiClient.settings.listForAdmin();
      if (result.error) throw result.error;
      return result.data;
    },
  });
}

/** docs/16-API-CONTRACT.md PATCH /admin/settings/:key — `settings:write`, superadmin only. Value is validated server-side only as a non-empty string — no type/schema exists to validate against (packages/types/src/settings.ts's comment). */
export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => apiClient.settings.update(key, { value }),
    onSuccess: (result) => {
      if (!result.error) queryClient.invalidateQueries({ queryKey: queryKeys.admin.settings.list() });
    },
  });
}
