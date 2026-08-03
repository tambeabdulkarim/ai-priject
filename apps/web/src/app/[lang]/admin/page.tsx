'use client';

// Admin Dashboard. Rendered inside app/[lang]/admin/layout.tsx (already
// gates ADMIN_ROLES and renders Navigation/Sidebar/Breadcrumbs/Footer).
//
// Only ONE real metrics source exists for an admin overview:
// GET /admin/analytics/overview (revenue/completion-rate/DAU/MAU over an
// explicit date range — both `from`/`to` required by the DTO). There is
// no "total users", "total courses", or "pending review count" metric
// anywhere in the backend (no `total`/count field on any paginated
// response — see hooks/useModeration.ts's queue-count caveat from the
// Moderator phase, which applies identically here). Rather than
// fabricate those numbers, this dashboard shows only the real analytics
// overview plus an explicit note on what isn't available, with links to
// the pages where the real (uncounted) lists can be browsed directly.

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DollarSign, CheckCircle2, Users2, Activity } from 'lucide-react';
import { type Locale } from '@/lib/i18n';
import { useAnalyticsOverview } from '../../../hooks/useAnalytics';
import { getErrorMessage } from '../../../utils/errors';
import { ROUTES, withLang } from '../../../constants/routes';

const COPY = {
  ar: {
    title: 'لوحة تحكم المشرف العام',
    subtitle: 'نظرة عامة على التحليلات الحقيقية للمنصة.',
    from: 'من',
    to: 'إلى',
    revenue: 'الإيرادات',
    completion: 'نسبة الإكمال',
    dau: 'مستخدمون نشطون يوميًا',
    mau: 'مستخدمون نشطون شهريًا',
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل التحليلات.',
    notice: 'لا توجد واجهة برمجية في الخادم لعرض "إجمالي المستخدمين" أو "عدد الدورات" أو أي عدد إجمالي آخر — لا يحمل أي رد مُقسّم إلى صفحات حقل "total" في هذا الخادم. تصفح القوائم الحقيقية مباشرة:',
    users: 'المستخدمون',
    auditLogs: 'سجل التدقيق',
  },
  en: {
    title: 'Admin dashboard',
    subtitle: 'Real platform analytics overview.',
    from: 'From',
    to: 'To',
    revenue: 'Revenue',
    completion: 'Completion rate',
    dau: 'Daily active users',
    mau: 'Monthly active users',
    loading: 'Loading...',
    error: 'Couldn’t load analytics.',
    notice: 'No backend endpoint exposes a "total users" count, "total courses" count, or any other grand total — no paginated response on this backend carries a `total` field. Browse the real lists directly instead:',
    users: 'Users',
    auditLogs: 'Audit logs',
  },
} as const;

function defaultFrom() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminDashboardPage() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;

  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());
  const { data, isLoading, isError, error } = useAnalyticsOverview({ from, to });

  return (
    <div>
      <h1 className="ph-page-title">{t.title}</h1>
      <p className="ph-page-subtitle">{t.subtitle}</p>

      <div className="ph-form" style={{ flexDirection: 'row', gap: '1rem', alignItems: 'flex-end' }}>
        <div className="ph-field">
          <label className="ph-label" htmlFor="from">{t.from}</label>
          <input id="from" type="date" className="ph-input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="ph-field">
          <label className="ph-label" htmlFor="to">{t.to}</label>
          <input id="to" type="date" className="ph-input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {isLoading && <p className="ph-state">{t.loading}</p>}
      {isError && <p className="ph-state">{getErrorMessage(error)}</p>}

      {data && (
        <div className="ph-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginTop: '1.5rem' }}>
          <div className="ph-catalogue-card" style={{ cursor: 'default' }}>
            <DollarSign size={20} strokeWidth={1.5} aria-hidden="true" />
            <div className="ph-catalogue-card-title">{t.revenue}</div>
            <p className="ph-catalogue-card-desc">{(data.revenue_cents / 100).toLocaleString(locale, { style: 'currency', currency: 'USD' })}</p>
          </div>
          <div className="ph-catalogue-card" style={{ cursor: 'default' }}>
            <CheckCircle2 size={20} strokeWidth={1.5} aria-hidden="true" />
            <div className="ph-catalogue-card-title">{t.completion}</div>
            <p className="ph-catalogue-card-desc">{data.completion_rate}%</p>
          </div>
          <div className="ph-catalogue-card" style={{ cursor: 'default' }}>
            <Activity size={20} strokeWidth={1.5} aria-hidden="true" />
            <div className="ph-catalogue-card-title">{t.dau}</div>
            <p className="ph-catalogue-card-desc">{data.dau}</p>
          </div>
          <div className="ph-catalogue-card" style={{ cursor: 'default' }}>
            <Users2 size={20} strokeWidth={1.5} aria-hidden="true" />
            <div className="ph-catalogue-card-title">{t.mau}</div>
            <p className="ph-catalogue-card-desc">{data.mau}</p>
          </div>
        </div>
      )}

      <div className="ph-form-error" style={{ marginTop: '2rem' }} role="note">
        <p>{t.notice}</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <Link href={withLang(ROUTES.adminUsers, locale)}>{t.users}</Link>
          <Link href={withLang(ROUTES.adminAuditLogs, locale)}>{t.auditLogs}</Link>
        </div>
      </div>
    </div>
  );
}
