'use client';

// docs/16-API-CONTRACT.md GET /certificates/:id — owner-only,
// server-enforced. `pdfUrl` is expected to be `null` today: no
// PDF-rendering service exists in this backend (certificates.service.ts's
// own file header), so every certificate is issued with `pdfFileId: null`
// — this page shows that honestly rather than a broken download link.

import { notFound, useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { ApiError } from '@phoenix/api-client';
import { type Locale } from '@/lib/i18n';
import { RequireAuth } from '../../../../guards/RequireAuth';
import { useCertificate } from '../../../../hooks/useCertificates';
import { getErrorMessage } from '../../../../utils/errors';

const COPY = {
  ar: {
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل الشهادة.',
    number: 'رقم الشهادة',
    issued: 'تاريخ الإصدار',
    download: 'تحميل PDF',
    noPdf: 'لا يتوفر ملف PDF لهذه الشهادة حاليًا.',
  },
  en: {
    loading: 'Loading...',
    error: 'Couldn’t load this certificate.',
    number: 'Certificate number',
    issued: 'Issued on',
    download: 'Download PDF',
    noPdf: 'No PDF is available for this certificate yet.',
  },
} as const;

function CertificateDetailContent() {
  const params = useParams<{ lang: string; id: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { data: result, error, isLoading } = useCertificate(params.id);

  if (error instanceof ApiError && error.code === 'RESOURCE_NOT_FOUND') {
    notFound();
  }

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page ph-page-narrow">
        {isLoading && <p className="ph-state">{t.loading}</p>}
        {error && !(error instanceof ApiError && error.code === 'RESOURCE_NOT_FOUND') && (
          <p className="ph-state">{getErrorMessage(error)}</p>
        )}

        {result && (
          <div className="ph-module">
            <h1 className="ph-page-title">{result.certificate.certificateNumber}</h1>
            <div className="ph-lesson-row">
              <span>{t.number}</span>
              <span>{result.certificate.certificateNumber}</span>
            </div>
            <div className="ph-lesson-row">
              <span>{t.issued}</span>
              <span>{new Date(result.certificate.issuedAt).toLocaleDateString(locale)}</span>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              {result.pdfUrl ? (
                <a href={result.pdfUrl} className="ph-btn-grad" target="_blank" rel="noreferrer">
                  {t.download}
                </a>
              ) : (
                <p className="ph-state">{t.noPdf}</p>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function CertificateDetailPage() {
  return (
    <RequireAuth>
      <CertificateDetailContent />
    </RequireAuth>
  );
}
