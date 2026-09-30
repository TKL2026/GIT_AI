import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { CamPayService } from './campay.service';

function buildService(values: Record<string, string>): CamPayService {
  const configService = { get: (key: string) => values[key] } as unknown as ConfigService;
  return new CamPayService(configService);
}

const SANDBOX_CONFIG = {
  CAMPAY_ENV: 'sandbox',
  CAMPAY_USERNAME: 'test-user',
  CAMPAY_PASSWORD: 'test-pass',
  CAMPAY_WEBHOOK_KEY: 'test-webhook-key',
};

describe('CamPayService', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('sans configuration', () => {
    it('lève une ServiceUnavailableException sur collect()', async () => {
      const service = buildService({});
      await expect(
        service.collect({ amount: 5000, currency: 'XAF', from: '237670000000', description: 'Test', externalReference: 'ref-1' }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('verifyWebhookSignature renvoie false plutôt que de lever une erreur', () => {
      const service = buildService({});
      expect(service.verifyWebhookSignature('anything')).toBe(false);
    });
  });

  describe('avec configuration', () => {
    it("récupère un token puis appelle /api/collect/ avec le bon corps et l'en-tête Token", async () => {
      fetchMock
        .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'abc', expires_in: 3600 }) })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reference: 'campay-ref-1', ussd_code: '*126#', operator: 'MTN' }),
        });

      const service = buildService(SANDBOX_CONFIG);
      const result = await service.collect({
        amount: 5000,
        currency: 'XAF',
        from: '237670000000',
        description: 'Abonnement',
        externalReference: 'ref-1',
      });

      expect(result).toEqual({ reference: 'campay-ref-1', ussdCode: '*126#', operator: 'MTN' });

      const [tokenCall, collectCall] = fetchMock.mock.calls;
      expect(tokenCall[0]).toBe('https://demo.campay.net/api/token/');
      expect(collectCall[0]).toBe('https://demo.campay.net/api/collect/');
      expect(collectCall[1].headers.Authorization).toBe('Token abc');
      expect(JSON.parse(collectCall[1].body)).toEqual({
        amount: 5000,
        currency: 'XAF',
        from: '237670000000',
        description: 'Abonnement',
        external_reference: 'ref-1',
      });
    });

    it('utilise la base URL de production quand CAMPAY_ENV=production', async () => {
      fetchMock
        .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'abc', expires_in: 3600 }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ reference: 'r', status: 'PENDING', amount: '5000', currency: 'XAF' }) });

      const service = buildService({ ...SANDBOX_CONFIG, CAMPAY_ENV: 'production' });
      await service.getTransactionStatus('r');

      expect(fetchMock.mock.calls[0][0]).toBe('https://www.campay.net/api/token/');
    });

    it('réutilise le token en cache pour un second appel', async () => {
      fetchMock
        .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'abc', expires_in: 3600 }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ reference: 'r1', ussd_code: null, operator: 'MTN' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ reference: 'r2', ussd_code: null, operator: 'MTN' }) });

      const service = buildService(SANDBOX_CONFIG);
      await service.collect({ amount: 100, currency: 'XAF', from: '237670000000', description: 'a', externalReference: 'a' });
      await service.collect({ amount: 100, currency: 'XAF', from: '237670000000', description: 'b', externalReference: 'b' });

      // 1 appel de token + 2 appels de collect = 3, pas 4 (pas de second appel de token)
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('lève une BadGatewayException si CamPay répond une erreur HTTP', async () => {
      fetchMock
        .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'abc', expires_in: 3600 }) })
        .mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ message: 'invalid' }) });

      const service = buildService(SANDBOX_CONFIG);
      await expect(
        service.collect({ amount: 100, currency: 'XAF', from: '237670000000', description: 'a', externalReference: 'a' }),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });

    it('utilise CAMPAY_PERMANENT_TOKEN directement, sans appeler /api/token/', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reference: 'campay-ref-2', ussd_code: null, operator: 'ORANGE' }),
      });

      const service = buildService({
        CAMPAY_ENV: 'sandbox',
        CAMPAY_PERMANENT_TOKEN: 'permanent-abc',
        CAMPAY_WEBHOOK_KEY: 'test-webhook-key',
      });
      const result = await service.collect({
        amount: 5000,
        currency: 'XAF',
        from: '237670000000',
        description: 'Abonnement',
        externalReference: 'ref-2',
      });

      expect(result).toEqual({ reference: 'campay-ref-2', ussdCode: null, operator: 'ORANGE' });
      // Un seul appel réseau (collect) : pas d'échange de token.
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toBe('https://demo.campay.net/api/collect/');
      expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Token permanent-abc');
    });

    it('préfère CAMPAY_PERMANENT_TOKEN si username/password sont aussi renseignés', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reference: 'r', ussd_code: null, operator: 'MTN' }),
      });

      const service = buildService({ ...SANDBOX_CONFIG, CAMPAY_PERMANENT_TOKEN: 'permanent-xyz' });
      await service.collect({ amount: 100, currency: 'XAF', from: '237670000000', description: 'a', externalReference: 'a' });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Token permanent-xyz');
    });

    it('getTransactionStatus renvoie le statut brut de CamPay', async () => {
      fetchMock
        .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'abc', expires_in: 3600 }) })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            reference: 'r1',
            status: 'SUCCESSFUL',
            amount: '5000',
            currency: 'XAF',
            operator: 'MTN',
            operator_reference: 'op-ref',
          }),
        });

      const service = buildService(SANDBOX_CONFIG);
      const result = await service.getTransactionStatus('r1');

      expect(result).toEqual({
        reference: 'r1',
        status: 'SUCCESSFUL',
        amount: '5000',
        currency: 'XAF',
        operator: 'MTN',
        operatorReference: 'op-ref',
      });
    });
  });

  describe('verifyWebhookSignature', () => {
    it('renvoie true pour un JWT signé avec la bonne clé webhook', () => {
      const service = buildService(SANDBOX_CONFIG);
      const signature = jwt.sign({ foo: 'bar' }, SANDBOX_CONFIG.CAMPAY_WEBHOOK_KEY);
      expect(service.verifyWebhookSignature(signature)).toBe(true);
    });

    it('renvoie false pour un JWT signé avec une mauvaise clé', () => {
      const service = buildService(SANDBOX_CONFIG);
      const signature = jwt.sign({ foo: 'bar' }, 'mauvaise-cle');
      expect(service.verifyWebhookSignature(signature)).toBe(false);
    });

    it('renvoie false si la signature est absente', () => {
      const service = buildService(SANDBOX_CONFIG);
      expect(service.verifyWebhookSignature(undefined)).toBe(false);
    });
  });
});
