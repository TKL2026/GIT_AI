import { BadGatewayException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const GRAPH_API_VERSION = 'v22.0';
const REENGAGEMENT_WINDOW_ERROR_CODE = 131047;

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
}

interface GraphApiSuccessResponse {
  messages?: { id: string }[];
}

interface GraphApiErrorResponse {
  error?: { message: string; code: number };
}

@Injectable()
export class WhatsAppService {
  constructor(private readonly configService: ConfigService) {}

  async sendText(to: string, body: string): Promise<string> {
    return this.send(to, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    });
  }

  async sendTemplate(to: string, templateName: string, languageCode = 'en_US'): Promise<string> {
    return this.send(to, {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: { name: templateName, language: { code: languageCode } },
    });
  }

  private async send(to: string, payload: Record<string, unknown>): Promise<string> {
    const { accessToken, phoneNumberId } = this.getConfig();

    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    const json = (await response.json()) as GraphApiSuccessResponse & GraphApiErrorResponse;

    if (!response.ok) {
      if (json.error?.code === REENGAGEMENT_WINDOW_ERROR_CODE) {
        throw new BadGatewayException(
          "Ce destinataire n'a pas écrit sur WhatsApp depuis moins de 24h : un message libre ne peut pas être envoyé hors de cette fenêtre. Utilisez un message template approuvé, ou attendez qu'il vous écrive.",
        );
      }
      throw new BadGatewayException(
        `Échec de l'envoi WhatsApp : ${json.error?.message ?? response.statusText}`,
      );
    }

    const messageId = json.messages?.[0]?.id;
    if (!messageId) {
      throw new BadGatewayException("Réponse WhatsApp inattendue : identifiant de message manquant.");
    }
    return messageId;
  }

  private getConfig(): WhatsAppConfig {
    const accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    if (!accessToken || !phoneNumberId) {
      throw new ServiceUnavailableException(
        "WhatsApp n'est pas configuré sur ce serveur (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID manquants).",
      );
    }
    return { accessToken, phoneNumberId };
  }
}
