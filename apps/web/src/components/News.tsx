'use client';

// Wired to the real backend (docs/16-API-CONTRACT.md GET /news) —
// previously a hardcoded NEWS_ITEMS array of fabricated headlines.
// Renders the 3 most recent PUBLISHED articles (server-enforced; this
// component sends no auth token, so a draft/in_review article is never
// returned here regardless of what's in the database).

import { Newspaper, Clock } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useNewsList } from '../hooks/useNews';
import { withLang, ROUTES } from '../constants/routes';
import type { Locale } from '@/lib/i18n';

function formatRelativeTime(iso: string, locale: Locale): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return locale === 'ar' ? 'الآن' : 'just now';
  if (diffHours < 24) {
    return locale === 'ar' ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
  }
  const diffDays = Math.round(diffHours / 24);
  return locale === 'ar' ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
}

export default function News() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const { data, isLoading, isError } = useNewsList({ limit: 3 });

  const articles = data?.pages[0]?.items ?? [];

  return (
    <div>
      <div className="ph-sec-hdr">
        <h2 className="ph-sec-title">{locale === 'ar' ? 'آخر الأخبار' : 'Latest News'}</h2>
        <Link href={withLang(ROUTES.newsList, locale)} className="ph-see-all">
          {locale === 'ar' ? 'عرض جميع الأخبار' : 'View all news'}
        </Link>
      </div>

      {isLoading && (
        <p className="ph-state" style={{ padding: '1rem 0' }}>
          {locale === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}
        </p>
      )}

      {isError && (
        <p className="ph-state" style={{ padding: '1rem 0' }}>
          {locale === 'ar' ? 'تعذّر تحميل الأخبار.' : 'Couldn’t load news right now.'}
        </p>
      )}

      {!isLoading && !isError && articles.length === 0 && (
        <p className="ph-state" style={{ padding: '1rem 0' }}>
          {locale === 'ar' ? 'لا توجد أخبار منشورة بعد.' : 'No published articles yet.'}
        </p>
      )}

      <div className="ph-news-list">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={withLang(ROUTES.newsDetail, locale).replace('[slug]', article.slug)}
            className="ph-news-card"
            style={{ background: 'linear-gradient(135deg,#1a0a2e,#2d1b69)' }}
          >
            <div className="ph-news-img" aria-hidden="true">
              <Newspaper size={40} strokeWidth={1.5} color="#fff" />
            </div>
            <div className="ph-news-body">
              <span className="ph-news-badge">{article.category.name}</span>
              <p className="ph-news-title">{article.title}</p>
              <span className="ph-news-time">
                <Clock size={12} strokeWidth={2} aria-hidden="true" />
                {formatRelativeTime(article.publishedAt ?? article.createdAt, locale)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
