// docs/16-API-CONTRACT.md §12 (Payments). docs/15-SYSTEM-WORKFLOWS.md §14
// (Payment Success) / §15 (Payment Failure).
//
// BLOCKED BY DOCUMENTATION — entitlement fan-out: doc15 §14 says a
// successful payment "triggers Workflow 8 for course products," but per
// the Entitlement Architecture Report, `Product` has no relation to
// `Course`/`LibraryItem` and the approved docs contradict each other on
// how one would be derived. This handler records the payment, marks the
// order paid, and writes the financial ledger entry — all fully
// documented and unblocked — but does NOT attempt to grant course/library
// entitlement for any purchased line item, since there is no way to
// resolve which (if any) purchased Product corresponds to a Course. Only
// this one step is stopped; the rest of Phase 8 is unaffected.

import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { Payment } from '@prisma/client';
import { AuditLogService } from '../../common/services/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrdersRepository } from '../orders/orders.repository';
import { StripeService } from '../../payments/stripe.service';
import { PaymentsRepository } from './payments.repository';

const PAYMENT_READ_ROLES = ['admin', 'superadmin', 'support'];

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly ordersRepository: OrdersRepository,
    private readonly stripeService: StripeService,
    private readonly auditLogService: AuditLogService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** docs/16-API-CONTRACT.md POST /payments/webhooks/stripe */
  async handleStripeWebhook(rawBody: Buffer, signature: string): Promise<{ received: true }> {
    let event: Stripe.Event;
    try {
      event = this.stripeService.constructWebhookEvent(rawBody, signature);
    } catch (error) {
      throw new BadRequestException(`Invalid Stripe signature: ${(error as Error).message}`);
    }

    if (event.type === 'checkout.session.completed') {
      await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    } else if (
      event.type === 'payment_intent.payment_failed' ||
      event.type === 'checkout.session.async_payment_failed'
    ) {
      await this.handlePaymentFailed(event.data.object as Stripe.Checkout.Session | Stripe.PaymentIntent);
    }
    // Other event types are acknowledged but intentionally not acted on —
    // doc16 documents only the success/failure paths for this endpoint.

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const orderId = session.client_reference_id;
    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
    if (!orderId || !paymentIntentId) {
      this.logger.error('Stripe checkout.session.completed missing client_reference_id or payment_intent.');
      return;
    }

    // Idempotency: docs/16-API-CONTRACT.md "idempotency guard on event ID"
    // — keyed on the provider payment reference, since no separate
    // webhook-events table exists in docs/13-DATABASE-BLUEPRINT.md.
    const existing = await this.paymentsRepository.findByProviderPaymentId(paymentIntentId);
    if (existing) {
      return;
    }

    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      this.logger.error(`Stripe webhook referenced unknown order ${orderId}.`);
      return;
    }

    const payment = await this.paymentsRepository.recordSuccessfulPayment({
      orderId: order.id,
      providerPaymentId: paymentIntentId,
      amountCents: session.amount_total ?? order.totalCents,
      currency: (session.currency ?? order.currency).toUpperCase(),
      providerReference: session.id,
    });

    await this.auditLogService.record({
      actorUserId: order.userId,
      action: 'payment.succeeded',
      targetType: 'Payment',
      targetId: payment.id,
      afterState: { orderId: order.id, amountCents: payment.amountCents },
    });

    await this.notificationsService.create({
      userId: order.userId,
      type: 'order.paid',
      title: 'Order confirmed',
      body: `Your order ${order.orderNumber} has been paid.`,
      sourceEventId: order.id,
    });

    // Entitlement fan-out per purchased OrderItem — BLOCKED, see file header.
  }

  private async handlePaymentFailed(object: Stripe.Checkout.Session | Stripe.PaymentIntent): Promise<void> {
    const orderId = 'client_reference_id' in object ? object.client_reference_id : undefined;
    if (!orderId) {
      this.logger.error('Stripe payment-failure event missing client_reference_id.');
      return;
    }
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      return;
    }

    await this.auditLogService.record({
      actorUserId: order.userId,
      action: 'payment.failed',
      targetType: 'Order',
      targetId: order.id,
    });
    // docs/16-API-CONTRACT.md: Order "remains pending or transitions to a
    // distinct payment_failed sub-state depending on product decision" —
    // no such sub-state is defined anywhere in docs/13-DATABASE-BLUEPRINT.md's
    // documented status enum (pending/paid/refunded/cancelled), so the
    // order is left `pending` (the documented default), not invented.
  }

  /** docs/16-API-CONTRACT.md GET /payments/:id — owner (via order) or `payment:read`. */
  async getById(id: string, actorId: string, actorRoles: string[]): Promise<Payment> {
    const payment = await this.paymentsRepository.findByIdWithOrder(id);
    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }
    const isOwner = payment.order.userId === actorId;
    const isPrivileged = actorRoles.some((r) => PAYMENT_READ_ROLES.includes(r));
    if (!isOwner && !isPrivileged) {
      throw new ForbiddenException('Not authorized to view this payment.');
    }
    return payment;
  }

  /** docs/16-API-CONTRACT.md POST /admin/payments/:id/refund — `order:refund` (admin/support). */
  async refund(id: string, amountCents: number | undefined, reason: string, actorId: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findByIdWithOrder(id);
    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }

    const alreadyRefunded = (await this.paymentsRepository.sumRefundedForPayment(id))._sum.amountCents ?? 0;
    const refundable = payment.amountCents - alreadyRefunded;
    if (refundable <= 0) {
      throw new ConflictException('This payment has already been fully refunded.');
    }

    const refundAmount = amountCents ?? refundable;
    if (refundAmount > refundable) {
      throw new BadRequestException(`Refund amount exceeds the refundable balance of ${refundable} cents.`);
    }

    await this.paymentsRepository.createTransaction({
      payment: { connect: { id } },
      type: 'refund',
      amountCents: refundAmount,
      currency: payment.order.currency,
    });

    const isFullRefund = refundAmount === refundable;
    if (isFullRefund) {
      await this.ordersRepository.update(payment.orderId, { status: 'refunded' });
    }

    await this.auditLogService.record({
      actorUserId: actorId,
      action: 'payment.refunded',
      targetType: 'Payment',
      targetId: id,
      afterState: { refundAmount, reason, fullRefund: isFullRefund },
    });

    await this.notificationsService.create({
      userId: payment.order.userId,
      type: 'payment.refunded',
      title: 'Refund processed',
      body: `A refund of ${(refundAmount / 100).toFixed(2)} ${payment.order.currency} has been issued for order ${payment.order.orderNumber}.`,
      sourceEventId: payment.id,
    });

    return payment;
  }
}
