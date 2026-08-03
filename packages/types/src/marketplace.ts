// docs/16-API-CONTRACT.md §10 (Marketplace), §11 (Orders), §12 (Payments).
// Verified against apps/api/src/modules/{products,orders,payments,categories}/**
// and prisma/schema.prisma.
//
// REAL BACKEND GAPS (not worked around, see this phase's report for full detail):
//  - No cart: `POST /orders` takes the full `items[]` array directly —
//    there is no server-side cart persistence endpoint at all. The
//    frontend must hold "cart" state itself and submit it in one shot.
//  - No featured-products flag/endpoint — `Product` has no `featured`
//    column, no endpoint exists to fetch a curated subset.
//  - `GET /marketplace/categories` returns the SHARED Category tree
//    (courses/library/marketplace all mixed, `domain` field distinguishes
//    them) — NOT pre-filtered to marketplace-only. The frontend filters
//    client-side by `domain === 'marketplace'`.
//  - `q` search is a plain Postgres `ILIKE` substring match on
//    title/description — not a search index, despite doc16 implying one.
//  - `GET /orders/:id`'s `orderItems` carry only `productId` (no
//    denormalized product title/slug) — there is no batch
//    get-products-by-ids endpoint and no get-product-by-id (only
//    get-by-slug, and only for `published` products). Order Detail
//    therefore cannot reliably resolve a purchased item back to a
//    product title if the product was later unpublished/archived — shown
//    as a raw id with an explicit note, not guessed at.
//  - No buyer-initiated refund request endpoint — `order:refund` is
//    admin/support only.
//  - No cancel-order endpoint — `cancelled` is a valid status value but
//    no code path ever sets it.
//  - CRITICAL: checkout (`POST /orders`) calls the real Stripe SDK to
//    create a Checkout Session; if `STRIPE_SECRET_KEY` is unconfigured
//    (true in every environment per docs/SESSION-HANDOFF.md) the backend
//    throws before returning `checkoutUrl` — checkout is currently
//    non-functional end-to-end, not something this frontend can bypass.
//  - No sandbox/simulate-payment endpoint exists anywhere.
//  - No payment-completion push/webhook-to-client mechanism — the
//    frontend must poll `GET /orders/:id` after returning from Stripe's
//    hosted checkout page.
//  - Downloads: no dedicated `/orders/:id/download` endpoint — the real
//    flow reuses `GET /files/:id` (packages/types/src/files.ts's
//    `GetFileResponse`), entitlement-checked server-side as "does this
//    user have a paid OrderItem for this product's fileId."

export interface ProductRecord {
  id: string;
  categoryId: string;
  ownerId: string | null;
  fileId: string | null;
  title: string;
  slug: string;
  description: string | null;
  priceCents: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface ListProductsQuery {
  cursor?: string;
  limit?: number;
  category?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  q?: string;
}

/** GET /marketplace/categories — the full shared Category tree (all domains), NOT marketplace-scoped server-side. Filter by `domain === 'marketplace'` client-side (recursively, since a marketplace category could theoretically nest under a non-marketplace parent in this shared taxonomy). */
export interface MarketplaceCategoryNode {
  id: string;
  parentCategoryId: string | null;
  name: string;
  slug: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
  children: MarketplaceCategoryNode[];
}

export interface OrderItemRecord {
  id: string;
  orderId: string;
  productId: string;
  unitPriceCents: number;
  quantity: number;
  createdAt: string;
}

export interface OrderRecord {
  id: string;
  userId: string;
  couponId: string | null;
  orderNumber: string;
  status: 'pending' | 'paid' | 'refunded' | 'cancelled';
  totalCents: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

/** GET /orders/:id's real shape — `orderItems` carry no product title/slug, see this file's header comment. */
export interface OrderWithItems extends OrderRecord {
  orderItems: OrderItemRecord[];
}

export interface ListOrdersQuery {
  cursor?: string;
  limit?: number;
  status?: OrderRecord['status'];
}

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  items: CreateOrderItemInput[];
  couponCode?: string;
}

/**
 * POST /orders's real response. `checkoutUrl` is typed nullable to match
 * the backend's own return-type annotation, but in the CURRENT real
 * implementation the call either returns a real Stripe URL or the whole
 * request throws (Stripe unconfigured) before this object is ever
 * returned — `null` is not actually reachable today, but handled here
 * defensively rather than assumed away.
 */
export interface CreateOrderResponse {
  order: OrderWithItems;
  checkoutUrl: string | null;
}

/** Mirrors the Prisma `Payment` model, returned as-is by GET /payments/:id. Schema comment lists `pending | succeeded | failed` but the real refund code path also writes `refunded` — a real doc/schema-comment vs. code divergence, reflected in this wider union. */
export interface PaymentRecord {
  id: string;
  orderId: string;
  provider: string;
  providerPaymentId: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  amountCents: number;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}
