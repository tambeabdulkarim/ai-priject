// Data-access layer for Payments/Transactions (docs/13-DATABASE-BLUEPRINT.md).

import { Injectable } from '@nestjs/common';
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

  create(data: Prisma.PaymentCreateInput): Promise<Payment> {
    return this.prisma.payment.create({ data });
  }

  update(id: string, data: Prisma.PaymentUpdateInput): Promise<Payment> {
    return this.prisma.payment.update({ where: { id }, data });
  }

  createTransaction(data: Prisma.TransactionCreateInput): Promise<Transaction> {
    return this.prisma.transaction.create({ data });
  }

  sumRefundedForPayment(paymentId: string): Promise<{ _sum: { amountCents: number | null } }> {
    return this.prisma.transaction.aggregate({
      where: { paymentId, type: 'refund' },
      _sum: { amountCents: true },
    });
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
}
