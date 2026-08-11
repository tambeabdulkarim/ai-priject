// docs/16-API-CONTRACT.md §12 (Payments).

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // docs/16-API-CONTRACT.md: "Authentication Required: No (provider-signed
  // payload in place of user auth)". Signature verification (over the raw
  // body) is the trust boundary — req.rawBody is preserved by main.ts's
  // `rawBody: true` bootstrap option specifically for this route.
  @Public()
  @HttpCode(200)
  @Post('payments/webhooks/stripe')
  handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe-Signature header.');
    }
    if (!req.rawBody) {
      throw new BadRequestException('Raw request body unavailable for signature verification.');
    }
    return this.paymentsService.handleStripeWebhook(req.rawBody, signature);
  }

  @Get('payments/:id')
  getById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.getById(id, user.sub, user.roles);
  }

  @HttpCode(200)
  @Post('admin/payments/:id/refund')
  @RequirePermissions('order:refund')
  refund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefundPaymentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentsService.refund(id, dto.amountCents, dto.reason, user.sub);
  }
}
