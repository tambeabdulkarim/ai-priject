'use client';

// docs/16-API-CONTRACT.md GET /orders/me — authenticated, owner-scoped,
// cursor-paginated, optional status filter (pending/paid/refunded/cancelled
// — the real Order.status enum, no other values invented).

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { RequireAuth } from '../../../guards/RequireAuth';
import { useMyOrders } from '../../../hooks/useOrders';
import { ROUTES, withLang } from '../../../constants/routes';
import type { OrderRecord } from '@phoenix/types';

const COPY = {
  ar: {
    title: 'طلباتي',
    statusAll: 'كل الحالات',
    status: { pending: 'قيد الانتظار', paid: 'مدفوع', refunded: 'مسترد', cancelled: 'ملغى' } as Record<string, string>,
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل الطلبات.',
    empty: 'لا توجد طلبات.',
    loadMore: 'تحميل المزيد',
    loadingMore: 'جارٍ التحميل...',
  },
  en: {
    title: 'My orders',
    statusAll: 'All statuses',
    status: { pending: 'Pending', paid: 'Paid', refunded: 'Refunded', cancelled: 'Cancelled' } as Record<string, string>,
    loading: 'Loading...',
    error: 'Couldn’t load orders.',
    empty: 'No orders.',
    loadMore: 'Load more',
    loadingMore: 'Loading...',
  },
} as const;

function formatPrice(cents: number, locale: Locale, currency: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}

function OrdersListContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const [status, setStatus] = useState<OrderRecord['status'] | ''>('');

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useMyOrders({
    status: status || undefined,
  });

  const orders = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        <h1 className="ph-page-title">{t.title}</h1>

        <div className="ph-filters">
          <select className="ph-input" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="">{t.statusAll}</option>
            <option value="pending">{t.status.pending}</option>
            <option value="paid">{t.status.paid}</option>
            <option value="refunded">{t.status.refunded}</option>
            <option value="cancelled">{t.status.cancelled}</option>
          </select>
        </div>

        {isLoading && <p className="ph-state">{t.loading}</p>}
        {isError && <p className="ph-state">{t.error}</p>}
        {!isLoading && !isError && orders.length === 0 && <p className="ph-state">{t.empty}</p>}

        <div className="ph-grid">
          {orders.map((order) => (
            <Link key={order.id} href={withLang(ROUTES.orderDetail, locale).replace('[id]', order.id)} className="ph-catalogue-card">
              <h2 className="ph-catalogue-card-title">#{order.orderNumber}</h2>
              <div className="ph-catalogue-card-meta">{t.status[order.status] ?? order.status}</div>
              <p className="ph-catalogue-card-desc">{formatPrice(order.totalCents, locale, order.currency)}</p>
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

export default function OrdersListPage() {
  return (
    <RequireAuth>
      <OrdersListContent />
    </RequireAuth>
  );
}
