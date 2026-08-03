'use client';

// Analytics — GET /admin/analytics/overview (`analytics:read`,
// admin/superadmin). A single flat overview object for an explicit date
// range (both `from`/`to` required) — revenue, completion rate, DAU,
// MAU. No breakdown/segmentation endpoint exists anywhere in the real
// backend (verified: only these 6 admin-module files reference
// "analytics" in the whole apps/api/src tree), so no per-course/
// per-instructor/per-cohort view is offered here — a single overview
// card is the full extent of what the backend can produce.

import { useState } from 'react';
import { DollarSign, CheckCircle2, Users2, Activity } from 'lucide-react';
import { useAnalyticsOverview } from '../../../../hooks/useAnalytics';
import { getErrorMessage } from '../../../../utils/errors';

const COPY = {
  title: 'التحليلات',
  subtitle: 'مقياس إجمالي واحد للفترة المحددة — لا توجد تفصيلات فرعية (حسب الدورة أو المدرّس) في الخادم الحقيقي.',
  from: 'من',
  to: 'إلى',
  revenue: 'الإيرادات',
  completion: 'نسبة الإكمال',
  dau: 'مستخدمون نشطون يوميًا',
  mau: 'مستخدمون نشطون شهريًا',
  loading: 'جارٍ التحميل...',
  error: 'تعذّر تحميل التحليلات.',
} as const;

function defaultFrom() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminAnalyticsPage() {
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());
  const { data, isLoading, isError, error } = useAnalyticsOverview({ from, to });

  return (
    <div>
      <h1 className="ph-page-title">{COPY.title}</h1>
      <p className="ph-page-subtitle">{COPY.subtitle}</p>

      <div className="ph-form" style={{ flexDirection: 'row', gap: '1rem', alignItems: 'flex-end' }}>
        <div className="ph-field">
          <label className="ph-label" htmlFor="from">{COPY.from}</label>
          <input id="from" type="date" className="ph-input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="ph-field">
          <label className="ph-label" htmlFor="to">{COPY.to}</label>
          <input id="to" type="date" className="ph-input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {isLoading && <p className="ph-state">{COPY.loading}</p>}
      {isError && <p className="ph-state">{getErrorMessage(error)}</p>}

      {data && (
        <div className="ph-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginTop: '1.5rem' }}>
          <div className="ph-catalogue-card" style={{ cursor: 'default' }}>
            <DollarSign size={20} strokeWidth={1.5} aria-hidden="true" />
            <div className="ph-catalogue-card-title">{COPY.revenue}</div>
            <p className="ph-catalogue-card-desc">{(data.revenue_cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</p>
          </div>
          <div className="ph-catalogue-card" style={{ cursor: 'default' }}>
            <CheckCircle2 size={20} strokeWidth={1.5} aria-hidden="true" />
            <div className="ph-catalogue-card-title">{COPY.completion}</div>
            <p className="ph-catalogue-card-desc">{data.completion_rate}%</p>
          </div>
          <div className="ph-catalogue-card" style={{ cursor: 'default' }}>
            <Activity size={20} strokeWidth={1.5} aria-hidden="true" />
            <div className="ph-catalogue-card-title">{COPY.dau}</div>
            <p className="ph-catalogue-card-desc">{data.dau}</p>
          </div>
          <div className="ph-catalogue-card" style={{ cursor: 'default' }}>
            <Users2 size={20} strokeWidth={1.5} aria-hidden="true" />
            <div className="ph-catalogue-card-title">{COPY.mau}</div>
            <p className="ph-catalogue-card-desc">{data.mau}</p>
          </div>
        </div>
      )}
    </div>
  );
}
