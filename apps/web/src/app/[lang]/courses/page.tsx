'use client';

// docs/16-API-CONTRACT.md GET /courses — public catalogue, via
// hooks/useCourses.ts. Draft visibility is entirely server-side: this
// unauthenticated-by-default page only ever receives published courses;
// an authenticated instructor viewing this same page would additionally
// see their own drafts, per the backend's own documented rule — nothing
// special is done here to enable or restrict that.

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { useCoursesList } from '../../../hooks/useCourses';
import { ROUTES, withLang } from '../../../constants/routes';

const COPY = {
  ar: {
    title: 'الدورات التدريبية',
    subtitle: 'اكتسب مهارات جديدة مع دوراتنا التدريبية.',
    search: 'ابحث في الدورات...',
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل الدورات.',
    empty: 'لا توجد دورات منشورة.',
    free: 'مجانًا',
    loadMore: 'تحميل المزيد',
    loadingMore: 'جارٍ التحميل...',
  },
  en: {
    title: 'Courses',
    subtitle: 'Build new skills with our training courses.',
    search: 'Search courses...',
    loading: 'Loading...',
    error: 'Couldn’t load courses.',
    empty: 'No published courses.',
    free: 'Free',
    loadMore: 'Load more',
    loadingMore: 'Loading...',
  },
} as const;

function formatPrice(cents: number, locale: Locale, freeLabel: string): string {
  if (cents <= 0) return freeLabel;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function CoursesListPage() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const [q, setQ] = useState('');
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useCoursesList({
    q: q || undefined,
  });

  const courses = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        <h1 className="ph-page-title">{t.title}</h1>
        <p className="ph-page-subtitle">{t.subtitle}</p>

        <div className="ph-filters">
          <input
            type="search"
            className="ph-input"
            placeholder={t.search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={t.search}
          />
        </div>

        {isLoading && <p className="ph-state">{t.loading}</p>}
        {isError && <p className="ph-state">{t.error}</p>}
        {!isLoading && !isError && courses.length === 0 && <p className="ph-state">{t.empty}</p>}

        <div className="ph-grid">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={withLang(ROUTES.courseDetail, locale).replace('[slug]', course.slug)}
              className="ph-catalogue-card"
            >
              <h2 className="ph-catalogue-card-title">{course.title}</h2>
              {course.description && <p className="ph-catalogue-card-desc">{course.description}</p>}
              <div className="ph-catalogue-card-meta">
                <span>{formatPrice(course.priceCents, locale, t.free)}</span>
              </div>
            </Link>
          ))}
        </div>

        {hasNextPage && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button type="button" className="ph-btn-outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? t.loadingMore : t.loadMore}
            </button>
          </div>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
