'use client';

// This exact path (`/checkout/cancel`, unprefixed) is hardcoded
// server-side as the Stripe `cancel_url` by orders.service.ts:
// `${NEXT_PUBLIC_SITE_URL}/checkout/cancel?order=${order.id}`.
//
// A cancelled Stripe session does NOT change the Order's status —
// per the real backend there is no cancel-order endpoint/code path at
// all (`Order.status` stays `pending`, matching packages/types/src/
// marketplace.ts's documented gap). This page states that plainly
// rather than implying the order was cancelled.

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { defaultLocale } from '@/lib/i18n';
import { useOrder } from '../../../hooks/useOrders';
import { ROUTES, withLang } from '../../../constants/routes';

const COPY = {
  title: 'Checkout cancelled',
  body: 'You cancelled the Stripe checkout. Your order was NOT cancelled server-side — no such action exists on the real backend — it remains in its current status below. You can retry payment from your order details.',
  viewOrder: 'View order details',
  backToMarketplace: 'Back to marketplace',
} as const;

function CheckoutCancelContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order') ?? '';
  const { data: order } = useOrder(orderId);

  return (
    <div>
      <Navigation locale={defaultLocale} />
      <main className="ph-page ph-page-narrow">
        <h1 className="ph-page-title">{COPY.title}</h1>
        <p className="ph-form-error" role="note">{COPY.body}</p>
        {order && <p>Order #{order.orderNumber} — status: <strong>{order.status}</strong></p>}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          {order && (
            <a href={withLang(ROUTES.orderDetail, defaultLocale).replace('[id]', order.id)} className="ph-btn-grad">
              {COPY.viewOrder}
            </a>
          )}
          <a href={withLang(ROUTES.marketplaceHome, defaultLocale)} className="ph-btn-outline">{COPY.backToMarketplace}</a>
        </div>
      </main>
      <Footer locale={defaultLocale} />
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutCancelContent />
    </Suspense>
  );
}
