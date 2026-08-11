'use client';

// docs/16-API-CONTRACT.md GET /certificates/verify/:certificateNumber —
// public, no auth (the one certificate endpoint that's `@Public()`),
// data-minimized per docs/13-DATABASE-BLUEPRINT.md's Certificates
// Security Notes ("no other user data"): only holder display name,
// course title, and issue date — never an email, user id, or anything
// else, matching exactly what the backend returns.

import { notFound, useParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { ApiError } from '@phoenix/api-client';
import { type Locale } from '@/lib/i18n';
import { useVerifyCertificate } from '../../../../../hooks/useCertificates';
import { getErrorMessage } from '../../../../../utils/errors';

const COPY = {
  ar: {
    title: 'التحقق من الشهادة',
    loading: 'جارٍ التحقق...',
    invalid: 'رقم الشهادة غير صالح أو الشهادة ملغاة.',
    valid: 'شهادة صالحة',
    holder: 'صادرة إلى',
    course: 'الدورة',
    issued: 'تاريخ الإصدار',
  },
  en: {
    title: 'Certificate verification',
    loading: 'Verifying...',
    invalid: 'This certificate number is invalid or has been revoked.',
    valid: 'Valid certificate',
    holder: 'Issued to',
    course: 'Course',
    issued: 'Issued on',
  },
} as const;

export default function VerifyCertificatePage() {
  const params = useParams<{ lang: string; certificateNumber: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { data, error, isLoading } = useVerifyCertificate(params.certificateNumber);

  if (error instanceof ApiError && error.code === 'RESOURCE_NOT_FOUND') {
    notFound();
  }

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page ph-page-narrow">
        <h1 className="ph-page-title">{t.title}</h1>

        {isLoading && <p className="ph-state">{t.loading}</p>}
        {error && !(error instanceof ApiError && error.code === 'RESOURCE_NOT_FOUND') && (
          <p className="ph-state">{getErrorMessage(error)}</p>
        )}

        {data && (
          <div className="ph-form-success">
            <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
              <CheckCircle2 size={20} aria-hidden="true" /> {t.valid}
            </p>
            <div className="ph-lesson-row">
              <span>{t.holder}</span>
              <span>{data.holderDisplayName}</span>
            </div>
            <div className="ph-lesson-row">
              <span>{t.course}</span>
              <span>{data.courseTitle}</span>
            </div>
            <div className="ph-lesson-row">
              <span>{t.issued}</span>
              <span>{new Date(data.issuedAt).toLocaleDateString(locale)}</span>
            </div>
          </div>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
