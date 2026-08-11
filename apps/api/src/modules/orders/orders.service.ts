// docs/16-API-CONTRACT.md §11 (Orders). docs/15-SYSTEM-WORKFLOWS.md §13 (Checkout).

import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Order } from '@prisma/client';
import { PaginatedResult } from '../../common/dto/pagination-query.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { StripeService } from '../../payments/stripe.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListAdminOrdersQueryDto, ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { OrderWithItems, OrdersRepository } from './orders.repository';

const ORDER_READ_ROLES = ['admin', 'superadmin', 'support'];

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly auditLogService: AuditLogService,
    private readonly stripeService: StripeService,
  ) {}

  /**
   * docs/16-API-CONTRACT.md POST /orders. "total computed server-side
   * only" — the client never supplies a price; every amount here is read
   * fresh from `Products` at request time.
   */
  async create(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<{ order: OrderWithItems; checkoutUrl: string | null }> {
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.ordersRepository.findProductsByIds(productIds);
    const productById = new Map(products.map((p) => [p.id, p]));

    for (const item of dto.items) {
      const product = productById.get(item.productId);
      if (!product || product.status !== 'published') {
        throw new BadRequestException(`Product ${item.productId} is not available for purchase.`);
      }
    }

    let subtotalCents = 0;
    const lineItems = dto.items.map((item) => {
      const product = productById.get(item.productId)!;
      subtotalCents += product.priceCents * item.quantity;
      return {
        productId: item.productId,
        unitPriceCents: product.priceCents,
        quantity: item.quantity,
        name: product.title,
      };
    });

    let couponId: string | undefined;
    let totalCents = subtotalCents;
    if (dto.couponCode) {
      const coupon = await this.ordersRepository.findCouponByCode(dto.couponCode);
      if (!coupon || (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now())) {
        throw new BadRequestException('Invalid or expired coupon.');
      }
      if (coupon.maxRedemptions !== null && coupon.redeemedCount >= coupon.maxRedemptions) {
        throw new BadRequestException('Coupon has reached its redemption limit.');
      }
      couponId = coupon.id;
      totalCents =
        coupon.discountType === 'percent'
          ? Math.round(subtotalCents * (1 - coupon.discountValue / 100))
          : Math.max(0, subtotalCents - coupon.discountValue);
    }

    const orderNumber = await this.generateUniqueOrderNumber();
    const order = await this.ordersRepository.createOrderWithItems({
      userId,
      orderNumber,
      totalCents,
      currency: 'USD',
      couponId,
      items: lineItems,
    });

    await this.auditLogService.record({
      actorUserId: userId,
      action: 'order.created',
      targetType: 'Order',
      targetId: order.id,
      afterState: { totalCents, orderNumber },
    });

    // docs/SESSION-HANDOFF.md Blocker: STRIPE_SECRET_KEY is blank in every
    // environment file — this is an infrastructure gap, not an
    // architectural one. The order itself is fully created either way;
    // only checkout-URL generation is affected, and fails loudly (real
    // Stripe SDK call, not a placeholder) rather than faking a URL.
    const { url: checkoutUrl } = await this.stripeService.createCheckoutSession({
      orderId: order.id,
      lineItems: lineItems.map((li) => ({
        name: li.name,
        unitAmountCents: li.unitPriceCents,
        quantity: li.quantity,
      })),
      currency: order.currency,
      successUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/checkout/success?order=${order.id}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/checkout/cancel?order=${order.id}`,
    });

    return { order, checkoutUrl };
  }

  /** docs/16-API-CONTRACT.md GET /orders/me */
  listMine(userId: string, query: ListOrdersQueryDto): Promise<PaginatedResult<Order>> {
    return this.ordersRepository.findManyForUser({
      userId,
      cursor: query.cursor,
      limit: query.limit,
      status: query.status,
    });
  }

  /** docs/16-API-CONTRACT.md GET /orders/:id — resource owner or `order:read`. */
  async getById(id: string, actorId: string, actorRoles: string[]): Promise<OrderWithItems> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found.');
    }
    const isOwner = order.userId === actorId;
    const isPrivileged = actorRoles.some((r) => ORDER_READ_ROLES.includes(r));
    if (!isOwner && !isPrivileged) {
      throw new ForbiddenException('Not authorized to view this order.');
    }
    return order;
  }

  /** docs/16-API-CONTRACT.md GET /admin/orders — `order:list` (admin). */
  listAdmin(query: ListAdminOrdersQueryDto): Promise<PaginatedResult<Order>> {
    return this.ordersRepository.findManyAdmin({
      cursor: query.cursor,
      limit: query.limit,
      status: query.status,
      userId: query.user,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });
  }

  private async generateUniqueOrderNumber(): Promise<string> {
    let candidate: string;
    do {
      candidate = `ORD-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
    } while (await this.ordersRepository.findByOrderNumber(candidate));
    return candidate;
  }
}
