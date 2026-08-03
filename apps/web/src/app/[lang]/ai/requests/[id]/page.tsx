'use client';

// AI Request Viewer — docs/16-API-CONTRACT.md GET /ai/requests/:id,
// authenticated resource-owner only. Renders every field the real
// `AiRequest` row exposes, exactly as returned: `status` is one of the
// real three schema values (`success | error | moderation_blocked`) —
// no other status is ever invented here. `promptRedacted`/
// `responseRedacted` are shown as-is; the backend never returns the raw
// prompt/response at all (see packages/types/src/ai.ts).

import { useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { RequireAuth } from '../../../../../guards/RequireAuth';
import { useAiRequest } from '../../../../../hooks/useAi';
import { getErrorMessage } from '../../../../../utils/errors';

const COPY = {
  ar: {
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل هذا الطلب.',
    feature: 'الميزة',
    status: 'الحالة',
    statusValues: { success: 'نجاح', error: 'خطأ', moderation_blocked: 'محظور (إشراف)' } as Record<string, string>,
    inputTokens: 'رموز الإدخال',
    outputTokens: 'رموز الإخراج',
    latency: 'زمن الاستجابة (مللي ثانية)',
    prompt: 'المُدخل (مُنقّح)',
    response: 'الاستجابة (مُنقّحة)',
    cost: 'التكلفة',
    createdAt: 'تاريخ الإنشاء',
    noValue: '—',
  },
  en: {
    loading: 'Loading...',
    error: 'Couldn’t load this request.',
    feature: 'Feature',
    status: 'Status',
    statusValues: { success: 'Success', error: 'Error', moderation_blocked: 'Blocked (moderation)' } as Record<string, string>,
    inputTokens: 'Input tokens',
    outputTokens: 'Output tokens',
    latency: 'Latency (ms)',
    prompt: 'Prompt (redacted)',
    response: 'Response (redacted)',
    cost: 'Cost',
    createdAt: 'Created at',
    noValue: '—',
  },
} as const;

function AiRequestDetailContent() {
  const params = useParams<{ lang: string; id: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { data: request, isLoading, isError, error } = useAiRequest(params.id);

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page ph-page-narrow">
        <h1 className="ph-page-title">{t.feature}</h1>

        {isLoading && <p className="ph-state">{t.loading}</p>}
        {isError && <p className="ph-state">{getErrorMessage(error)}</p>}

        {request && (
          <div className="ph-form" style={{ gap: '0.75rem' }}>
            <p><strong>{t.feature}:</strong> {request.feature}</p>
            <p><strong>{t.status}:</strong> {t.statusValues[request.status] ?? request.status}</p>
            <p><strong>{t.inputTokens}:</strong> {request.inputTokens ?? t.noValue}</p>
            <p><strong>{t.outputTokens}:</strong> {request.outputTokens ?? t.noValue}</p>
            <p><strong>{t.latency}:</strong> {request.latencyMs ?? t.noValue}</p>
            <p><strong>{t.createdAt}:</strong> {new Date(request.createdAt).toLocaleString(locale)}</p>

            <div>
              <strong>{t.prompt}:</strong>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{request.promptRedacted ?? t.noValue}</pre>
            </div>
            <div>
              <strong>{t.response}:</strong>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{request.responseRedacted ?? t.noValue}</pre>
            </div>

            {request.cost && (
              <p><strong>{t.cost}:</strong> ${request.cost.providerCostUsd} ({new Date(request.cost.billedAt).toLocaleString(locale)})</p>
            )}
          </div>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function AiRequestDetailPage() {
  return (
    <RequireAuth>
      <AiRequestDetailContent />
    </RequireAuth>
  );
}
