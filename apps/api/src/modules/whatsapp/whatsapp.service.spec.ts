import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppService } from './whatsapp.service';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'status',
    json: () => Promise.resolve(body),
  } as Response;
}

describe('WhatsAppService', () => {
  let configService: { get: jest.Mock };
  let service: WhatsAppService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    configService = { get: jest.fn() };
    service = new WhatsAppService(configService as unknown as ConfigService);
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  function configureCredentials() {
    configService.get.mockImplementation((key: string) => {
      if (key === 'WHATSAPP_ACCESS_TOKEN') return 'test-token';
      if (key === 'WHATSAPP_PHONE_NUMBER_ID') return '123456';
      return undefined;
    });
  }

  it("lève une ServiceUnavailableException si la configuration est absente", async () => {
    configService.get.mockReturnValue(undefined);

    await expect(service.sendText('+225000', 'bonjour')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('construit une requête bien formée pour un message texte', async () => {
    configureCredentials();
    fetchSpy.mockResolvedValue(jsonResponse(200, { messages: [{ id: 'wamid.123' }] }));

    const messageId = await service.sendText('+225000', 'bonjour');

    expect(messageId).toBe('wamid.123');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://graph.facebook.com/v22.0/123456/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    );
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toEqual({
      messaging_product: 'whatsapp',
      to: '+225000',
      type: 'text',
      text: { body: 'bonjour' },
    });
  });

  it('construit une requête bien formée pour un message template', async () => {
    configureCredentials();
    fetchSpy.mockResolvedValue(jsonResponse(200, { messages: [{ id: 'wamid.456' }] }));

    await service.sendTemplate('+225000', 'hello_world');

    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toEqual({
      messaging_product: 'whatsapp',
      to: '+225000',
      type: 'template',
      template: { name: 'hello_world', language: { code: 'en_US' } },
    });
  });

  it('traduit une erreur générique Meta en BadGatewayException lisible', async () => {
    configureCredentials();
    fetchSpy.mockResolvedValue(jsonResponse(400, { error: { message: 'Invalid parameter', code: 100 } }));

    await expect(service.sendText('+225000', 'bonjour')).rejects.toThrow(BadGatewayException);
    await expect(service.sendText('+225000', 'bonjour')).rejects.toThrow(/Invalid parameter/);
  });

  it('traduit spécifiquement l’erreur de fenêtre de 24h (131047)', async () => {
    configureCredentials();
    fetchSpy.mockResolvedValue(jsonResponse(400, { error: { message: 're-engagement', code: 131047 } }));

    await expect(service.sendText('+225000', 'bonjour')).rejects.toThrow(/24h/);
  });
});
