import { createHmac, timingSafeEqual } from 'crypto';
import { Controller, Get, Headers, Logger, Post, Query, RawBodyRequest, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CopilotService } from '../copilot/copilot.service';
import { toWhatsAppText } from './markdown-to-whatsapp';
import { WhatsAppWebhookPayload } from './whatsapp-webhook.types';
import { WhatsAppService } from './whatsapp.service';

/**
 * Routes publiques appelées directement par les serveurs de Meta (pas de
 * JWT applicatif) : séparées de WhatsAppController (gardé par @Roles)
 * pour ne pas devoir jongler avec des overrides de décorateur par méthode.
 */
@ApiExcludeController()
@Controller('whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly whatsAppService: WhatsAppService,
    private readonly copilotService: CopilotService,
  ) {}

  @Public()
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string | undefined,
    @Query('hub.verify_token') token: string | undefined,
    @Query('hub.challenge') challenge: string | undefined,
    @Res() res: Response,
  ): void {
    const expectedToken = this.configService.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    if (expectedToken && mode === 'subscribe' && token === expectedToken) {
      res.status(200).send(challenge);
      return;
    }
    res.status(403).send();
  }

  @Public()
  @Post('webhook')
  receiveWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Res() res: Response,
  ): void {
    try {
      this.verifySignature(req.rawBody, signature);
    } catch (error) {
      this.logger.warn(`POST /webhook rejeté : ${(error as Error).message}`);
      res.status(403).send();
      return;
    }

    res.status(200).send();

    const payload = req.body as WhatsAppWebhookPayload;
    this.processInbound(payload).catch((error) => {
      this.logger.error(`Échec du traitement d'un message WhatsApp entrant : ${error.message}`, error.stack);
    });
  }

  private async processInbound(payload: WhatsAppWebhookPayload): Promise<void> {
    const organizationId = this.configService.get<string>('WHATSAPP_INBOUND_ORGANIZATION_ID');
    if (!organizationId) {
      this.logger.warn(
        "Message WhatsApp entrant ignoré : WHATSAPP_INBOUND_ORGANIZATION_ID n'est pas configuré.",
      );
      return;
    }

    const messages = (payload.entry ?? []).flatMap((entry) =>
      (entry.changes ?? []).flatMap((change) => change.value?.messages ?? []),
    );
    this.logger.log(`${messages.length} message(s) texte trouvé(s) dans le payload.`);

    for (const message of messages) {
      if (message.type !== 'text' || !message.text?.body) {
        continue;
      }

      const reply = await this.copilotService.chat(organizationId, [
        { role: 'user', content: message.text.body },
      ]);
      await this.whatsAppService.sendText(message.from, toWhatsAppText(reply));
    }
  }

  /** Lève une erreur (peu importe le type : le POST handler répond 403 dans tous les cas). */
  private verifySignature(rawBody: Buffer | undefined, signatureHeader: string | undefined): void {
    const appSecret = this.configService.get<string>('WHATSAPP_APP_SECRET');
    if (!appSecret) {
      throw new Error("WhatsApp n'est pas configuré sur ce serveur (WHATSAPP_APP_SECRET manquant).");
    }
    if (!rawBody || !signatureHeader) {
      throw new Error('Signature manquante.');
    }

    const expected = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(signatureHeader);

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new Error('Signature invalide.');
    }
  }
}
