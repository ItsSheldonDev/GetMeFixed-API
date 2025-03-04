import { Controller, Post, Body, Headers, Req, RawBodyRequest, HttpCode } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../core/decorators/public.decorator';

@ApiTags('Paiements')
@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('create-checkout')
  @ApiOperation({ summary: 'Créer une session de paiement Stripe' })
  @ApiResponse({ status: 200, description: 'Session créée avec succès' })
  async createCheckout(@Body() data: { planId: string; email: string }) {
    return await this.paymentService.createCheckoutSession(data.planId, data.email);
  }

  @Post('webhook')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Webhook Stripe pour le traitement des paiements' })
  async handleWebhook(@Req() request: RawBodyRequest<Request>, @Headers('stripe-signature') signature: string) {
    return await this.paymentService.handleWebhook(request.rawBody, signature);
  }
}