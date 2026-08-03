'use client';

// docs/16-API-CONTRACT.md GET /news/:slug, via hooks/useNews.ts.

import { notFound, useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { ApiError } from '@phoenix/api-client';
import { type Locale } from '@/lib/i18n';
import { useNewsArticle } from '../../../../hooks/useNews';
import { getErrorMessage } from '../../../../utils/errors';

const COPY = {
  ar: { loading: 'جارٍ التحميل...', error: 'تعذّر تحميل المقال.' },
  en: { loading: 'Loading...', error: 'Couldn’t load this article.' },
} as const;

export default function NewsDetailPage() {
  const params = useParams<{ lang: string; slug: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { data: article, error, isLoading } = useNewsArticle(params.slug);

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

        {article && (
          <article>
            <header className="ph-detail-header">
              <h1 className="ph-page-title">{article.title}</h1>
              <div className="ph-detail-meta">
                <span>{article.author.displayName}</span>
                <span>·</span>
                <span>{article.category.name}</span>
                <span>·</span>
                <span>{new Date(article.publishedAt ?? article.createdAt).toLocaleDateString(locale)}</span>
              </div>
              {article.tagAssignments.length > 0 && (
                <div className="ph-detail-meta">
                  {article.tagAssignments.map((assignment) => (
                    <span key={assignment.tagId} className="ph-pill" style={{ background: 'var(--accent-purple)' }}>
                      {assignment.tag.name}
                    </span>
                  ))}
                </div>
              )}
            </header>
            <div className="ph-detail-body">{article.body}</div>
          </article>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
