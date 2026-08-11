'use client';

// User Administration — list/search. GET /users (`user:list`,
// admin/superadmin). `status`/`role` are exact filters; `q` is a raw
// Postgres `ILIKE` substring match on email/displayName (DB-level, not a
// search index) — framed as such, not "smart search".

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Users } from 'lucide-react';
import { type Locale } from '@/lib/i18n';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonGrid } from '@/components/ui/Loading';
import { useAdminUsersList } from '../../../../hooks/useAdminUsers';
import { ROUTES, withLang } from '../../../../constants/routes';
import type { ListUsersQuery } from '@phoenix/types';

const COPY = {
  ar: {
    title: 'إدارة المستخدمين',
    search: 'بحث بالبريد أو الاسم (مطابقة جزئية)',
    status: 'الحالة',
    role: 'الدور',
    all: 'الكل',
    active: 'نشط',
    suspended: 'موقوف',
    deactivated: 'معطّل',
    loading: 'جارٍ التحميل...',
    error: 'تعذّر التحميل.',
    empty: 'لا يوجد مستخدمون.',
    loadMore: 'تحميل المزيد...',
    testData: 'بيانات اختبار',
  },
  en: {
    title: 'User administration',
    search: 'Search by email or name (partial match)',
    status: 'Status',
    role: 'Role',
    all: 'All',
    active: 'Active',
    suspended: 'Suspended',
    deactivated: 'Deactivated',
    loading: 'Loading...',
    error: 'Couldn’t load.',
    empty: 'No users.',
    loadMore: 'Load more...',
    testData: 'Test data',
  },
} as const;

export default function AdminUsersPage() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<ListUsersQuery['status'] | ''>('');
  const [role, setRole] = useState('');
  const { data, isLoading, isError } = useAdminUsersList({
    q: q || undefined,
    status: status || undefined,
    role: role || undefined,
    limit: 50,
  });

  return (
    <div>
      <h1 className="ph-page-title">{t.title}</h1>

      <div
        className="ph-form"
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}
      >
        <div className="ph-field">
          <label className="ph-label" htmlFor="q">
            {t.search}
          </label>
          <input id="q" className="ph-input" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="ph-field">
          <label className="ph-label" htmlFor="status">
            {t.status}
          </label>
          <select
            id="status"
            className="ph-input"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="">{t.all}</option>
            <option value="active">{t.active}</option>
            <option value="suspended">{t.suspended}</option>
            <option value="deactivated">{t.deactivated}</option>
          </select>
        </div>
        <div className="ph-field">
          <label className="ph-label" htmlFor="role">
            {t.role}
          </label>
          <input
            id="role"
            className="ph-input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
      </div>

      {isLoading && <SkeletonGrid count={8} />}
      {isError && <p className="ph-state">{t.error}</p>}
      {data && data.items.length === 0 && (
        <EmptyState icon={<Users size={24} strokeWidth={1.5} />} title={t.empty} />
      )}

      <div className="ph-grid" style={{ marginTop: '1rem' }}>
        {data?.items.map((user) => (
          <Link
            key={user.id}
            href={withLang(ROUTES.adminUserDetail, locale).replace('[id]', user.id)}
            className="ph-catalogue-card"
          >
            <h3 className="ph-catalogue-card-title">{user.displayName}</h3>
            <div className="ph-catalogue-card-meta">{user.email}</div>
            <div
              className="ph-catalogue-card-meta"
              style={{ marginTop: '0.5rem', flexWrap: 'wrap' }}
            >
              <StatusBadge status={user.status} locale={locale} />
              {user.isTestData && <span className="ph-test-data-badge">{t.testData}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
