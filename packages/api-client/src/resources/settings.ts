import type { PublicSettings, SettingRecord, UpdateSettingRequest } from '@phoenix/types';
import type { RequestFn } from '../core/request';

/**
 * docs/16-API-CONTRACT.md §19 (Settings), verified against
 * apps/api/src/modules/settings/settings.controller.ts. `listForAdmin`/
 * `update` require `settings:read`/`settings:write`, which per
 * prisma/seed.ts's EXPLICIT_ROLE_GRANTS have no explicit role grant at
 * all — only superadmin (implicit blanket grant) can call them. A plain
 * `admin` gets a real 403 on both.
 */
export function createSettingsResource(request: RequestFn) {
  return {
    getPublic: () => request<PublicSettings>({ method: 'GET', path: '/settings/public' }),

    listForAdmin: () => request<SettingRecord[]>({ method: 'GET', path: '/admin/settings' }),

    update: (key: string, body: UpdateSettingRequest) =>
      request<SettingRecord>({ method: 'PATCH', path: `/admin/settings/${key}`, body }),
  };
}

export type SettingsResource = ReturnType<typeof createSettingsResource>;
