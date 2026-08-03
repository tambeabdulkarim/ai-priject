'use client';

// docs/16-API-CONTRACT.md GET /library/items/:slug, via
// hooks/useLibrary.ts. No download/access affordance is rendered here —
// `POST /library/items/:id/access` requires authentication and belongs
// to an authenticated-library feature phase, not this public-catalogue
// page.

import { notFound, useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { ApiError } from '@phoenix/api-client';
import { type Locale } from '@/lib/i18n';
import { useLibraryItem } from '../../../../hooks/useLibrary';
import { getErrorMessage } from '../../../../utils/errors';

const COPY = {
  ar: { loading: 'جارٍ التحميل...', error: 'تعذّر تحميل العنصر.', free: 'مجانًا' },
  en: { loading: 'Loading...', error: 'Couldn’t load this item.', free: 'Free' },
} as const;

function formatPrice(cents: number | null, locale: Locale, freeLabel: string): string {
  if (cents === null || cents <= 0) return freeLabel;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function LibraryDetailPage() {
  const params = useParams<{ lang: string; slug: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { data: item, error, isLoading } = useLibraryItem(params.slug);

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

        {item && (
          <article>
            <header className="ph-detail-header">
              <h1 className="ph-page-title">{item.title}</h1>
              <div className="ph-detail-meta">
                <span>{formatPrice(item.priceCents, locale, t.free)}</span>
              </div>
            </header>
            {item.description && <div className="ph-detail-body">{item.description}</div>}
          </article>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
