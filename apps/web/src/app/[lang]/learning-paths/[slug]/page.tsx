'use client';

// docs/16-API-CONTRACT.md GET /learning-paths/:slug, via
// hooks/useLearningPaths.ts. `courses` is already ordered by `position`
// server-side (LearningPathsRepository.findBySlug) — rendered in the
// order the API returns it, never re-sorted client-side.

import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { ApiError } from '@phoenix/api-client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { type Locale } from '@/lib/i18n';
import { useLearningPath } from '../../../../hooks/useLearningPaths';
import { getErrorMessage } from '../../../../utils/errors';
import { ROUTES, withLang } from '../../../../constants/routes';

const COPY = {
  ar: {
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل مسار التعلّم.',
    courses: 'دورات هذا المسار',
    free: 'مجانًا',
    open: 'فتح الدورة',
  },
  en: {
    loading: 'Loading...',
    error: 'Couldn’t load this learning path.',
    courses: 'Courses in this path',
    free: 'Free',
    open: 'Open course',
  },
} as const;

function formatPrice(cents: number, locale: Locale, freeLabel: string): string {
  if (cents <= 0) return freeLabel;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function LearningPathDetailPage() {
  const params = useParams<{ lang: string; slug: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { data: path, error, isLoading } = useLearningPath(params.slug);

  if (error instanceof ApiError && error.code === 'RESOURCE_NOT_FOUND') {
    notFound();
  }

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        {isLoading && <p className="ph-state">{t.loading}</p>}
        {error && !(error instanceof ApiError && error.code === 'RESOURCE_NOT_FOUND') && (
          <p className="ph-state">{getErrorMessage(error)}</p>
        )}

        {path && (
          <>
            <header className="ph-detail-header">
              <h1 className="ph-page-title">{path.title}</h1>
              {path.description && <p className="ph-page-subtitle">{path.description}</p>}
              <div className="ph-detail-meta">
                <StatusBadge status={path.status} locale={locale} />
              </div>
            </header>

            <h2 className="ph-catalogue-card-title">{t.courses}</h2>
            <ol className="ph-grid" style={{ listStyle: 'none', padding: 0 }}>
              {path.courses.map((entry, index) => (
                <li key={entry.id} className="ph-catalogue-card">
                  <div className="ph-catalogue-card-meta">
                    <span>
                      {index + 1}. {t.open}
                    </span>
                  </div>
                  <h3 className="ph-catalogue-card-title">{entry.course.title}</h3>
                  {entry.course.description && (
                    <p className="ph-catalogue-card-desc">{entry.course.description}</p>
                  )}
                  <div className="ph-catalogue-card-meta">
                    <span>{formatPrice(entry.course.priceCents, locale, t.free)}</span>
                  </div>
                  <Link
                    href={withLang(ROUTES.courseDetail, locale).replace('[slug]', entry.course.slug)}
                    className="ph-btn-outline"
                  >
                    {t.open}
                  </Link>
                </li>
              ))}
            </ol>
          </>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
