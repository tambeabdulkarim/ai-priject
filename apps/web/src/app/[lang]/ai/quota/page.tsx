'use client';

// Quota View — docs/16-API-CONTRACT.md GET /ai/usage/me. There is no
// dedicated quota endpoint in the real backend — `quotaLimit` is one
// field bundled into the usage response (packages/types/src/ai.ts).
// Every value below is rendered EXACTLY as the backend returns it —
// no "remaining quota" (quotaLimit − requestsUsed) is computed here,
// per this phase's explicit "never calculate quota client-side" rule;
// the backend itself never exposes a remaining-quota figure, and
// inventing one would risk silently diverging from whatever
// enforcement logic (none currently exists) the backend might apply.

import { useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { RequireAuth } from '../../../../guards/RequireAuth';
import { useAiUsage } from '../../../../hooks/useAi';
import { getErrorMessage } from '../../../../utils/errors';

const COPY = {
  ar: {
    title: 'الحصة',
    subtitle: 'القيم كما وردت من الخادم تمامًا — لا يتم حساب أي رقم "متبقي" في الواجهة الأمامية.',
    periodStart: 'بداية الفترة',
    periodEnd: 'نهاية الفترة',
    requestsUsed: 'الطلبات المستخدمة',
    tokensUsed: 'الرموز المستخدمة',
    quotaLimit: 'حد الحصة',
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل بيانات الحصة.',
    notTracked: 'لا يوجد سجل حصة (AiUsage) لهذا المستخدم للفترة الحالية — لم يُنشئ الخادم أي سجل بعد، ولا توجد واجهة برمجية لإنشائه من الواجهة الأمامية.',
  },
  en: {
    title: 'Quota',
    subtitle: 'Values exactly as returned by the backend — no "remaining" figure is computed client-side.',
    periodStart: 'Period start',
    periodEnd: 'Period end',
    requestsUsed: 'Requests used',
    tokensUsed: 'Tokens used',
    quotaLimit: 'Quota limit',
    loading: 'Loading...',
    error: 'Couldn’t load quota data.',
    notTracked: 'No AiUsage row exists for this user for the current period — the backend hasn’t provisioned one yet, and there is no endpoint to create one from the frontend.',
  },
} as const;

function AiQuotaContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { data: usage, isLoading, isError, error } = useAiUsage();

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page ph-page-narrow">
        <h1 className="ph-page-title">{t.title}</h1>
        <p className="ph-page-subtitle">{t.subtitle}</p>

        {isLoading && <p className="ph-state">{t.loading}</p>}
        {isError && <p className="ph-state">{getErrorMessage(error)}</p>}

        {usage && usage.quotaLimit === null && <p className="ph-form-error" role="note">{t.notTracked}</p>}

        {usage && usage.quotaLimit !== null && (
          <div className="ph-form" style={{ gap: '0.75rem' }}>
            <p><strong>{t.periodStart}:</strong> {new Date(usage.periodStart).toLocaleString(locale)}</p>
            <p><strong>{t.periodEnd}:</strong> {new Date(usage.periodEnd).toLocaleString(locale)}</p>
            <p><strong>{t.requestsUsed}:</strong> {usage.requestsUsed}</p>
            <p><strong>{t.tokensUsed}:</strong> {usage.tokensUsed}</p>
            <p><strong>{t.quotaLimit}:</strong> {usage.quotaLimit}</p>
          </div>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function AiQuotaPage() {
  return (
    <RequireAuth>
      <AiQuotaContent />
    </RequireAuth>
  );
}
