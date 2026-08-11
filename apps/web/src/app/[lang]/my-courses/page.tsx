'use client';

// docs/16-API-CONTRACT.md GET /enrollments/me, via hooks/useEnrollments.ts.
// "Continue learning" links into the Course Learning View
// (/[lang]/courses/[slug]/learn), reusing the enrollment's own joined
// `course.slug` — no separate lookup needed.

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonGrid } from '@/components/ui/Loading';
import { type Locale } from '@/lib/i18n';
import { RequireAuth } from '../../../guards/RequireAuth';
import { useEnrollmentsList } from '../../../hooks/useEnrollments';
import { ROUTES, withLang } from '../../../constants/routes';

const COPY = {
  ar: {
    title: 'دوراتي',
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل دوراتك.',
    empty: 'لم تسجّل في أي دورة بعد.',
    browse: 'تصفّح الدورات',
    continueLabel: 'متابعة التعلّم',
    completed: 'مكتملة',
    progress: 'التقدم',
  },
  en: {
    title: 'My courses',
    loading: 'Loading...',
    error: 'Couldn’t load your courses.',
    empty: 'You haven’t enrolled in any course yet.',
    browse: 'Browse courses',
    continueLabel: 'Continue learning',
    completed: 'Completed',
    progress: 'Progress',
  },
} as const;

function MyCoursesContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { data, isLoading, isError } = useEnrollmentsList();

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        <h1 className="ph-page-title">{t.title}</h1>

        {isLoading && <SkeletonGrid count={4} />}
        {isError && <p className="ph-state">{t.error}</p>}
        {!isLoading && !isError && (data?.items.length ?? 0) === 0 && (
          <EmptyState
            icon={<GraduationCap size={24} strokeWidth={1.5} />}
            title={t.empty}
            primaryAction={{ label: t.browse, href: withLang(ROUTES.coursesList, locale) }}
          />
        )}

        <div className="ph-grid">
          {data?.items.map((enrollment) => (
            <div key={enrollment.id} className="ph-catalogue-card" style={{ cursor: 'default' }}>
              <h2 className="ph-catalogue-card-title">{enrollment.course.title}</h2>
              <div className="ph-catalogue-card-meta">
                <span>
                  {t.progress}: {enrollment.completionPercent}%
                  {enrollment.completedAt ? ` · ${t.completed}` : ''}
                </span>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <Link
                  href={withLang(ROUTES.courseLearn, locale).replace(
                    '[slug]',
                    enrollment.course.slug,
                  )}
                  className="ph-btn-outline"
                >
                  {t.continueLabel}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function MyCoursesPage() {
  return (
    <RequireAuth>
      <MyCoursesContent />
    </RequireAuth>
  );
}
