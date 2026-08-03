'use client';

// docs/16-API-CONTRACT.md GET /news — public catalogue, via hooks/useNews.ts.

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { useNewsList } from '../../../hooks/useNews';
import { ROUTES, withLang } from '../../../constants/routes';

const COPY = {
  ar: {
    title: 'الأخبار',
    subtitle: 'آخر مستجدات فينيكس وعالم الذكاء الاصطناعي.',
    search: 'ابحث في الأخبار...',
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل الأخبار.',
    empty: 'لا توجد أخبار منشورة.',
    loadMore: 'تحميل المزيد',
    loadingMore: 'جارٍ التحميل...',
  },
  en: {
    title: 'News',
    subtitle: 'The latest from Phoenix and the AI world.',
    search: 'Search news...',
    loading: 'Loading...',
    error: 'Couldn’t load news.',
    empty: 'No published articles.',
    loadMore: 'Load more',
    loadingMore: 'Loading...',
  },
} as const;

export default function NewsListPage() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const [q, setQ] = useState('');
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useNewsList({
    q: q || undefined,
  });

  const articles = data?.pages.flatMap((page) => page.items) ?? [];

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
        {!isLoading && !isError && articles.length === 0 && <p className="ph-state">{t.empty}</p>}

        <div className="ph-grid">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={withLang(ROUTES.newsDetail, locale).replace('[slug]', article.slug)}
              className="ph-catalogue-card"
            >
              <h2 className="ph-catalogue-card-title">{article.title}</h2>
              <p className="ph-catalogue-card-desc">{article.body.slice(0, 140)}{article.body.length > 140 ? '…' : ''}</p>
              <div className="ph-catalogue-card-meta">
                <span>{new Date(article.publishedAt ?? article.createdAt).toLocaleDateString(locale)}</span>
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
