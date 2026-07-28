import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { CopilotService } from '../copilot/copilot.service';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller';
import { WhatsAppWebhookPayload } from './whatsapp-webhook.types';
import { WhatsAppService } from './whatsapp.service';

const APP_SECRET = 'test-app-secret';
const VERIFY_TOKEN = 'test-verify-token';
const ORG_ID = 'org-123';

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

function mockResponse(): { res: Response; status: jest.Mock; send: jest.Mock } {
  const send = jest.fn();
  const status = jest.fn().mockReturnValue({ send });
  return { res: { status } as unknown as Response, status, send };
}

function signedRequest(payload: WhatsAppWebhookPayload): { req: Request & { rawBody?: Buffer }; signature: string } {
  const rawBody = Buffer.from(JSON.stringify(payload));
  const signature = `sha256=${createHmac('sha256', APP_SECRET).update(rawBody).digest('hex')}`;
  const req = { rawBody, body: payload } as unknown as Request & { rawBody?: Buffer };
  return { req, signature };
}

describe('WhatsAppWebhookController', () => {
  let configService: { get: jest.Mock };
  let whatsAppService: { sendText: jest.Mock };
  let copilotService: { chat: jest.Mock };
  let controller: WhatsAppWebhookController;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'WHATSAPP_APP_SECRET') return APP_SECRET;
        if (key === 'WHATSAPP_WEBHOOK_VERIFY_TOKEN') return VERIFY_TOKEN;
        if (key === 'WHATSAPP_INBOUND_ORGANIZATION_ID') return ORG_ID;
        return undefined;
      }),
    };
    whatsAppService = { sendText: jest.fn().mockResolvedValue('wamid.reply') };
    copilotService = { chat: jest.fn().mockResolvedValue('Voici la réponse du copilote.') };
    controller = new WhatsAppWebhookController(
      configService as unknown as ConfigService,
      whatsAppService as unknown as WhatsAppService,
      copilotService as unknown as CopilotService,
    );
  });

  describe('verifyWebhook (GET)', () => {
    it('répond avec le challenge quand le token et le mode sont corrects', () => {
      const { res, status, send } = mockResponse();
      controller.verifyWebhook('subscribe', VERIFY_TOKEN, 'challenge-abc', res);
      expect(status).toHaveBeenCalledWith(200);
      expect(send).toHaveBeenCalledWith('challenge-abc');
    });

    it('répond 403 si le token est incorrect', () => {
      const { res, status } = mockResponse();
      controller.verifyWebhook('subscribe', 'wrong-token', 'challenge-abc', res);
      expect(status).toHaveBeenCalledWith(403);
    });

    it('répond 403 si le mode est absent', () => {
      const { res, status } = mockResponse();
      controller.verifyWebhook(undefined, VERIFY_TOKEN, 'challenge-abc', res);
      expect(status).toHaveBeenCalledWith(403);
    });
  });

  describe('receiveWebhook (POST)', () => {
    const textPayload: WhatsAppWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'entry-1',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                messages: [
                  { from: '+225000000', id: 'wamid.in', timestamp: '1', type: 'text', text: { body: 'Bonjour' } },
                ],
              },
            },
          ],
        },
      ],
    };

    it('répond 403 sans traiter le message si la signature est absente', async () => {
      const { req } = signedRequest(textPayload);
      const { res, status } = mockResponse();

      controller.receiveWebhook(req, undefined, res);
      await flushMicrotasks();

      expect(status).toHaveBeenCalledWith(403);
      expect(copilotService.chat).not.toHaveBeenCalled();
    });

    it('répond 403 si la signature est invalide', async () => {
      const { req } = signedRequest(textPayload);
      const { res, status } = mockResponse();

      controller.receiveWebhook(req, 'sha256=invalide', res);
      await flushMicrotasks();

      expect(status).toHaveBeenCalledWith(403);
      expect(copilotService.chat).not.toHaveBeenCalled();
    });

    it('accuse réception (200) et route le message texte vers le copilote puis renvoie la réponse formatée', async () => {
      const { req, signature } = signedRequest(textPayload);
      const { res, status } = mockResponse();

      controller.receiveWebhook(req, signature, res);
      expect(status).toHaveBeenCalledWith(200);

      await flushMicrotasks();

      expect(copilotService.chat).toHaveBeenCalledWith(ORG_ID, [{ role: 'user', content: 'Bonjour' }]);
      expect(whatsAppService.sendText).toHaveBeenCalledWith('+225000000', 'Voici la réponse du copilote.');
    });

    it('ignore les messages non textuels sans appeler le copilote', async () => {
      const payload: WhatsAppWebhookPayload = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [{ from: '+225000000', id: 'wamid.img', timestamp: '1', type: 'image' }],
                },
              },
            ],
          },
        ],
      };
      const { req, signature } = signedRequest(payload);
      const { res } = mockResponse();

      controller.receiveWebhook(req, signature, res);
      await flushMicrotasks();

      expect(copilotService.chat).not.toHaveBeenCalled();
      expect(whatsAppService.sendText).not.toHaveBeenCalled();
    });

    it('ignore un payload de statut (accusé de livraison) sans erreur', async () => {
      const payload: WhatsAppWebhookPayload = {
        entry: [{ changes: [{ value: { statuses: [{ status: 'delivered' }] } }] }],
      };
      const { req, signature } = signedRequest(payload);
      const { res, status } = mockResponse();

      controller.receiveWebhook(req, signature, res);
      await flushMicrotasks();

      expect(status).toHaveBeenCalledWith(200);
      expect(copilotService.chat).not.toHaveBeenCalled();
    });
  });
});
