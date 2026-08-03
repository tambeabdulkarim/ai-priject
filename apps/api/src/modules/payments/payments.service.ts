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
import { Payment, Prisma } from '@prisma/client';
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

    let payment: Payment;
    try {
      payment = await this.paymentsRepository.recordSuccessfulPayment({
        orderId: order.id,
        providerPaymentId: paymentIntentId,
        amountCents: session.amount_total ?? order.totalCents,
        currency: (session.currency ?? order.currency).toUpperCase(),
        providerReference: session.id,
      });
    } catch (error) {
      // Two concurrent deliveries of the same Stripe event can both pass
      // the findByProviderPaymentId check above before either commits —
      // the unique constraint on providerPaymentId (schema.prisma:924) is
      // the real idempotency guard; this just makes the loser's failure a
      // graceful no-op (matching the existing early-return above) instead
      // of an unhandled 500 that would make Stripe retry indefinitely.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return;
      }
      throw error;
    }

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

  /**
   * docs/16-API-CONTRACT.md POST /admin/payments/:id/refund — `order:refund`
   * (admin/support).
   *
   * Phase 10.1: previously only updated local ledger rows — no money ever
   * actually moved back to the buyer. Now calls the real Stripe Refunds
   * API (`StripeService.refundPayment`) using the payment's own
   * `providerPaymentId`, no new column needed. Sequencing:
   *  1. A cheap, read-only balance pre-check (`getRefundableBalance`)
   *     rejects an obviously-invalid request (already fully refunded /
   *     over the remaining balance) BEFORE ever calling Stripe — same
   *     validation, same exception types as before this change.
   *  2. Stripe is called with a deterministic idempotency key
   *     (`refund:<paymentId>:<amountCents|full>`), so a retried request
   *     (e.g. after a network timeout) cannot double-refund at the
   *     provider even if this handler runs twice.
   *  3. The existing atomic, Serializable local transaction
   *     (`processRefund`) still re-validates the balance and commits the
   *     ledger — this is the layer that makes concurrent *local* refund
   *     requests race-safe, which a Stripe-side idempotency key alone
   *     does not guarantee (two different amounts under the same balance
   *     are two different Stripe calls). The Stripe Refund's real id is
   *     stored as `Transaction.providerReference` (existing column, same
   *     as the charge side already does).
   *  4. If step 3 loses a race despite the step-1 pre-check (a narrow
   *     window between the two), the Stripe refund has already succeeded
   *     but the local commit has not — logged at ERROR for manual
   *     reconciliation rather than silently dropped, since inventing an
   *     automatic Stripe-side compensating action is out of this phase's
   *     scope.
   */
  async refund(id: string, amountCents: number | undefined, reason: string, actorId: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findByIdWithOrder(id);
    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }

    const refundable = await this.paymentsRepository.getRefundableBalance(id);
    if (refundable <= 0) {
      throw new ConflictException('This payment has already been fully refunded.');
    }
    const requestedAmount = amountCents ?? refundable;
    if (requestedAmount > refundable) {
      throw new BadRequestException(`Refund amount exceeds the refundable balance of ${refundable} cents.`);
    }

    const idempotencyKey = `refund:${id}:${amountCents ?? 'full'}`;
    let stripeRefund: { id: string; amountCents: number; status: string };
    try {
      stripeRefund = await this.stripeService.refundPayment({
        paymentIntentId: payment.providerPaymentId,
        amountCents,
        idempotencyKey,
      });
    } catch (error) {
      throw new BadRequestException(`Stripe refund failed: ${(error as Error).message}`);
    }

    let result: { payment: Payment; isFullRefund: boolean; transaction: { amountCents: number } };
    try {
      result = await this.paymentsRepository.processRefund({
        paymentId: id,
        requestedAmountCents: amountCents,
        currency: payment.order.currency,
        orderId: payment.orderId,
        providerReference: stripeRefund.id,
      });
    } catch (error) {
      // Concurrent refund requests racing the same payment: Postgres
      // aborts the losing Serializable transaction with P2034. Surfaced
      // as 409 rather than an opaque 500 — the caller can safely retry
      // and will see the balance the other request already committed.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        this.logger.error(
          `Stripe refund ${stripeRefund.id} succeeded for payment ${id} but the local ledger commit lost a ` +
            'concurrent race (P2034) — manual reconciliation required.',
        );
        throw new ConflictException('This payment is being refunded concurrently — please retry.');
      }
      throw error;
    }

    const { payment: updatedPayment, isFullRefund, transaction } = result;

    await this.auditLogService.record({
      actorUserId: actorId,
      action: 'payment.refunded',
      targetType: 'Payment',
      targetId: id,
      afterState: {
        refundAmount: transaction.amountCents,
        reason,
        fullRefund: isFullRefund,
        stripeRefundId: stripeRefund.id,
      },
    });

    await this.notificationsService.create({
      userId: payment.order.userId,
      type: 'payment.refunded',
      title: 'Refund processed',
      body: `A refund of ${(transaction.amountCents / 100).toFixed(2)} ${payment.order.currency} has been issued for order ${payment.order.orderNumber}.`,
      sourceEventId: payment.id,
    });

    return updatedPayment;
  }
}
