'use client';

// docs/16-API-CONTRACT.md GET /certificates/me, via hooks/useCertificates.ts.

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Award } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { EmptyState } from '@/components/ui/EmptyState';
import { type Locale } from '@/lib/i18n';
import { RequireAuth } from '../../../guards/RequireAuth';
import { useCertificatesList } from '../../../hooks/useCertificates';
import { ROUTES, withLang } from '../../../constants/routes';

const COPY = {
  ar: {
    title: 'شهاداتي',
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل الشهادات.',
    emptyTitle: 'لا توجد شهادات بعد',
    emptyDesc: 'أكمل دورة للحصول على شهادتك الأولى.',
    goToCourses: 'الذهاب إلى دوراتي',
    issued: 'صدرت في',
  },
  en: {
    title: 'My certificates',
    loading: 'Loading...',
    error: 'Couldn’t load your certificates.',
    emptyTitle: 'No certificates yet',
    emptyDesc: 'Complete a course to earn your first one.',
    goToCourses: 'Go to My Courses',
    issued: 'Issued',
  },
} as const;

function CertificatesContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { data, isLoading, isError } = useCertificatesList();

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        <h1 className="ph-page-title">{t.title}</h1>

        {isLoading && <p className="ph-state">{t.loading}</p>}
        {isError && <p className="ph-state">{t.error}</p>}
        {!isLoading && !isError && (data?.items.length ?? 0) === 0 && (
          <EmptyState
            icon={<Award size={24} strokeWidth={1.5} />}
            title={t.emptyTitle}
            description={t.emptyDesc}
            primaryAction={{ label: t.goToCourses, href: withLang(ROUTES.myCourses, locale) }}
          />
        )}

        <div className="ph-grid">
          {data?.items.map((certificate) => (
            <Link
              key={certificate.id}
              href={withLang(ROUTES.certificateDetail, locale).replace('[id]', certificate.id)}
              className="ph-catalogue-card"
            >
              <Award size={24} strokeWidth={1.5} aria-hidden="true" />
              <h2 className="ph-catalogue-card-title">{certificate.certificateNumber}</h2>
              <div className="ph-catalogue-card-meta">
                <span>
                  {t.issued} {new Date(certificate.issuedAt).toLocaleDateString(locale)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function CertificatesPage() {
  return (
    <RequireAuth>
      <CertificatesContent />
    </RequireAuth>
  );
}
