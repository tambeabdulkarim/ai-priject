'use client';

// docs/16-API-CONTRACT.md §10 (Marketplace) — GET /marketplace/products,
// GET /marketplace/categories, both `@Public()`.
//
// REAL BACKEND GAPS, not worked around:
//  - No "featured products" endpoint or flag exists anywhere in the
//    backend (`Product` has no `featured` column) — no featured section
//    is rendered; an explicit notice explains why instead of showing a
//    fabricated "featured" subset of the normal list.
//  - `q` is a plain Postgres `ILIKE` substring match on title/description
//    (products.repository.ts), not a search index — framed as "search"
//    in the UI copy, not "smart search".
//  - The category list comes from the SHARED cross-domain Category tree
//    (see hooks/useMarketplace.ts's `useMarketplaceCategories`, which
//    filters to `domain === 'marketplace'` client-side over the real
//    response — the backend itself does not scope this endpoint).

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { EmptyState } from '@/components/ui/EmptyState';
import { type Locale } from '@/lib/i18n';
import { useProductsList, useMarketplaceCategories } from '../../../hooks/useMarketplace';
import { ROUTES, withLang } from '../../../constants/routes';

const COPY = {
  ar: {
    title: 'المتجر',
    subtitle: 'منتجات رقمية جاهزة للتحميل.',
    search: 'ابحث في المنتجات...',
    categoryAll: 'كل التصنيفات',
    minPrice: 'أقل سعر (سنت)',
    maxPrice: 'أعلى سعر (سنت)',
    featuredNotice:
      'لا توجد واجهة برمجية في الخادم لعرض "منتجات مميزة" — لا يوجد أي حقل أو نقطة وصول لهذا الغرض. يتم عرض كل المنتجات المنشورة بدلًا من ذلك.',
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل المنتجات.',
    empty: 'لا توجد منتجات منشورة.',
    free: 'مجانًا',
    loadMore: 'تحميل المزيد',
    loadingMore: 'جارٍ التحميل...',
  },
  en: {
    title: 'Marketplace',
    subtitle: 'Digital products ready to download.',
    search: 'Search products...',
    categoryAll: 'All categories',
    minPrice: 'Min price (cents)',
    maxPrice: 'Max price (cents)',
    featuredNotice:
      'No backend endpoint exposes "featured products" — there is no such field or route at all. All published products are shown instead.',
    loading: 'Loading...',
    error: 'Couldn’t load products.',
    empty: 'No published products.',
    free: 'Free',
    loadMore: 'Load more',
    loadingMore: 'Loading...',
  },
} as const;

function formatPrice(cents: number, locale: Locale, freeLabel: string): string {
  if (cents <= 0) return freeLabel;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function MarketplaceHomePage() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;

  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [minPriceCents, setMinPriceCents] = useState('');
  const [maxPriceCents, setMaxPriceCents] = useState('');

  const { data: categories } = useMarketplaceCategories();
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useProductsList({
      q: q || undefined,
      category: category || undefined,
      minPriceCents: minPriceCents ? Number(minPriceCents) : undefined,
      maxPriceCents: maxPriceCents ? Number(maxPriceCents) : undefined,
    });

  const products = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        <h1 className="ph-page-title">{t.title}</h1>
        <p className="ph-page-subtitle">{t.subtitle}</p>
        <p className="ph-form-error" role="note">
          {t.featuredNotice}
        </p>

        <div className="ph-filters" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <input
            type="search"
            className="ph-input"
            placeholder={t.search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={t.search}
          />
          <select
            className="ph-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">{t.categoryAll}</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            className="ph-input"
            placeholder={t.minPrice}
            value={minPriceCents}
            onChange={(e) => setMinPriceCents(e.target.value)}
          />
          <input
            type="number"
            min={0}
            className="ph-input"
            placeholder={t.maxPrice}
            value={maxPriceCents}
            onChange={(e) => setMaxPriceCents(e.target.value)}
          />
        </div>

        {isLoading && <p className="ph-state">{t.loading}</p>}
        {isError && <p className="ph-state">{t.error}</p>}
        {!isLoading && !isError && products.length === 0 && (
          <EmptyState icon={<ShoppingBag size={24} strokeWidth={1.5} />} title={t.empty} />
        )}

        <div className="ph-grid">
          {products.map((product) => (
            <Link
              key={product.id}
              href={withLang(ROUTES.marketplaceProductDetail, locale).replace(
                '[slug]',
                product.slug,
              )}
              className="ph-catalogue-card"
            >
              <h2 className="ph-catalogue-card-title">{product.title}</h2>
              {product.description && (
                <p className="ph-catalogue-card-desc">{product.description}</p>
              )}
              <div className="ph-catalogue-card-meta">
                <span>{formatPrice(product.priceCents, locale, t.free)}</span>
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
