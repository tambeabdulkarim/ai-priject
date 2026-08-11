import type {
  CreateOrderRequest,
  CreateOrderResponse,
  ListOrdersQuery,
  OrderRecord,
  OrderWithItems,
  PaginatedResponse,
} from '@phoenix/types';
import type { RequestFn } from '../core/request';

/**
 * docs/16-API-CONTRACT.md §11 (Orders). `create` is the real checkout
 * entry point — it creates the Order server-side (status `pending`) and
 * a Stripe Checkout Session in one call; the frontend's only job on
 * success is to redirect the browser to `checkoutUrl`. There is no
 * separate "add to cart" endpoint — the full `items[]` array is
 * submitted directly at checkout time.
 */
export function createOrdersResource(request: RequestFn) {
  return {
    create: (body: CreateOrderRequest) =>
      request<CreateOrderResponse>({ method: 'POST', path: '/orders', body }),

    listMine: (query: ListOrdersQuery = {}) =>
      request<PaginatedResponse<OrderRecord>>({
        method: 'GET',
        path: '/orders/me',
        query: { cursor: query.cursor, limit: query.limit, status: query.status },
      }),

    getById: (id: string) => request<OrderWithItems>({ method: 'GET', path: `/orders/${id}` }),
  };
}

export type OrdersResource = ReturnType<typeof createOrdersResource>;
