'use client';

// docs/16-API-CONTRACT.md GET /learning-paths, via hooks/useLearningPaths.ts.
// Public — no RequireAuth wrapper, matching the Courses list page's own
// visibility (a learner browses before signing in).

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Route } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonGrid } from '@/components/ui/Loading';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { type Locale } from '@/lib/i18n';
import { useLearningPathsList } from '../../../hooks/useLearningPaths';
import { getErrorMessage } from '../../../utils/errors';
import { ROUTES, withLang } from '../../../constants/routes';

const COPY = {
  ar: {
    title: 'مسارات التعلّم',
    subtitle: 'سلاسل دورات مرتّبة تأخذك من الأساسيات إلى الجاهزية الوظيفية.',
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل مسارات التعلّم.',
    empty: 'لا توجد مسارات تعلّم منشورة حاليًا.',
    courses: 'دورة',
  },
  en: {
    title: 'Learning Paths',
    subtitle: 'Ordered course sequences that take you from fundamentals to job-ready.',
    loading: 'Loading...',
    error: 'Couldn’t load learning paths.',
    empty: 'No learning paths are published yet.',
    courses: 'courses',
  },
} as const;

export default function LearningPathsListPage() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { data, error, isLoading } = useLearningPathsList();

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        <header className="ph-detail-header">
          <h1 className="ph-page-title">{t.title}</h1>
          <p className="ph-page-subtitle">{t.subtitle}</p>
        </header>

        {isLoading && <SkeletonGrid count={3} />}
        {error && <p className="ph-state">{getErrorMessage(error)}</p>}
        {!isLoading && !error && (data?.items.length ?? 0) === 0 && (
          <EmptyState icon={<Route size={24} strokeWidth={1.5} />} title={t.empty} />
        )}

        <div className="ph-grid">
          {data?.items.map((path) => (
            <Link
              key={path.id}
              href={withLang(ROUTES.learningPathDetail, locale).replace('[slug]', path.slug)}
              className="ph-catalogue-card"
            >
              <h2 className="ph-catalogue-card-title">{path.title}</h2>
              {path.description && <p className="ph-catalogue-card-desc">{path.description}</p>}
              <div className="ph-catalogue-card-meta">
                <StatusBadge status={path.status} locale={locale} />
                <span>
                  {path._count.courses} {t.courses}
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
