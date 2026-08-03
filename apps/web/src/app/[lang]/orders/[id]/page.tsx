'use client';

// docs/16-API-CONTRACT.md GET /orders/:id — owner or admin/support/superadmin.
//
// REAL BACKEND GAPS, not worked around:
//  - `orderItems` carry only `productId`/`unitPriceCents`/`quantity` — no
//    denormalized product title/slug/fileId. There is no batch
//    get-products-by-ids endpoint and no get-product-by-id (only
//    get-by-slug, for `published` products only). This page resolves
//    titles/files via a BEST-EFFORT client-side match against the first
//    100 published products (same documented pattern as the Instructor
//    workspace's "owned courses" hook) — a purchased item whose product
//    was later archived/unpublished, or that isn't in the first 100
//    published products, will show only its raw productId, clearly
//    labeled as such, never a guessed title.
//  - The Order response has no `payments`/`paymentId` field at all, so
//    there is no way to reach `GET /payments/:id` from here — Purchase
//    Status is therefore shown via `Order.status` only (which is the
//    real, complete, documented source of truth for the buyer), not a
//    separate Payment sub-view that the backend gives no way to locate.

import { useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { RequireAuth } from '../../../../guards/RequireAuth';
import { useOrder } from '../../../../hooks/useOrders';
import { useProductsList } from '../../../../hooks/useMarketplace';
import { useProductDownload } from '../../../../hooks/useProductDownload';
import { getErrorMessage } from '../../../../utils/errors';
import type { ProductRecord } from '@phoenix/types';

const COPY = {
  ar: {
    loading: 'جارٍ التحميل...',
    notFound: 'الطلب غير موجود.',
    status: { pending: 'قيد الانتظار', paid: 'مدفوع', refunded: 'مسترد', cancelled: 'ملغى' } as Record<string, string>,
    items: 'العناصر',
    unresolvedNote: 'تعذّر تحديد اسم المنتج أو ملفه — لا توجد واجهة برمجية في الخادم لجلب منتج بمعرّفه مباشرة (فقط عبر الرابط النصي)، وهذا المنتج غير موجود ضمن أول 100 منتج منشور.',
    getDownload: 'الحصول على رابط التحميل',
    checking: 'جارٍ التحقق...',
    downloadLink: 'رابط التحميل',
    noFile: 'لا يوجد ملف مرفق بهذا المنتج.',
  },
  en: {
    loading: 'Loading...',
    notFound: 'Order not found.',
    status: { pending: 'Pending', paid: 'Paid', refunded: 'Refunded', cancelled: 'Cancelled' } as Record<string, string>,
    items: 'Items',
    unresolvedNote: 'Couldn’t resolve this product’s title or file — no backend endpoint fetches a product by id directly (only by slug), and this product isn’t among the first 100 published products.',
    getDownload: 'Get download link',
    checking: 'Checking...',
    downloadLink: 'Download link',
    noFile: 'No file attached to this product.',
  },
} as const;

function formatPrice(cents: number, locale: Locale, currency: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}

type Copy = (typeof COPY)[keyof typeof COPY];

function ItemDownload({ fileId, t }: { fileId: string; t: Copy }) {
  const download = useProductDownload(fileId);
  return (
    <div style={{ marginTop: '0.5rem' }}>
      <button type="button" className="ph-btn-outline" onClick={() => download.refetch()} disabled={download.isFetching}>
        {download.isFetching ? t.checking : t.getDownload}
      </button>
      {download.error && <p className="ph-form-error" role="alert">{getErrorMessage(download.error)}</p>}
      {download.data && (
        <p className="ph-form-success" role="status">
          <a href={download.data.signedUrl} target="_blank" rel="noopener noreferrer">{t.downloadLink}</a>
        </p>
      )}
    </div>
  );
}

function OrderDetailContent() {
  const params = useParams<{ lang: string; id: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { data: order, isLoading, isError } = useOrder(params.id);
  const { data: productsPages } = useProductsList({ limit: 100 });

  const productById = new Map<string, ProductRecord>();
  productsPages?.pages.forEach((page) => page.items.forEach((p) => productById.set(p.id, p)));

  if (isLoading) return <p className="ph-state">{t.loading}</p>;
  if (isError || !order) return <p className="ph-state">{t.notFound}</p>;

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        <h1 className="ph-page-title">#{order.orderNumber}</h1>
        <p className="ph-page-subtitle">{t.status[order.status] ?? order.status}</p>
        <p>{formatPrice(order.totalCents, locale, order.currency)} — {new Date(order.createdAt).toLocaleString(locale)}</p>

        <section style={{ marginTop: '2rem' }}>
          <h2 className="ph-catalogue-card-title">{t.items}</h2>
          {order.orderItems.map((item) => {
            const product = productById.get(item.productId);
            return (
              <div key={item.id} className="ph-catalogue-card" style={{ cursor: 'default', marginBottom: '1rem' }}>
                {product ? (
                  <h3 className="ph-catalogue-card-title">{product.title}</h3>
                ) : (
                  <>
                    <h3 className="ph-catalogue-card-title">{item.productId}</h3>
                    <p className="ph-form-error" role="note">{t.unresolvedNote}</p>
                  </>
                )}
                <p className="ph-catalogue-card-desc">
                  {item.quantity} × {formatPrice(item.unitPriceCents, locale, order.currency)}
                </p>

                {order.status === 'paid' && (
                  product?.fileId ? (
                    <ItemDownload fileId={product.fileId} t={t} />
                  ) : product ? (
                    <p className="ph-state">{t.noFile}</p>
                  ) : null
                )}
              </div>
            );
          })}
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <RequireAuth>
      <OrderDetailContent />
    </RequireAuth>
  );
}
