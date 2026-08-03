import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  const makeService = () => {
    const paymentsRepository = {
      findByProviderPaymentId: jest.fn(),
      findById: jest.fn(),
      findByIdWithOrder: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      createTransaction: jest.fn(),
      sumRefundedForPayment: jest.fn(),
      recordSuccessfulPayment: jest.fn(),
      processRefund: jest.fn(),
      getRefundableBalance: jest.fn(),
    };
    const ordersRepository = { findById: jest.fn(), update: jest.fn() };
    const stripeService = { constructWebhookEvent: jest.fn(), refundPayment: jest.fn() };
    const auditLogService = { record: jest.fn() };
    const notificationsService = { create: jest.fn() };

    const service = new PaymentsService(
      paymentsRepository as never,
      ordersRepository as never,
      stripeService as never,
      auditLogService as never,
      notificationsService as never,
    );
    return { service, paymentsRepository, ordersRepository, stripeService, auditLogService, notificationsService };
  };

  describe('handleStripeWebhook', () => {
    it('rejects a request with an invalid signature', async () => {
      const { service, stripeService } = makeService();
      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new Error('bad signature');
      });

      await expect(service.handleStripeWebhook(Buffer.from('{}'), 'bad-sig')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('is idempotent: a checkout.session.completed for an already-recorded payment is a no-op', async () => {
      const { service, stripeService, paymentsRepository, ordersRepository } = makeService();
      stripeService.constructWebhookEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: { client_reference_id: 'order1', payment_intent: 'pi_123' } },
      });
      paymentsRepository.findByProviderPaymentId.mockResolvedValue({ id: 'existing-payment' });

      const result = await service.handleStripeWebhook(Buffer.from('{}'), 'sig');

      expect(result).toEqual({ received: true });
      expect(ordersRepository.findById).not.toHaveBeenCalled();
      expect(paymentsRepository.recordSuccessfulPayment).not.toHaveBeenCalled();
    });

    it('records a new successful payment, marks the order paid, and notifies the buyer', async () => {
      const { service, stripeService, paymentsRepository, ordersRepository, notificationsService } =
        makeService();
      stripeService.constructWebhookEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_1',
            client_reference_id: 'order1',
            payment_intent: 'pi_123',
            amount_total: 5000,
            currency: 'usd',
          },
        },
      });
      paymentsRepository.findByProviderPaymentId.mockResolvedValue(null);
      ordersRepository.findById.mockResolvedValue({ id: 'order1', userId: 'u1', orderNumber: 'ORD-1', totalCents: 5000, currency: 'USD' });
      paymentsRepository.recordSuccessfulPayment.mockResolvedValue({ id: 'payment1', amountCents: 5000 });

      const result = await service.handleStripeWebhook(Buffer.from('{}'), 'sig');

      expect(result).toEqual({ received: true });
      expect(paymentsRepository.recordSuccessfulPayment).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: 'order1', providerPaymentId: 'pi_123' }),
      );
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u1', type: 'order.paid' }),
      );
    });
  });

  describe('refund', () => {
    const baseOrder = {
      id: 'pay1',
      amountCents: 1000,
      orderId: 'order1',
      providerPaymentId: 'pi_123',
      order: { userId: 'u1', currency: 'USD', orderNumber: 'ORD-1' },
    };

    it('rejects refunding a payment that has already been fully refunded, WITHOUT calling Stripe', async () => {
      const { service, paymentsRepository, stripeService } = makeService();
      paymentsRepository.findByIdWithOrder.mockResolvedValue(baseOrder);
      paymentsRepository.getRefundableBalance.mockResolvedValue(0);

      await expect(service.refund('pay1', undefined, 'customer request', 'admin1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(stripeService.refundPayment).not.toHaveBeenCalled();
    });

    it('rejects a refund amount exceeding the refundable balance, WITHOUT calling Stripe', async () => {
      const { service, paymentsRepository, stripeService } = makeService();
      paymentsRepository.findByIdWithOrder.mockResolvedValue(baseOrder);
      paymentsRepository.getRefundableBalance.mockResolvedValue(1000);

      await expect(service.refund('pay1', 5000, 'customer request', 'admin1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(stripeService.refundPayment).not.toHaveBeenCalled();
    });

    it('calls the real Stripe Refunds API with the payment intent id and a deterministic idempotency key, then commits the local ledger', async () => {
      const { service, paymentsRepository, stripeService, notificationsService, auditLogService } = makeService();
      paymentsRepository.findByIdWithOrder.mockResolvedValue(baseOrder);
      paymentsRepository.getRefundableBalance.mockResolvedValue(1000);
      stripeService.refundPayment.mockResolvedValue({ id: 're_abc', amountCents: 1000, status: 'succeeded' });
      paymentsRepository.processRefund.mockResolvedValue({
        payment: { id: 'pay1', amountCents: 1000, status: 'refunded' },
        transaction: { amountCents: 1000 },
        isFullRefund: true,
      });

      const result = await service.refund('pay1', undefined, 'customer request', 'admin1');

      expect(stripeService.refundPayment).toHaveBeenCalledWith({
        paymentIntentId: 'pi_123',
        amountCents: undefined,
        idempotencyKey: 'refund:pay1:full',
      });
      expect(paymentsRepository.processRefund).toHaveBeenCalledWith({
        paymentId: 'pay1',
        requestedAmountCents: undefined,
        currency: 'USD',
        orderId: 'order1',
        providerReference: 're_abc',
      });
      expect(result.status).toBe('refunded');
      expect(auditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'payment.refunded',
          afterState: expect.objectContaining({ refundAmount: 1000, fullRefund: true, stripeRefundId: 're_abc' }),
        }),
      );
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u1', type: 'payment.refunded' }),
      );
    });

    it('processes a partial refund without treating it as full, using a distinct idempotency key', async () => {
      const { service, paymentsRepository, stripeService, auditLogService } = makeService();
      paymentsRepository.findByIdWithOrder.mockResolvedValue(baseOrder);
      paymentsRepository.getRefundableBalance.mockResolvedValue(1000);
      stripeService.refundPayment.mockResolvedValue({ id: 're_partial', amountCents: 400, status: 'succeeded' });
      paymentsRepository.processRefund.mockResolvedValue({
        payment: { id: 'pay1', amountCents: 1000, status: 'succeeded' },
        transaction: { amountCents: 400 },
        isFullRefund: false,
      });

      await service.refund('pay1', 400, 'partial goodwill refund', 'admin1');

      expect(stripeService.refundPayment).toHaveBeenCalledWith({
        paymentIntentId: 'pi_123',
        amountCents: 400,
        idempotencyKey: 'refund:pay1:400',
      });
      expect(auditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({ afterState: expect.objectContaining({ refundAmount: 400, fullRefund: false }) }),
      );
    });

    it('surfaces a Stripe-side refund failure as a 400 without touching the local ledger', async () => {
      const { service, paymentsRepository, stripeService } = makeService();
      paymentsRepository.findByIdWithOrder.mockResolvedValue(baseOrder);
      paymentsRepository.getRefundableBalance.mockResolvedValue(1000);
      stripeService.refundPayment.mockRejectedValue(new Error('charge already refunded'));

      await expect(service.refund('pay1', undefined, 'customer request', 'admin1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(paymentsRepository.processRefund).not.toHaveBeenCalled();
    });

    it('converts a concurrent-refund local write conflict (Prisma P2034) into 409 after Stripe already succeeded', async () => {
      const { service, paymentsRepository, stripeService } = makeService();
      paymentsRepository.findByIdWithOrder.mockResolvedValue(baseOrder);
      paymentsRepository.getRefundableBalance.mockResolvedValue(1000);
      stripeService.refundPayment.mockResolvedValue({ id: 're_race', amountCents: 1000, status: 'succeeded' });
      const conflictError = Object.assign(new Error('Transaction write conflict'), { code: 'P2034', name: 'PrismaClientKnownRequestError' });
      Object.setPrototypeOf(conflictError, Prisma.PrismaClientKnownRequestError.prototype);
      paymentsRepository.processRefund.mockRejectedValue(conflictError);

      await expect(service.refund('pay1', undefined, 'customer request', 'admin1')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });
});
