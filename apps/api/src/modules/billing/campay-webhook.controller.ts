import { Body, Controller, Get, Logger, Post, Query, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { SkipSubscriptionCheck } from '../../common/decorators/skip-subscription-check.decorator';
import { CamPayService } from '../campay/campay.service';
import { BillingService } from './billing.service';

interface CamPayCallbackPayload {
  status?: string;
  reference?: string;
  amount?: string;
  currency?: string;
  external_reference?: string;
  signature?: string;
}

/**
 * Route publique appelée directement par les serveurs CamPay (pas de JWT
 * applicatif) — séparée de BillingController pour ne pas mélanger les
 * décorateurs d'autorisation, comme pour WhatsAppWebhookController.
 */
@ApiExcludeController()
@Controller('payments/campay')
@SkipSubscriptionCheck()
export class CamPayWebhookController {
  private readonly logger = new Logger(CamPayWebhookController.name);

  constructor(
    private readonly camPayService: CamPayService,
    private readonly billingService: BillingService,
  ) {}

  @Public()
  @Post('webhook')
  async receiveWebhookPost(@Body() payload: CamPayCallbackPayload, @Res() res: Response): Promise<void> {
    await this.handleCallback(payload, res, 'POST');
  }

  /**
   * CamPay livre en réalité son callback en GET, avec tous les champs en
   * query string (constaté sur une vraie tentative CamPay -> 404, faute de
   * route GET ici). Le format POST/JSON ci-dessus est conservé — jamais
   * confirmé comme réellement utilisé par CamPay, mais inoffensif à garder
   * et déjà couvert par les tests existants.
   */
  @Public()
  @Get('webhook')
  async receiveWebhookGet(@Query() payload: CamPayCallbackPayload, @Res() res: Response): Promise<void> {
    await this.handleCallback(payload, res, 'GET');
  }

  private async handleCallback(
    payload: CamPayCallbackPayload,
    res: Response,
    method: 'GET' | 'POST',
  ): Promise<void> {
    if (!this.camPayService.verifyWebhookSignature(payload.signature)) {
      this.logger.warn(`${method} /payments/campay/webhook rejeté : signature invalide ou absente.`);
      res.status(403).send();
      return;
    }

    if (!payload.external_reference || !payload.reference || !payload.status) {
      this.logger.warn(`${method} /payments/campay/webhook rejeté : champs requis manquants.`);
      res.status(400).send();
      return;
    }

    try {
      await this.billingService.applyPaymentResult({
        reference: payload.reference,
        externalReference: payload.external_reference,
        status: payload.status,
        amount: payload.amount ?? '0',
        currency: payload.currency ?? '',
      });
    } catch (error) {
      // Ne jamais faire échouer l'accusé de réception pour une erreur de
      // traitement interne — CamPay réessaierait indéfiniment un événement
      // que nous avons déjà reçu. L'erreur reste journalisée pour investigation.
      this.logger.error(`Échec du traitement du webhook CamPay : ${(error as Error).message}`, (error as Error).stack);
    }

    res.status(200).send();
  }
}
