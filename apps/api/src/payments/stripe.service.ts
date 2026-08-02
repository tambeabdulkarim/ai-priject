// docs/10-SECURITY-BIBLE.md §13: "signature verified against Stripe's
// signing secret before payload is trusted." Real Stripe SDK calls, same
// pattern as StorageService — the code path is real; it has no live
// credentials yet (docs/SESSION-HANDOFF.md Blocker: STRIPE_SECRET_KEY is
// blank everywhere), so it throws a clear "not configured" error at
// call-time rather than faking a response.

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { AppConfig } from '../config/configuration';

export interface CheckoutLineItem {
  name: string;
  unitAmountCents: number;
  quantity: number;
}

@Injectable()
export class StripeService {
  private readonly client: Stripe | null;
  private readonly webhookSecret: string;

  constructor(configService: ConfigService<AppConfig, true>) {
    const stripeConfig = configService.get('stripe', { infer: true });
    this.webhookSecret = stripeConfig.webhookSecret;
    this.client = stripeConfig.secretKey ? new Stripe(stripeConfig.secretKey) : null;
  }

  private assertConfigured(): Stripe {
    if (!this.client) {
      throw new Error('Stripe is not configured: STRIPE_SECRET_KEY is empty.');
    }
    return this.client;
  }

  /**
   * docs/16-API-CONTRACT.md POST /orders: "checkout session URL
   * (provider-hosted)". `client_reference_id` carries our Order.id so the
   * webhook can correlate the event back to the order without any new
   * database column — Stripe's own session object is the correlation
   * mechanism, per Stripe's documented API, not an invented one.
   */
  async createCheckoutSession(params: {
    orderId: string;
    lineItems: CheckoutLineItem[];
    currency: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; url: string }> {
    const client = this.assertConfigured();
    const session = await client.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: params.orderId,
      line_items: params.lineItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: params.currency.toLowerCase(),
          unit_amount: item.unitAmountCents,
          product_data: { name: item.name },
        },
      })),
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });

    if (!session.url) {
      throw new Error('Stripe did not return a checkout session URL.');
    }
    return { sessionId: session.id, url: session.url };
  }

  /** docs/10-SECURITY-BIBLE.md §13: signature verification is the trust boundary. */
  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const client = this.assertConfigured();
    if (!this.webhookSecret) {
      throw new Error('Stripe is not configured: STRIPE_WEBHOOK_SECRET is empty.');
    }
    return client.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
  }
}
