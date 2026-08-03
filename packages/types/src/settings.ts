// docs/16-API-CONTRACT.md §19 (Settings). Verified against
// apps/api/src/modules/settings/{settings.controller.ts,settings.service.ts,
// dto/update-setting.dto.ts} and prisma/schema.prisma's `Setting` model.
//
// REAL BACKEND GAPS (not worked around):
//  - `settings:read`/`settings:write` have NO entry in prisma/seed.ts's
//    EXPLICIT_ROLE_GRANTS — only `superadmin` (which implicitly holds
//    every permission) can reach `GET /admin/settings` or
//    `PATCH /admin/settings/:key`. A plain `admin` gets a real 403 on
//    both. The Settings screen is therefore gated to superadmin only,
//    not the wider admin workspace role set.
//  - The `Setting` model has no `type`/`schema` column at all, so
//    `UpdateSettingDto` only validates `value` as a non-empty string —
//    there is no way to render/validate type-specific inputs (toggle,
//    number, JSON) from backend metadata. Every setting is edited as
//    plain text here, matching what the backend can actually enforce.

/** GET /settings/public — a flat key→value map built from non-sensitive settings only, NOT a Setting[] array. */
export type PublicSettings = Record<string, string>;

/**
 * GET /admin/settings — the full Setting[] with sensitive values
 * redacted to `null` server-side (`settings.service.ts`'s
 * `listForAdmin`: `value: s.isSensitive ? null : s.value`). This
 * redaction is never undone client-side — a `null` value is rendered as
 * "hidden", never fetched or guessed at.
 */
export interface SettingRecord {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  isSensitive: boolean;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingRequest {
  value: string;
}
