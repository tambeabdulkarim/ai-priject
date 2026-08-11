import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';

describe('OrdersService.create', () => {
  const makeService = () => {
    const ordersRepository = {
      findProductsByIds: jest.fn(),
      findCouponByCode: jest.fn(),
      findByOrderNumber: jest.fn().mockResolvedValue(null),
      createOrderWithItems: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      findManyForUser: jest.fn(),
      findManyAdmin: jest.fn(),
    };
    const auditLogService = { record: jest.fn() };
    const stripeService = {
      createCheckoutSession: jest
        .fn()
        .mockResolvedValue({ sessionId: 's1', url: 'https://stripe.test/session' }),
    };

    const service = new OrdersService(
      ordersRepository as never,
      auditLogService as never,
      stripeService as never,
    );
    return { service, ordersRepository, auditLogService, stripeService };
  };

  it('rejects an order containing an unpublished product', async () => {
    const { service, ordersRepository } = makeService();
    ordersRepository.findProductsByIds.mockResolvedValue([
      { id: 'p1', status: 'draft', priceCents: 1000, title: 'X' },
    ]);

    await expect(
      service.create('u1', { items: [{ productId: 'p1', quantity: 1 }] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an order referencing a nonexistent product', async () => {
    const { service, ordersRepository } = makeService();
    ordersRepository.findProductsByIds.mockResolvedValue([]);

    await expect(
      service.create('u1', { items: [{ productId: 'missing', quantity: 1 }] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an invalid coupon code', async () => {
    const { service, ordersRepository } = makeService();
    ordersRepository.findProductsByIds.mockResolvedValue([
      { id: 'p1', status: 'published', priceCents: 1000, title: 'X' },
    ]);
    ordersRepository.findCouponByCode.mockResolvedValue(null);

    await expect(
      service.create('u1', { items: [{ productId: 'p1', quantity: 1 }], couponCode: 'BOGUS' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a coupon that has hit its redemption limit', async () => {
    const { service, ordersRepository } = makeService();
    ordersRepository.findProductsByIds.mockResolvedValue([
      { id: 'p1', status: 'published', priceCents: 1000, title: 'X' },
    ]);
    ordersRepository.findCouponByCode.mockResolvedValue({
      id: 'c1',
      expiresAt: null,
      maxRedemptions: 5,
      redeemedCount: 5,
      discountType: 'fixed',
      discountValue: 100,
    });

    await expect(
      service.create('u1', { items: [{ productId: 'p1', quantity: 1 }], couponCode: 'MAXED' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('computes a percent-discount total correctly and creates the order', async () => {
    const { service, ordersRepository, stripeService } = makeService();
    ordersRepository.findProductsByIds.mockResolvedValue([
      { id: 'p1', status: 'published', priceCents: 2000, title: 'Widget' },
    ]);
    ordersRepository.findCouponByCode.mockResolvedValue({
      id: 'c1',
      expiresAt: null,
      maxRedemptions: null,
      redeemedCount: 0,
      discountType: 'percent',
      discountValue: 10,
    });
    ordersRepository.createOrderWithItems.mockResolvedValue({
      id: 'o1',
      orderNumber: 'ORD-1',
      currency: 'USD',
      orderItems: [],
    });

    const result = await service.create('u1', {
      items: [{ productId: 'p1', quantity: 2 }],
      couponCode: 'TENOFF',
    });

    // subtotal = 2000 * 2 = 4000; 10% off = 3600
    expect(ordersRepository.createOrderWithItems).toHaveBeenCalledWith(
      expect.objectContaining({ totalCents: 3600, couponId: 'c1' }),
    );
    expect(result.checkoutUrl).toBe('https://stripe.test/session');
    expect(stripeService.createCheckoutSession).toHaveBeenCalled();
  });
});
