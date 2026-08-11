'use client';

// AI Dashboard — docs/16-API-CONTRACT.md §15 (AI).
//
// REAL BACKEND GAPS reflected here, not worked around:
//  - "Recent requests" per the task spec cannot be a list: there is no
//    list/history endpoint anywhere in the backend (not even documented
//    — doc16's AI section only ever specifies create/get-by-id/usage).
//    The only way to view a specific request is `GET /ai/requests/:id`,
//    for a known id — this page offers a manual "look up by id" form
//    instead of fabricating a history list.
//  - "Current usage" / "remaining quota" both come from the single real
//    `GET /ai/usage/me` response — never computed client-side. A real
//    zero/null state (no `AiUsage` row provisioned yet) is rendered as
//    an explicit "not tracked yet" state, not a fake zero.
//  - The "Try an AI request" action below calls the REAL
//    `POST /ai/requests` endpoint, which always returns HTTP 501 (see
//    packages/types/src/ai.ts) — demonstrating the Blocked Request UI
//    against a genuine backend response, not a simulated one. No
//    automatic retry.

import { useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Gauge, History, FlaskConical } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { RequireAuth } from '../../../guards/RequireAuth';
import { useAiUsage, useCreateAiRequest } from '../../../hooks/useAi';
import { BlockedRequestNotice } from '../../../components/ai/BlockedRequestNotice';
import { ROUTES, withLang } from '../../../constants/routes';

const COPY = {
  ar: {
    title: 'مساحة الذكاء الاصطناعي',
    subtitle: 'نظرة عامة حقيقية على الاستخدام والحصة — من الخادم فقط.',
    usageTitle: 'الاستخدام الحالي',
    requestsUsed: 'الطلبات المستخدمة',
    tokensUsed: 'الرموز المستخدمة',
    quotaLimit: 'حد الحصة',
    notTracked:
      'لم يتم رصد أي استخدام لهذه الفترة بعد — لا يوجد سجل حصة (AiUsage) لهذا المستخدم حاليًا.',
    viewQuota: 'عرض تفاصيل الحصة',
    lookupTitle: 'عرض طلب محدد',
    lookupDesc:
      'لا توجد واجهة برمجية لعرض قائمة الطلبات السابقة — أدخل معرّف طلب (UUID) تعرفه مسبقًا لعرض تفاصيله.',
    requestIdPlaceholder: 'معرّف الطلب (UUID)',
    view: 'عرض',
    tryTitle: 'تجربة إنشاء طلب ذكاء اصطناعي',
    tryDesc:
      'يستدعي هذا زر نقطة النهاية الحقيقية POST /ai/requests. سترى دائمًا خطأ 501 حقيقيًا من الخادم — هذه ميزة محظورة حسب التوثيق حاليًا، وليست عطلًا مؤقتًا.',
    tryButton: 'جرّب الآن (سيفشل بشكل متوقع)',
    trying: 'جارٍ الإرسال...',
  },
  en: {
    title: 'AI Workspace',
    subtitle: 'A real usage/quota overview — backend-sourced only.',
    usageTitle: 'Current usage',
    requestsUsed: 'Requests used',
    tokensUsed: 'Tokens used',
    quotaLimit: 'Quota limit',
    notTracked:
      'No usage has been tracked for this period yet — this user has no AiUsage row right now.',
    viewQuota: 'View quota details',
    lookupTitle: 'View a specific request',
    lookupDesc:
      'There is no endpoint to list past requests — enter a request ID (UUID) you already know to view its details.',
    requestIdPlaceholder: 'Request ID (UUID)',
    view: 'View',
    tryTitle: 'Try creating an AI request',
    tryDesc:
      'This button calls the real POST /ai/requests endpoint. You will always see a genuine 501 error from the backend — this is a feature currently blocked by documentation, not a transient outage.',
    tryButton: 'Try it now (expected to fail)',
    trying: 'Sending...',
  },
} as const;

function AiDashboardContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const router = useRouter();

  const { data: usage, isLoading: usageLoading } = useAiUsage();
  const tryRequest = useCreateAiRequest();
  const [requestId, setRequestId] = useState('');

  function handleLookup(event: FormEvent) {
    event.preventDefault();
    if (!requestId.trim()) return;
    router.push(withLang(ROUTES.aiRequestDetail, locale).replace('[id]', requestId.trim()));
  }

  function handleTryRequest() {
    tryRequest.mutate({ feature: 'demo', input: {} });
  }

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        <h1 className="ph-page-title">{t.title}</h1>
        <p className="ph-page-subtitle">{t.subtitle}</p>

        <section>
          <h2
            className="ph-catalogue-card-title"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Gauge size={18} strokeWidth={1.5} aria-hidden="true" /> {t.usageTitle}
          </h2>
          {usageLoading && <p className="ph-state">…</p>}
          {usage && usage.quotaLimit === null && (
            <p className="ph-form-error" role="note">
              {t.notTracked}
            </p>
          )}
          {usage && usage.quotaLimit !== null && (
            <div
              className="ph-grid"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
            >
              <div className="ph-catalogue-card" style={{ cursor: 'default' }}>
                <div className="ph-catalogue-card-title">{t.requestsUsed}</div>
                <p className="ph-catalogue-card-desc">{usage.requestsUsed}</p>
              </div>
              <div className="ph-catalogue-card" style={{ cursor: 'default' }}>
                <div className="ph-catalogue-card-title">{t.tokensUsed}</div>
                <p className="ph-catalogue-card-desc">{usage.tokensUsed}</p>
              </div>
              <div className="ph-catalogue-card" style={{ cursor: 'default' }}>
                <div className="ph-catalogue-card-title">{t.quotaLimit}</div>
                <p className="ph-catalogue-card-desc">{usage.quotaLimit}</p>
              </div>
            </div>
          )}
          <a
            href={withLang(ROUTES.aiQuota, locale)}
            className="ph-btn-outline"
            style={{ marginTop: '1rem', display: 'inline-flex' }}
          >
            {t.viewQuota}
          </a>
        </section>

        <section style={{ marginTop: '2.5rem' }}>
          <h2
            className="ph-catalogue-card-title"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <History size={18} strokeWidth={1.5} aria-hidden="true" /> {t.lookupTitle}
          </h2>
          <p className="ph-form-error" role="note">
            {t.lookupDesc}
          </p>
          <form
            className="ph-form"
            style={{ flexDirection: 'row', gap: '0.5rem' }}
            onSubmit={handleLookup}
          >
            <input
              className="ph-input"
              placeholder={t.requestIdPlaceholder}
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
            />
            <button type="submit" className="ph-btn-grad">
              {t.view}
            </button>
          </form>
        </section>

        <section style={{ marginTop: '2.5rem' }}>
          <h2
            className="ph-catalogue-card-title"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <FlaskConical size={18} strokeWidth={1.5} aria-hidden="true" /> {t.tryTitle}
          </h2>
          <p className="ph-page-subtitle">{t.tryDesc}</p>
          <button
            type="button"
            className="ph-btn-outline"
            onClick={handleTryRequest}
            disabled={tryRequest.isPending}
          >
            {tryRequest.isPending ? t.trying : t.tryButton}
          </button>
          {tryRequest.error && (
            <div style={{ marginTop: '1rem' }}>
              <BlockedRequestNotice error={tryRequest.error} locale={locale} />
            </div>
          )}
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function AiDashboardPage() {
  return (
    <RequireAuth>
      <AiDashboardContent />
    </RequireAuth>
  );
}
