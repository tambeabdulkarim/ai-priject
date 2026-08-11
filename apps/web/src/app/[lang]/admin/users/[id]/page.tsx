'use client';

// User Detail — GET /users/:id (`user:read`), PATCH /users/:id/status
// (`user:ban`), PATCH /users/:id/roles (`user:assign_role`, superadmin
// only — no explicit grant in prisma/seed.ts). No delete/deactivate
// action distinct from setting status to `deactivated` exists in the
// real backend (`User.deletedAt` is never written anywhere) — there is
// no separate "Delete account" button here, matching that gap exactly.
// No historical role-change timeline exists either — only the CURRENT
// role list is shown (see packages/types/src/users.ts's AdminUserDetail
// comment).

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../../../hooks/useAuth';
import {
  useAdminUserDetail,
  useUpdateUserStatus,
  useUpdateUserRoles,
} from '../../../../../hooks/useAdminUsers';
import { getErrorMessage } from '../../../../../utils/errors';
import { ROLE_ASSIGN_ROLES } from '../../../../../constants/routes';

const COPY = {
  loading: 'جارٍ التحميل...',
  notFound: 'لم يتم العثور على المستخدم.',
  email: 'البريد الإلكتروني',
  status: 'الحالة',
  roles: 'الأدوار',
  changeStatus: 'تغيير الحالة',
  reasonPlaceholder: 'السبب (اختياري)',
  save: 'حفظ',
  saving: 'جارٍ الحفظ...',
  saved: 'تم الحفظ.',
  roleEditor: 'تعديل الأدوار (معرّفات الأدوار مفصولة بفواصل)',
  roleEditorBlocked:
    'تغيير الأدوار يتطلب صلاحية "superadmin" في الخادم الحقيقي (user:assign_role غير ممنوحة صراحةً لدور admin في prisma/seed.ts).',
  noRoleHistory: 'لا يوجد سجل تاريخي لتغييرات الأدوار في الخادم الحقيقي — يُعرض الدور الحالي فقط.',
  noDeleteNote:
    'لا يوجد إجراء "حذف الحساب" منفصل في الخادم الحقيقي — عمود deletedAt غير مستخدم في أي مكان؛ "تعطيل" هو أقصى ما يمكن فعله عبر تغيير الحالة.',
} as const;

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const { hasAnyRole } = useAuth();
  const { data: user, isLoading, isError } = useAdminUserDetail(params.id);
  const updateStatus = useUpdateUserStatus();
  const updateRoles = useUpdateUserRoles();

  const [status, setStatus] = useState<'active' | 'suspended' | 'deactivated'>('active');
  const [reason, setReason] = useState('');
  const [roleIdsInput, setRoleIdsInput] = useState('');
  const [statusInitialized, setStatusInitialized] = useState(false);

  if (user && !statusInitialized) {
    setStatus(user.status);
    setStatusInitialized(true);
  }

  const canAssignRoles = hasAnyRole([...ROLE_ASSIGN_ROLES]);

  if (isLoading) return <p className="ph-state">{COPY.loading}</p>;
  if (isError || !user) return <p className="ph-state">{COPY.notFound}</p>;

  function handleStatusSave() {
    updateStatus.mutate({ id: user!.id, status, reason: reason || undefined });
  }

  function handleRolesSave() {
    const roleIds = roleIdsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    updateRoles.mutate({ id: user!.id, roleIds });
  }

  return (
    <div>
      <h1 className="ph-page-title">{user.displayName}</h1>
      <p>
        {COPY.email}: {user.email}
      </p>
      <p>
        {COPY.status}: {user.status}
      </p>
      <p>
        {COPY.roles}: {user.roles.join(', ')}
      </p>
      <p className="ph-form-error" role="note">
        {COPY.noRoleHistory}
      </p>
      <p className="ph-form-error" role="note">
        {COPY.noDeleteNote}
      </p>

      <section style={{ marginTop: '2rem' }}>
        <h2 className="ph-catalogue-card-title">{COPY.changeStatus}</h2>
        {updateStatus.error && (
          <div className="ph-form-error" role="alert">
            {getErrorMessage(updateStatus.error)}
          </div>
        )}
        {updateStatus.isSuccess && !updateStatus.data?.error && (
          <div className="ph-form-success" role="status">
            {COPY.saved}
          </div>
        )}
        <div
          className="ph-form"
          style={{ flexDirection: 'row', gap: '0.5rem', alignItems: 'flex-end' }}
        >
          <select
            className="ph-input"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="active">active</option>
            <option value="suspended">suspended</option>
            <option value="deactivated">deactivated</option>
          </select>
          <input
            className="ph-input"
            placeholder={COPY.reasonPlaceholder}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            type="button"
            className="ph-btn-grad"
            onClick={handleStatusSave}
            disabled={updateStatus.isPending}
          >
            {updateStatus.isPending ? COPY.saving : COPY.save}
          </button>
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2 className="ph-catalogue-card-title">{COPY.roleEditor}</h2>
        {!canAssignRoles && (
          <p className="ph-form-error" role="note">
            {COPY.roleEditorBlocked}
          </p>
        )}
        {canAssignRoles && (
          <>
            {updateRoles.error && (
              <div className="ph-form-error" role="alert">
                {getErrorMessage(updateRoles.error)}
              </div>
            )}
            {updateRoles.isSuccess && !updateRoles.data?.error && (
              <div className="ph-form-success" role="status">
                {COPY.saved}
              </div>
            )}
            <div
              className="ph-form"
              style={{ flexDirection: 'row', gap: '0.5rem', alignItems: 'flex-end' }}
            >
              <input
                className="ph-input"
                value={roleIdsInput}
                onChange={(e) => setRoleIdsInput(e.target.value)}
              />
              <button
                type="button"
                className="ph-btn-grad"
                onClick={handleRolesSave}
                disabled={updateRoles.isPending}
              >
                {updateRoles.isPending ? COPY.saving : COPY.save}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
