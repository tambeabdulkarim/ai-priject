import type { PaymentRecord } from '@phoenix/types';
import type { RequestFn } from '../core/request';

/**
 * docs/16-API-CONTRACT.md §12 (Payments). Only the buyer-facing read
 * endpoint is wired here — the Stripe webhook (`POST
 * /payments/webhooks/stripe`) is server-to-server only (no frontend
 * caller), and `POST /admin/payments/:id/refund` is admin/support-only
 * (`order:refund`), out of this buyer-facing Marketplace phase's scope.
 */
export function createPaymentsResource(request: RequestFn) {
  return {
    getById: (id: string) => request<PaymentRecord>({ method: 'GET', path: `/payments/${id}` }),
  };
}

export type PaymentsResource = ReturnType<typeof createPaymentsResource>;
