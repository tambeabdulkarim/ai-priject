// Data-access layer for Orders/Order_Items/Coupons (docs/13-DATABASE-BLUEPRINT.md).

import { ConflictException, Injectable } from '@nestjs/common';
import { Coupon, Order, OrderItem, Prisma, Product } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export type OrderWithItems = Order & { orderItems: OrderItem[] };

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProductsByIds(ids: string[]): Promise<Product[]> {
    return this.prisma.product.findMany({ where: { id: { in: ids } } });
  }

  findCouponByCode(code: string): Promise<Coupon | null> {
    return this.prisma.coupon.findUnique({ where: { code } });
  }

  findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.prisma.order.findUnique({ where: { orderNumber } });
  }

  findById(id: string): Promise<OrderWithItems | null> {
    return this.prisma.order.findUnique({ where: { id }, include: { orderItems: true } });
  }

  update(id: string, data: Prisma.OrderUpdateInput): Promise<Order> {
    return this.prisma.order.update({ where: { id }, data });
  }

  /**
   * docs/15-SYSTEM-WORKFLOWS.md §13 (Checkout): Orders insert, Order_Items
   * insert (price-snapshotted), Coupons redemption-count increment — one
   * atomic transaction so a crash mid-checkout can never leave an Order
   * without its line items, or increment a coupon's redemption count
   * without a corresponding order.
   */
  async createOrderWithItems(params: {
    userId: string;
    orderNumber: string;
    totalCents: number;
    currency: string;
    couponId?: string;
    items: { productId: string; unitPriceCents: number; quantity: number }[];
  }): Promise<OrderWithItems> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          user: { connect: { id: params.userId } },
          orderNumber: params.orderNumber,
          totalCents: params.totalCents,
          currency: params.currency,
          status: 'pending',
          ...(params.couponId ? { coupon: { connect: { id: params.couponId } } } : {}),
        },
      });

      await tx.orderItem.createMany({
        data: params.items.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          unitPriceCents: item.unitPriceCents,
          quantity: item.quantity,
        })),
      });

      if (params.couponId) {
        // docs/16-API-CONTRACT.md POST /orders. Fixed during the Phase 13
        // final audit: an unconditional `increment: 1` here let two
        // concurrent checkouts both pass OrdersService's pre-transaction
        // "redeemedCount < maxRedemptions" read and both increment,
        // pushing the coupon over its redemption cap (over-discounting).
        // Fixed by making the increment itself conditional on the cap
        // still holding, evaluated atomically by Postgres as part of a
        // single UPDATE...WHERE statement (the row lock the UPDATE takes
        // means a second concurrent transaction re-evaluates the WHERE
        // against the already-incremented row, not a stale read) — the
        // same pattern as an optimistic-lock guard, no isolation-level
        // change needed since it's one statement, not a read-then-write
        // pair.
        const coupon = await tx.coupon.findUniqueOrThrow({ where: { id: params.couponId } });
        const guard: Prisma.CouponWhereInput = { id: params.couponId };
        if (coupon.maxRedemptions !== null) {
          guard.redeemedCount = { lt: coupon.maxRedemptions };
        }
        const { count } = await tx.coupon.updateMany({
          where: guard,
          data: { redeemedCount: { increment: 1 } },
        });
        if (count === 0) {
          throw new ConflictException('Coupon has reached its redemption limit.');
        }
      }

      const orderItems = await tx.orderItem.findMany({ where: { orderId: order.id } });
      return { ...order, orderItems };
    });
  }

  async findManyForUser(params: {
    userId: string;
    cursor?: string;
    limit: number;
    status?: string;
  }): Promise<{ items: Order[]; nextCursor: string | null }> {
    const items = await this.prisma.order.findMany({
      take: params.limit + 1,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      where: { userId: params.userId, ...(params.status ? { status: params.status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    const hasMore = items.length > params.limit;
    const page = hasMore ? items.slice(0, params.limit) : items;
    return { items: page, nextCursor: hasMore ? page[page.length - 1].id : null };
  }

  async findManyAdmin(params: {
    cursor?: string;
    limit: number;
    status?: string;
    userId?: string;
    from?: Date;
    to?: Date;
  }): Promise<{ items: Order[]; nextCursor: string | null }> {
    const where: Prisma.OrderWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.userId ? { userId: params.userId } : {}),
      ...(params.from || params.to
        ? {
            createdAt: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
    };
    const items = await this.prisma.order.findMany({
      take: params.limit + 1,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      where,
      orderBy: { createdAt: 'desc' },
    });
    const hasMore = items.length > params.limit;
    const page = hasMore ? items.slice(0, params.limit) : items;
    return { items: page, nextCursor: hasMore ? page[page.length - 1].id : null };
  }
}
