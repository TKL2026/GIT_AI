import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CamPayService } from '../src/modules/campay/campay.service';
import { CopilotService } from '../src/modules/copilot/copilot.service';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Vérifie le quota de requêtes Copilot par plan (TRIAL 1500, Standard 500,
 * Pro 1500), sa remise à zéro au paiement, son isolation multi-tenant, et
 * qu'il ne peut pas être contourné depuis le frontend — sans jamais appeler
 * la vraie API Anthropic (CopilotService est remplacé par un double, comme
 * CamPayService l'est déjà pour les paiements dans billing.e2e-spec.ts).
 * Le quota est amené près de sa limite directement via Prisma plutôt que
 * par des centaines d'appels réels, pour un test rapide et déterministe.
 */
describe('Copilot quota (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let camPayService: { collect: jest.Mock; getTransactionStatus: jest.Mock; verifyWebhookSignature: jest.Mock };
  let copilotService: { chat: jest.Mock; generateDailyReport: jest.Mock };

  const createdOrgIds: string[] = [];

  beforeAll(async () => {
    camPayService = {
      collect: jest.fn(),
      getTransactionStatus: jest.fn(),
      verifyWebhookSignature: jest.fn().mockReturnValue(true),
    };
    copilotService = {
      chat: jest.fn().mockResolvedValue('Réponse factice du Copilote.'),
      generateDailyReport: jest.fn().mockResolvedValue('Rapport factice.'),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CamPayService)
      .useValue(camPayService)
      .overrideProvider(CopilotService)
      .useValue(copilotService)
      // Plusieurs inscriptions dans ce fichier dépasseraient la limite
      // @Throttle(5/min) de /auth/register — même pattern que entitlements.e2e-spec.ts.
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    for (const organizationId of createdOrgIds) {
      await prisma.paymentTransaction.deleteMany({ where: { organizationId } });
      await prisma.subscription.deleteMany({ where: { organizationId } });
      await prisma.user.deleteMany({ where: { organizationId } });
      await prisma.organization.deleteMany({ where: { id: organizationId } });
    }
    await app.close();
  });

  async function registerAndActivate(
    organizationName: string,
    planCode: 'standard' | 'pro',
  ): Promise<{ accessToken: string; organizationId: string }> {
    const email = `copilot-quota-${planCode}-${Date.now()}-${Math.random().toString(36).slice(2)}@demo.com`;
    const plan = await prisma.plan.findUniqueOrThrow({ where: { code: planCode } });

    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ organizationName, email, password: 'Password123!', firstName: 'Test', lastName: 'User', planCode })
      .expect(201);

    const accessToken = registerResponse.body.data.accessToken;
    const organizationId = registerResponse.body.data.user.organizationId;
    createdOrgIds.push(organizationId);

    const reference = `campay-ref-quota-${organizationId}`;
    camPayService.collect.mockResolvedValue({ reference, ussdCode: '*126#', operator: 'MTN' });

    const checkoutResponse = await request(app.getHttpServer())
      .post('/api/billing/checkout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ planId: plan.id, operator: 'MTN', phoneNumber: '670000009' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/payments/campay/webhook')
      .send({
        status: 'SUCCESSFUL',
        reference,
        amount: String(plan.price),
        currency: 'XAF',
        external_reference: checkoutResponse.body.data.externalReference,
        signature: 'signature-simulee-valide',
      })
      .expect(200);

    return { accessToken, organizationId };
  }

  function chat(accessToken: string, extra: Record<string, unknown> = {}) {
    return request(app.getHttpServer())
      .post('/api/copilot/chat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ messages: [{ role: 'user', content: 'Combien ai-je de produits ?' }], ...extra });
  }

  describe('Standard ACTIVE (quota 500)', () => {
    let accessToken: string;
    let organizationId: string;

    beforeAll(async () => {
      const result = await registerAndActivate('Copilot Quota Standard E2E', 'standard');
      accessToken = result.accessToken;
      organizationId = result.organizationId;
    });

    it('autorise une requête sous le quota', async () => {
      await chat(accessToken).expect(201);
      const subscription = await prisma.subscription.findUniqueOrThrow({ where: { organizationId } });
      expect(subscription.copilotRequestsUsed).toBe(1);
    });

    it('refuse (403, code COPILOT_QUOTA_EXCEEDED) la 501e requête, sans bloquer le reste de l’ERP', async () => {
      await prisma.subscription.update({ where: { organizationId }, data: { copilotRequestsUsed: 499 } });

      await chat(accessToken).expect(201); // 500e : encore autorisée
      const refused = await chat(accessToken).expect(403); // 501e : refusée
      expect(refused.body.code).toBe('COPILOT_QUOTA_EXCEEDED');

      // Le reste de l'ERP reste entièrement accessible malgré le quota Copilot atteint.
      await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it("ne peut pas être contourné en envoyant un quota/plan falsifié dans le corps de la requête", async () => {
      await prisma.subscription.update({ where: { organizationId }, data: { copilotRequestsUsed: 500 } });

      const response = await chat(accessToken, { quota: 999999, planCode: 'pro' }).expect(403);
      expect(response.body.code).toBe('COPILOT_QUOTA_EXCEEDED');
    });
  });

  describe('Pro ACTIVE (quota 1500)', () => {
    let accessToken: string;
    let organizationId: string;

    beforeAll(async () => {
      const result = await registerAndActivate('Copilot Quota Pro E2E', 'pro');
      accessToken = result.accessToken;
      organizationId = result.organizationId;
    });

    it('refuse (403) la 1501e requête', async () => {
      await prisma.subscription.update({ where: { organizationId }, data: { copilotRequestsUsed: 1499 } });

      await chat(accessToken).expect(201); // 1500e
      const refused = await chat(accessToken).expect(403); // 1501e
      expect(refused.body.code).toBe('COPILOT_QUOTA_EXCEEDED');
    });

    it('remet le quota à zéro lors d’un nouveau paiement (renouvellement)', async () => {
      await prisma.subscription.update({ where: { organizationId }, data: { copilotRequestsUsed: 1200 } });

      const plan = await prisma.plan.findUniqueOrThrow({ where: { code: 'pro' } });
      const reference = `campay-ref-renewal-${organizationId}`;
      camPayService.collect.mockResolvedValue({ reference, ussdCode: '*126#', operator: 'MTN' });

      const checkoutResponse = await request(app.getHttpServer())
        .post('/api/billing/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ planId: plan.id, operator: 'MTN', phoneNumber: '670000010' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/payments/campay/webhook')
        .send({
          status: 'SUCCESSFUL',
          reference,
          amount: String(plan.price),
          currency: 'XAF',
          external_reference: checkoutResponse.body.data.externalReference,
          signature: 'signature-simulee-valide',
        })
        .expect(200);

      const subscription = await prisma.subscription.findUniqueOrThrow({ where: { organizationId } });
      expect(subscription.copilotRequestsUsed).toBe(0);

      // Le quota redevient donc utilisable alors qu'il était épuisé juste avant.
      await chat(accessToken).expect(201);
    });
  });

  describe('Essai gratuit (TRIAL, quota 1500)', () => {
    it('refuse (403) la 1501e requête pendant l’essai', async () => {
      const email = `copilot-quota-trial-${Date.now()}@demo.com`;
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          organizationName: 'Copilot Quota Trial E2E',
          email,
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201);

      const accessToken = registerResponse.body.data.accessToken;
      const organizationId = registerResponse.body.data.user.organizationId;
      createdOrgIds.push(organizationId);

      await prisma.subscription.update({ where: { organizationId }, data: { copilotRequestsUsed: 1499 } });

      await chat(accessToken).expect(201); // 1500e
      const refused = await chat(accessToken).expect(403); // 1501e
      expect(refused.body.code).toBe('COPILOT_QUOTA_EXCEEDED');

      // Le reste de l'application (toutes fonctionnalités en TRIAL) reste accessible.
      await request(app.getHttpServer())
        .get('/api/forecast/replenishment')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe('Isolation multi-tenant du compteur', () => {
    it("consommer le quota d'une organisation n'affecte pas celui d'une autre", async () => {
      const orgA = await registerAndActivate('Copilot Quota Isolation A E2E', 'standard');
      const orgB = await registerAndActivate('Copilot Quota Isolation B E2E', 'standard');

      await chat(orgA.accessToken).expect(201);
      await chat(orgA.accessToken).expect(201);

      const subA = await prisma.subscription.findUniqueOrThrow({ where: { organizationId: orgA.organizationId } });
      const subB = await prisma.subscription.findUniqueOrThrow({ where: { organizationId: orgB.organizationId } });

      expect(subA.copilotRequestsUsed).toBe(2);
      expect(subB.copilotRequestsUsed).toBe(0);
    });
  });
});
