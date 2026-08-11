'use client';

// This exact path (`/checkout/success`, unprefixed — no `[lang]`
// segment) is hardcoded server-side as the Stripe `success_url` by
// orders.service.ts: `${NEXT_PUBLIC_SITE_URL}/checkout/success?order=${order.id}`.
// It must live here, outside the locale-prefixed route tree, to match
// that real redirect target exactly.
//
// Purchase Status: there is no push/webhook-to-client notice of payment
// completion — the Stripe webhook that flips the order to `paid` is
// server-to-server and can lag this redirect. This page polls
// `GET /orders/:id` (hooks/useOrders.ts's `useOrder` with
// `refetchInterval`) and renders the order's real `status` field exactly
// as returned — `pending` is shown as "still processing," never
// silently reinterpreted as success just because Stripe redirected here.

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { defaultLocale } from '@/lib/i18n';
import { useOrder } from '../../../hooks/useOrders';
import { ROUTES, withLang } from '../../../constants/routes';

const COPY = {
  title: 'Checkout',
  pending:
    'Payment is still processing — this can take a few seconds after Stripe redirects you back.',
  paid: 'Payment confirmed. Your order is paid.',
  refunded: 'This order has been refunded.',
  cancelled: 'This order was cancelled.',
  viewOrder: 'View order details',
  loading: 'Loading...',
  error: 'Couldn’t load this order.',
} as const;

const STATUS_COPY: Record<string, string> = {
  pending: COPY.pending,
  paid: COPY.paid,
  refunded: COPY.refunded,
  cancelled: COPY.cancelled,
};

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order') ?? '';
  const [pollInterval, setPollInterval] = useState<number | undefined>(3000);
  const { data: order, isLoading, isError } = useOrder(orderId, pollInterval);

  useEffect(() => {
    if (order && order.status !== 'pending') {
      setPollInterval(undefined);
    }
  }, [order]);

  return (
    <div>
      <Navigation locale={defaultLocale} />
      <main className="ph-page ph-page-narrow">
        <h1 className="ph-page-title">{COPY.title}</h1>

        {isLoading && <p className="ph-state">{COPY.loading}</p>}
        {isError && <p className="ph-state">{COPY.error}</p>}

        {order && (
          <>
            <p className="ph-form-success" role="status">
              {STATUS_COPY[order.status] ?? order.status}
            </p>
            <p>
              Order #{order.orderNumber} — status: <strong>{order.status}</strong>
            </p>
            <a
              href={withLang(ROUTES.orderDetail, defaultLocale).replace('[id]', order.id)}
              className="ph-btn-grad"
            >
              {COPY.viewOrder}
            </a>
          </>
        )}
      </main>
      <Footer locale={defaultLocale} />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
