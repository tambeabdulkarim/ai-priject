'use client';

// docs/16-API-CONTRACT.md GET /library/items — public catalogue, via
// hooks/useLibrary.ts. Server-enforced published-only (see
// packages/api-client/src/resources/library.ts's header comment) — no
// draft/entitlement filtering is done or attempted client-side.

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { EmptyState } from '@/components/ui/EmptyState';
import { type Locale } from '@/lib/i18n';
import { useLibraryList } from '../../../hooks/useLibrary';
import { ROUTES, withLang } from '../../../constants/routes';

const COPY = {
  ar: {
    title: 'المكتبة',
    subtitle: 'كتب إلكترونية ومصادر تعليمية.',
    search: 'ابحث في المكتبة...',
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل عناصر المكتبة.',
    empty: 'لا توجد عناصر منشورة.',
    free: 'مجانًا',
    loadMore: 'تحميل المزيد',
    loadingMore: 'جارٍ التحميل...',
  },
  en: {
    title: 'Library',
    subtitle: 'E-books and learning resources.',
    search: 'Search the library...',
    loading: 'Loading...',
    error: 'Couldn’t load library items.',
    empty: 'No published items.',
    free: 'Free',
    loadMore: 'Load more',
    loadingMore: 'Loading...',
  },
} as const;

function formatPrice(cents: number | null, locale: Locale, freeLabel: string): string {
  if (cents === null || cents <= 0) return freeLabel;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function LibraryListPage() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const [q, setQ] = useState('');
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useLibraryList({
      q: q || undefined,
    });

  const items = data?.pages.flatMap((page) => page.items) ?? [];

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
        {!isLoading && !isError && items.length === 0 && (
          <EmptyState icon={<BookOpen size={24} strokeWidth={1.5} />} title={t.empty} />
        )}

        <div className="ph-grid">
          {items.map((item) => (
            <Link
              key={item.id}
              href={withLang(ROUTES.libraryDetail, locale).replace('[slug]', item.slug)}
              className="ph-catalogue-card"
            >
              <h2 className="ph-catalogue-card-title">{item.title}</h2>
              {item.description && <p className="ph-catalogue-card-desc">{item.description}</p>}
              <div className="ph-catalogue-card-meta">
                <span>{formatPrice(item.priceCents, locale, t.free)}</span>
              </div>
            </Link>
          ))}
        </div>

        {hasNextPage && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              type="button"
              className="ph-btn-outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? t.loadingMore : t.loadMore}
            </button>
          </div>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
