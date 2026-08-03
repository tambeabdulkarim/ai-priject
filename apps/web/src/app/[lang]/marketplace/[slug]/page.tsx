'use client';

// docs/16-API-CONTRACT.md GET /marketplace/products/:slug — `@Public()`,
// only ever returns `status: 'published'` products (404 otherwise).
//
// "Purchase state" / Downloads: there is no "am I entitled to this
// product" pre-check endpoint anywhere in the backend — entitlement is
// resolved only at the moment of a real `GET /files/:fileId` call
// (owner bypass, or a paid OrderItem for this product). Rather than
// guess client-side whether to show a Download button (which the spec
// explicitly forbids — "never fabricate entitlement"), this page always
// offers a "Get download link" action when the product has a file, and
// renders whatever the real backend returns: a signed URL on success, or
// the real 403/425/404 error message on failure. Nothing is pre-computed
// or assumed.

import { useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { useAuth } from '../../../../hooks/useAuth';
import { useProduct } from '../../../../hooks/useMarketplace';
import { useProductDownload } from '../../../../hooks/useProductDownload';
import { useCreateOrder } from '../../../../hooks/useOrders';
import { useCart } from '../../../../hooks/useCart';
import { getErrorMessage } from '../../../../utils/errors';
import { ROUTES, withLang } from '../../../../constants/routes';

const COPY = {
  ar: {
    loading: 'جارٍ التحميل...',
    notFound: 'المنتج غير موجود أو غير منشور.',
    free: 'مجانًا',
    addToCart: 'أضف إلى السلة',
    addedToCart: 'أُضيف إلى السلة.',
    buyNow: 'اشترِ الآن',
    buying: 'جارٍ التحويل إلى الدفع...',
    getDownload: 'الحصول على رابط التحميل',
    checking: 'جارٍ التحقق...',
    downloadLink: 'رابط التحميل',
    noFile: 'لا يوجد ملف مرفق بهذا المنتج.',
    loginToBuy: 'سجّل الدخول للشراء.',
  },
  en: {
    loading: 'Loading...',
    notFound: 'Product not found or not published.',
    free: 'Free',
    addToCart: 'Add to cart',
    addedToCart: 'Added to cart.',
    buyNow: 'Buy now',
    buying: 'Redirecting to checkout...',
    getDownload: 'Get download link',
    checking: 'Checking...',
    downloadLink: 'Download link',
    noFile: 'No file attached to this product.',
    loginToBuy: 'Sign in to buy.',
  },
} as const;

function formatPrice(cents: number, locale: Locale, freeLabel: string): string {
  if (cents <= 0) return freeLabel;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function ProductDetailPage() {
  const params = useParams<{ lang: string; slug: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const router = useRouter();
  const { status } = useAuth();
  const { data: product, isLoading, isError } = useProduct(params.slug);
  const cart = useCart();
  const createOrder = useCreateOrder();
  const download = useProductDownload(product?.fileId ?? null);
  const [added, setAdded] = useState(false);

  if (isLoading) return <p className="ph-state">{t.loading}</p>;
  if (isError || !product) return <p className="ph-state">{t.notFound}</p>;

  function handleAddToCart() {
    cart.addItem({ productId: product!.id, title: product!.title, slug: product!.slug, priceCents: product!.priceCents });
    setAdded(true);
  }

  function handleBuyNow(event: FormEvent) {
    event.preventDefault();
    if (status !== 'authenticated') {
      router.push(withLang(ROUTES.login, locale));
      return;
    }
    createOrder.mutate(
      { items: [{ productId: product!.id, quantity: 1 }] },
      {
        onSuccess: (result) => {
          if (!result.error && result.data.checkoutUrl) {
            window.location.href = result.data.checkoutUrl;
          }
        },
      },
    );
  }

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page ph-page-narrow">
        <h1 className="ph-page-title">{product.title}</h1>
        {product.description && <p className="ph-page-subtitle">{product.description}</p>}
        <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{formatPrice(product.priceCents, locale, t.free)}</p>

        {createOrder.error && <div className="ph-form-error" role="alert">{getErrorMessage(createOrder.error)}</div>}
        {status !== 'authenticated' && <p className="ph-form-error" role="note">{t.loginToBuy}</p>}

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button type="button" className="ph-btn-outline" onClick={handleAddToCart}>{t.addToCart}</button>
          <button type="button" className="ph-btn-grad" onClick={handleBuyNow} disabled={createOrder.isPending || status !== 'authenticated'}>
            {createOrder.isPending ? t.buying : t.buyNow}
          </button>
        </div>
        {added && <p className="ph-form-success" role="status">{t.addedToCart}</p>}

        <section style={{ marginTop: '2rem' }}>
          {product.fileId ? (
            <>
              <button type="button" className="ph-btn-outline" onClick={() => download.refetch()} disabled={download.isFetching}>
                {download.isFetching ? t.checking : t.getDownload}
              </button>
              {download.error && <p className="ph-form-error" role="alert">{getErrorMessage(download.error)}</p>}
              {download.data && (
                <p className="ph-form-success" role="status">
                  <a href={download.data.signedUrl} target="_blank" rel="noopener noreferrer">{t.downloadLink}</a>
                </p>
              )}
            </>
          ) : (
            <p className="ph-state">{t.noFile}</p>
          )}
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
