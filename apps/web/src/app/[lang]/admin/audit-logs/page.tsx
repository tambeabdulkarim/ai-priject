'use client';

// Audit Logs — GET /admin/audit-logs (`audit:read`, admin/superadmin).
// Filters (actor UUID / action / target_type / date range) are all
// exact-match server-side (audit-logs.repository.ts uses plain Prisma
// equality, never `contains`) — the "Search" label below is deliberately
// framed as exact filters, not fuzzy search, to match real behavior.
//
// "Detail view" (item 2 of this phase's spec) is an inline expand of a
// row already in hand from the list — there is no
// `GET /admin/audit-logs/:id` endpoint in the real backend, so no
// separate detail route/fetch was built; expanding a row only reveals
// `beforeState`/`afterState` JSON already present in the list response.

import { useState } from 'react';
import { ChevronDown, ChevronUp, History } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Loading';
import { useAuditLogsInfinite } from '../../../../hooks/useModeration';
import { getErrorMessage } from '../../../../utils/errors';
import type { ListAuditLogsQuery } from '@phoenix/types';

const COPY = {
  title: 'سجل التدقيق',
  actor: 'معرّف الفاعل (UUID)',
  action: 'الإجراء',
  targetType: 'نوع الهدف',
  from: 'من',
  to: 'إلى',
  apply: 'تطبيق التصفية',
  exactNote:
    'كل عوامل التصفية أعلاه مطابقة تامة (exact match) في الخادم الحقيقي — وليست بحثًا تقريبيًا.',
  loading: 'جارٍ التحميل...',
  error: 'تعذّر التحميل.',
  empty: 'لا توجد سجلات مطابقة.',
  loadMore: 'تحميل المزيد...',
  details: 'التفاصيل',
  before: 'قبل',
  after: 'بعد',
} as const;

export default function AdminAuditLogsPage() {
  const [filters, setFilters] = useState<Omit<ListAuditLogsQuery, 'cursor' | 'limit'>>({});
  const [draft, setDraft] = useState<Omit<ListAuditLogsQuery, 'cursor' | 'limit'>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const query = useAuditLogsInfinite(filters);
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  function handleApply() {
    setFilters(draft);
  }

  return (
    <div>
      <h1 className="ph-page-title">{COPY.title}</h1>

      <div
        className="ph-form"
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}
      >
        <div className="ph-field">
          <label className="ph-label" htmlFor="actor">
            {COPY.actor}
          </label>
          <input
            id="actor"
            className="ph-input"
            value={draft.actor ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, actor: e.target.value || undefined }))}
          />
        </div>
        <div className="ph-field">
          <label className="ph-label" htmlFor="action">
            {COPY.action}
          </label>
          <input
            id="action"
            className="ph-input"
            value={draft.action ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, action: e.target.value || undefined }))}
          />
        </div>
        <div className="ph-field">
          <label className="ph-label" htmlFor="targetType">
            {COPY.targetType}
          </label>
          <input
            id="targetType"
            className="ph-input"
            value={draft.target_type ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, target_type: e.target.value || undefined }))}
          />
        </div>
        <div className="ph-field">
          <label className="ph-label" htmlFor="from">
            {COPY.from}
          </label>
          <input
            id="from"
            type="date"
            className="ph-input"
            value={draft.from ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value || undefined }))}
          />
        </div>
        <div className="ph-field">
          <label className="ph-label" htmlFor="to">
            {COPY.to}
          </label>
          <input
            id="to"
            type="date"
            className="ph-input"
            value={draft.to ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value || undefined }))}
          />
        </div>
        <button type="button" className="ph-btn-grad" onClick={handleApply}>
          {COPY.apply}
        </button>
      </div>
      <p className="ph-page-subtitle">{COPY.exactNote}</p>

      {query.isLoading && <SkeletonTable rows={8} columns={4} />}
      {query.isError && <p className="ph-state">{getErrorMessage(query.error)}</p>}
      {query.data && items.length === 0 && (
        <EmptyState icon={<History size={24} strokeWidth={1.5} />} title={COPY.empty} />
      )}

      <div className="ph-form" style={{ gap: '0.5rem', marginTop: '1rem' }}>
        {items.map((entry) => (
          <div key={entry.id} className="ph-catalogue-card" style={{ cursor: 'default' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{entry.action}</strong> — {entry.targetType} ({entry.targetId})
                <div className="ph-catalogue-card-meta">
                  {entry.actorUserId ?? '—'} · {new Date(entry.occurredAt).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                className="ph-btn-outline"
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              >
                {COPY.details}{' '}
                {expandedId === entry.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
            {expandedId === entry.id && (
              <div
                style={{
                  marginTop: '0.75rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}
              >
                <div>
                  <strong>{COPY.before}</strong>
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {JSON.stringify(entry.beforeState, null, 2)}
                  </pre>
                </div>
                <div>
                  <strong>{COPY.after}</strong>
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {JSON.stringify(entry.afterState, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {query.hasNextPage && (
        <button
          type="button"
          className="ph-btn-outline"
          style={{ marginTop: '1rem' }}
          onClick={() => query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
        >
          {COPY.loadMore}
        </button>
      )}
    </div>
  );
}
