// Data-access layer for Payments/Transactions (docs/13-DATABASE-BLUEPRINT.md).

import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Payment, Prisma, Transaction } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProviderPaymentId(providerPaymentId: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({ where: { providerPaymentId } });
  }

  findById(id: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({ where: { id } });
  }

  findByIdWithOrder(id: string) {
    return this.prisma.payment.findUnique({ where: { id }, include: { order: true } });
  }

  /** Used by EnrollmentsService.refund — docs/16-API-CONTRACT.md POST /enrollments/:id/refund "triggers linked Orders/refund processing". */
  findSucceededByOrderId(orderId: string): Promise<Payment | null> {
    return this.prisma.payment.findFirst({ where: { orderId, status: 'succeeded' }, orderBy: { paidAt: 'desc' } });
  }

  create(data: Prisma.PaymentCreateInput): Promise<Payment> {
    return this.prisma.payment.create({ data });
  }

  update(id: string, data: Prisma.PaymentUpdateInput): Promise<Payment> {
    return this.prisma.payment.update({ where: { id }, data });
  }

  /**
   * docs/15-SYSTEM-WORKFLOWS.md §14: Payment insert/update + Order status
   * update + Transaction ledger entry must be atomic — a crash mid-webhook
   * would otherwise leave the payment recorded but the order still
   * "pending", or vice versa.
   */
  async recordSuccessfulPayment(params: {
    orderId: string;
    providerPaymentId: string;
    amountCents: number;
    currency: string;
    providerReference: string;
  }): Promise<Payment> {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          order: { connect: { id: params.orderId } },
          provider: 'Stripe',
          providerPaymentId: params.providerPaymentId,
          status: 'succeeded',
          amountCents: params.amountCents,
          paidAt: new Date(),
        },
      });
      await tx.order.update({ where: { id: params.orderId }, data: { status: 'paid' } });
      await tx.transaction.create({
        data: {
          payment: { connect: { id: payment.id } },
          type: 'charge',
          amountCents: params.amountCents,
          currency: params.currency,
          providerReference: params.providerReference,
        },
      });
      return payment;
    });
  }

  /**
   * Read-only pre-check used by PaymentsService.refund() BEFORE calling
   * the real Stripe Refunds API — avoids sending an obviously-invalid
   * (already fully refunded / over-limit) request to Stripe at all. This
   * does NOT replace `processRefund`'s own atomic recheck below (a
   * Serializable transaction is still required to make the *local*
   * commit race-safe); it only saves a doomed round-trip to Stripe on the
   * common path.
   */
  async getRefundableBalance(paymentId: string): Promise<number> {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw new Error('Payment not found.');
    }
    const alreadyRefunded =
      (
        await this.prisma.transaction.aggregate({
          where: { paymentId, type: 'refund' },
          _sum: { amountCents: true },
        })
      )._sum.amountCents ?? 0;
    return payment.amountCents - alreadyRefunded;
  }

  /**
   * docs/16-API-CONTRACT.md POST /admin/payments/:id/refund.
   *
   * Fixed during the Phase 13 final audit — three bugs, all stemming from
   * the same root cause (the original `PaymentsService.refund` read the
   * refunded-so-far balance, then wrote the new refund Transaction as two
   * separate, unsynchronized steps):
   *  1. Race condition: two concurrent refund requests could both read the
   *     same "already refunded" balance before either wrote, both pass
   *     the "does not exceed original payment amount" check, and both
   *     insert a refund Transaction — refunding more than the payment.
   *     Fixed by re-reading the balance AND writing the refund Transaction
   *     inside one Serializable transaction: Postgres detects the
   *     read/write conflict between two concurrent serializable
   *     transactions touching the same rows and aborts the loser with a
   *     retryable error (Prisma error code P2034), which the caller
   *     surfaces as 409 instead of silently over-refunding.
   *  2. `Payment.status` never transitioned to `refunded` on a full
   *     refund, so `GET /payments/:id` kept reporting `succeeded`
   *     indefinitely. Now updated in the same transaction.
   *  3. The old code returned the `payment` row fetched *before* the
   *     refund was applied — stale relative to doc16's documented
   *     response body ("refund Transactions entry, updated order/payment
   *     status"). Now returns the post-update row.
   *
   * Phase 10.1: `providerReference` now carries the real Stripe Refund
   * object id (`re_...`), returned by `StripeService.refundPayment` and
   * passed in by `PaymentsService.refund` — stored in the existing
   * `Transaction.providerReference` column (already used the same way by
   * `recordSuccessfulPayment` for the charge side), no schema change.
   */
  async processRefund(params: {
    paymentId: string;
    requestedAmountCents: number | undefined;
    currency: string;
    orderId: string;
    providerReference: string;
  }): Promise<{ payment: Payment; transaction: Transaction; isFullRefund: boolean }> {
    return this.prisma.$transaction(
      async (tx) => {
        const payment = await tx.payment.findUnique({ where: { id: params.paymentId } });
        if (!payment) {
          throw new Error('Payment not found.');
        }

        const alreadyRefunded =
          (
            await tx.transaction.aggregate({
              where: { paymentId: params.paymentId, type: 'refund' },
              _sum: { amountCents: true },
            })
          )._sum.amountCents ?? 0;
        const refundable = payment.amountCents - alreadyRefunded;
        if (refundable <= 0) {
          throw new ConflictException('This payment has already been fully refunded.');
        }

        const refundAmount = params.requestedAmountCents ?? refundable;
        if (refundAmount > refundable) {
          throw new BadRequestException(`Refund amount exceeds the refundable balance of ${refundable} cents.`);
        }

        const transaction = await tx.transaction.create({
          data: {
            payment: { connect: { id: params.paymentId } },
            type: 'refund',
            amountCents: refundAmount,
            currency: params.currency,
            providerReference: params.providerReference,
          },
        });

        const isFullRefund = refundAmount === refundable;
        if (isFullRefund) {
          await tx.payment.update({ where: { id: params.paymentId }, data: { status: 'refunded' } });
          await tx.order.update({ where: { id: params.orderId }, data: { status: 'refunded' } });
        }

        const updatedPayment = await tx.payment.findUniqueOrThrow({ where: { id: params.paymentId } });
        return { payment: updatedPayment, transaction, isFullRefund };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
