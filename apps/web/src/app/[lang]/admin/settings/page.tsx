'use client';

// Settings — GET /admin/settings + PATCH /admin/settings/:key
// (`settings:read`/`settings:write`). Neither permission has an explicit
// role grant in prisma/seed.ts — only superadmin (implicit blanket
// grant) can reach either endpoint. The layout above only gates the
// wider ADMIN_ROLES (admin/superadmin), so a plain `admin` reaching this
// page needs an explicit, narrower notice here rather than a raw 403
// from the API.
//
// Sensitive values arrive pre-redacted to `null` from the backend
// (`isSensitive` rows never carry a `value`) — rendered as "hidden",
// never fetched, guessed, or reconstructed. Editing a sensitive setting
// still works (blind overwrite via `value`), matching the real
// backend's own capability — there is no "reveal" endpoint.

import { useState } from 'react';
import { EyeOff } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { useAdminSettings, useUpdateSetting } from '../../../../hooks/useSettings';
import { getErrorMessage } from '../../../../utils/errors';
import { SETTINGS_ROLES } from '../../../../constants/routes';

const COPY = {
  title: 'الإعدادات',
  blocked: 'هذه الصفحة تتطلب صلاحية "superadmin". صلاحيات settings:read وsettings:write غير مُمنوحة صراحةً لدور admin في الخادم الحقيقي (prisma/seed.ts) — فقط superadmin يملكها ضمنيًا.',
  loading: 'جارٍ التحميل...',
  error: 'تعذّر التحميل.',
  hidden: 'قيمة محجوبة (حساسة)',
  save: 'حفظ',
  saving: 'جارٍ الحفظ...',
  saved: 'تم الحفظ.',
  editPlaceholder: 'قيمة جديدة',
} as const;

function SettingRow({ setting, onSaved }: { setting: { key: string; value: string | null; description: string | null; isSensitive: boolean }; onSaved: () => void }) {
  const [value, setValue] = useState(setting.value ?? '');
  const update = useUpdateSetting();

  function handleSave() {
    update.mutate({ key: setting.key, value }, { onSuccess: (result) => { if (!result.error) onSaved(); } });
  }

  return (
    <div className="ph-catalogue-card" style={{ cursor: 'default' }}>
      <h3 className="ph-catalogue-card-title">{setting.key}</h3>
      {setting.description && <p className="ph-catalogue-card-desc">{setting.description}</p>}
      {update.error && <div className="ph-form-error" role="alert">{getErrorMessage(update.error)}</div>}

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
        {setting.isSensitive && setting.value === null && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: 0.7 }}>
            <EyeOff size={14} aria-hidden="true" /> {COPY.hidden}
          </span>
        )}
        <input
          className="ph-input"
          placeholder={setting.isSensitive ? COPY.editPlaceholder : undefined}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="button" className="ph-btn-grad" onClick={handleSave} disabled={update.isPending || !value}>
          {update.isPending ? COPY.saving : COPY.save}
        </button>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { hasAnyRole } = useAuth();
  const canAccess = hasAnyRole([...SETTINGS_ROLES]);
  const { data, isLoading, isError } = useAdminSettings();
  const [savedKey, setSavedKey] = useState<string | null>(null);

  if (!canAccess) {
    return (
      <div>
        <h1 className="ph-page-title">{COPY.title}</h1>
        <p className="ph-form-error" role="note">{COPY.blocked}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="ph-page-title">{COPY.title}</h1>

      {isLoading && <p className="ph-state">{COPY.loading}</p>}
      {isError && <p className="ph-state">{COPY.error}</p>}
      {savedKey && <div className="ph-form-success" role="status">{COPY.saved}</div>}

      <div className="ph-form" style={{ gap: '1rem' }}>
        {data?.map((setting) => (
          <SettingRow key={setting.id} setting={setting} onSaved={() => setSavedKey(setting.key)} />
        ))}
      </div>
    </div>
  );
}
