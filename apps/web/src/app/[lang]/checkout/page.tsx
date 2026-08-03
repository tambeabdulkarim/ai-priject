'use client';

// Checkout — reviews the client-only cart (contexts/CartContext.tsx; the
// real backend has no server-side cart) and submits it in one shot to
// the real docs/16-API-CONTRACT.md POST /orders. On success, the browser
// is redirected to `checkoutUrl` (a real Stripe-hosted Checkout Session
// page) — never an in-app card form, since none exists server-side.
//
// KNOWN BLOCKER: `POST /orders` calls the real Stripe SDK to create that
// session; if `STRIPE_SECRET_KEY` is unconfigured (true in every
// environment per docs/SESSION-HANDOFF.md) the request fails server-side
// and the real error is shown here as-is — not swallowed, not replaced
// with a fake "redirecting..." success state.

import { type FormEvent, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { RequireAuth } from '../../../guards/RequireAuth';
import { useCart } from '../../../hooks/useCart';
import { useCreateOrder } from '../../../hooks/useOrders';
import { getErrorMessage } from '../../../utils/errors';
import { ROUTES, withLang } from '../../../constants/routes';

const COPY = {
  ar: {
    title: 'الدفع',
    empty: 'سلتك فارغة.',
    browse: 'تصفّح المتجر',
    quantity: 'الكمية',
    remove: 'إزالة',
    coupon: 'رمز الخصم (اختياري)',
    total: 'الإجمالي',
    pay: 'المتابعة إلى الدفع',
    paying: 'جارٍ التحويل إلى الدفع...',
    free: 'مجانًا',
  },
  en: {
    title: 'Checkout',
    empty: 'Your cart is empty.',
    browse: 'Browse the marketplace',
    quantity: 'Qty',
    remove: 'Remove',
    coupon: 'Coupon code (optional)',
    total: 'Total',
    pay: 'Proceed to payment',
    paying: 'Redirecting to checkout...',
    free: 'Free',
  },
} as const;

function formatPrice(cents: number, locale: Locale, freeLabel: string): string {
  if (cents <= 0) return freeLabel;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function CheckoutContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const router = useRouter();
  const cart = useCart();
  const createOrder = useCreateOrder();
  const [couponCode, setCouponCode] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createOrder.mutate(
      {
        items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        couponCode: couponCode || undefined,
      },
      {
        onSuccess: (result) => {
          if (!result.error && result.data.checkoutUrl) {
            cart.clear();
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
        <h1 className="ph-page-title">{t.title}</h1>

        {cart.items.length === 0 ? (
          <div>
            <p className="ph-state">{t.empty}</p>
            <button type="button" className="ph-btn-outline" onClick={() => router.push(withLang(ROUTES.marketplaceHome, locale))}>
              {t.browse}
            </button>
          </div>
        ) : (
          <form className="ph-form" onSubmit={handleSubmit} noValidate>
            {createOrder.error && <div className="ph-form-error" role="alert">{getErrorMessage(createOrder.error)}</div>}

            {cart.items.map((item) => (
              <div key={item.productId} className="ph-catalogue-card" style={{ cursor: 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 className="ph-catalogue-card-title">{item.title}</h3>
                  <p className="ph-catalogue-card-desc">{formatPrice(item.priceCents, locale, t.free)}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label>
                    {t.quantity}
                    <input
                      type="number"
                      min={1}
                      className="ph-input"
                      style={{ width: '4rem', marginInlineStart: '0.5rem' }}
                      value={item.quantity}
                      onChange={(e) => cart.updateQuantity(item.productId, Number(e.target.value))}
                    />
                  </label>
                  <button type="button" className="ph-btn-outline" onClick={() => cart.removeItem(item.productId)}>{t.remove}</button>
                </div>
              </div>
            ))}

            <div className="ph-field">
              <label className="ph-label" htmlFor="couponCode">{t.coupon}</label>
              <input id="couponCode" className="ph-input" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
            </div>

            <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t.total}: {formatPrice(cart.totalCents, locale, t.free)}</p>

            <button type="submit" className="ph-btn-grad" disabled={createOrder.isPending}>
              {createOrder.isPending ? t.paying : t.pay}
            </button>
          </form>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutContent />
    </RequireAuth>
  );
}
