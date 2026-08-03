import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateOrderRequest, ListOrdersQuery } from '@phoenix/types';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/**
 * docs/16-API-CONTRACT.md POST /orders — the real checkout entry point.
 * No cart endpoint exists; `items[]` is submitted directly. On success,
 * the caller is responsible for redirecting the browser to
 * `result.data.checkoutUrl` (Stripe-hosted) — this hook does not
 * navigate itself, since redirecting is a page-level concern.
 *
 * KNOWN BLOCKER: if the backend's `STRIPE_SECRET_KEY` is unconfigured
 * (true in every environment per docs/SESSION-HANDOFF.md), this call
 * fails server-side (the real Stripe SDK call throws) rather than
 * returning a fake URL — the real error is surfaced via `error` as-is,
 * not swallowed or replaced with a placeholder success state.
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateOrderRequest) => apiClient.orders.create(body),
    onSuccess: (result) => {
      if (!result.error) queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
    },
  });
}

/** docs/16-API-CONTRACT.md GET /orders/me — authenticated, owner-scoped, cursor-paginated, optional status filter. */
export function useMyOrders(query: Omit<ListOrdersQuery, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.orders.list(query),
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const result = await apiClient.orders.listMine({ ...query, cursor: pageParam });
      if (result.error) throw result.error;
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/**
 * docs/16-API-CONTRACT.md GET /orders/:id — owner or admin/support/superadmin.
 * `refetchInterval` lets the checkout-success page poll for the async
 * Stripe webhook to flip `status` from `pending` to `paid` — there is no
 * push/websocket notice of payment completion, so polling is the real,
 * only mechanism (see packages/types/src/marketplace.ts's header comment).
 */
export function useOrder(id: string, refetchInterval?: number) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: async () => {
      const result = await apiClient.orders.getById(id);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: id.length > 0,
    refetchInterval,
  });
}
