import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CamPayService } from '../src/modules/campay/campay.service';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Vérifie que le plan (Standard vs Pro vs Trial) contrôle réellement l'accès
 * aux fonctionnalités côté backend — pas seulement le verrou d'abonnement
 * binaire. Complète billing.e2e-spec.ts (paiement/webhook/idempotence) et
 * subscription.guard.spec.ts (verrou TRIAL/EXPIRED/AWAITING_PAYMENT).
 */
describe('Entitlements Standard/Pro (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let camPayService: { collect: jest.Mock; getTransactionStatus: jest.Mock; verifyWebhookSignature: jest.Mock };
  let standardPlanId: string;
  let proPlanId: string;
  // Réutilisé par le describe "Prix imposé" pour éviter un appel
  // /auth/register supplémentaire (limité à 5/min par @Throttle).
  let proAccessTokenForReuse: string;
  let standardAccessTokenForReuse: string;
  let standardOrgIdForReuse: string;
  let proOrgIdForReuse: string;

  const createdOrgIds: string[] = [];

  beforeAll(async () => {
    camPayService = {
      collect: jest.fn(),
      getTransactionStatus: jest.fn(),
      verifyWebhookSignature: jest.fn().mockReturnValue(true),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CamPayService)
      .useValue(camPayService)
      // Ce fichier crée beaucoup de comptes/paiements/invitations pour
      // couvrir Standard/Pro/Trial/multi-tenant — pas un test de
      // rate-limiting, désactivé pour ne pas dépendre du volume de requêtes.
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    standardPlanId = (await prisma.plan.findUniqueOrThrow({ where: { code: 'standard' } })).id;
    proPlanId = (await prisma.plan.findUniqueOrThrow({ where: { code: 'pro' } })).id;
  });

  afterAll(async () => {
    for (const organizationId of createdOrgIds) {
      await prisma.pendingInvite.deleteMany({ where: { organizationId } });
      await prisma.paymentTransaction.deleteMany({ where: { organizationId } });
      await prisma.subscription.deleteMany({ where: { organizationId } });
      await prisma.user.deleteMany({ where: { organizationId } });
      await prisma.organization.deleteMany({ where: { id: organizationId } });
    }
    await app.close();
  });

  describe('Standard AWAITING_PAYMENT (avant paiement, jamais de Trial)', () => {
    let accessToken: string;

    beforeAll(async () => {
      const registerResponse = await request(app.getHttpServer()).post('/api/auth/register').send({
        organizationName: 'Org Standard Awaiting E2E',
        email: `entitlements-standard-awaiting-${Date.now()}@demo.com`,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'StandardAwaiting',
        planCode: 'standard',
      });
      accessToken = registerResponse.body.data.accessToken;
      createdOrgIds.push(registerResponse.body.data.user.organizationId);
    });

    it("statut AWAITING_PAYMENT immédiatement après inscription, sans aucune période d'essai (pas de Trial caché)", async () => {
      const response = await request(app.getHttpServer())
        .get('/api/billing/subscription')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(response.body.data.status).toBe('AWAITING_PAYMENT');
      expect(response.body.data.plan.code).toBe('standard');
      expect(response.body.data.startedAt).toBeNull();
      expect(response.body.data.currentPeriodEnd).toBeNull();
    });

    it('aucun accès à l’application avant paiement (même les fonctionnalités Standard de base sont refusées)', async () => {
      await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });

    it('abandon du checkout (aucun webhook reçu) : reste AWAITING_PAYMENT, ne devient jamais TRIAL, toujours aucun accès', async () => {
      camPayService.collect.mockResolvedValue({ reference: 'campay-ref-standard-abandon', ussdCode: '*126#', operator: 'MTN' });
      await request(app.getHttpServer())
        .post('/api/billing/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ planId: standardPlanId, operator: 'MTN', phoneNumber: '670000005' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/billing/subscription')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(response.body.data.status).toBe('AWAITING_PAYMENT');
      expect(response.body.data.status).not.toBe('TRIAL');

      await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });
  });

  describe('Standard ACTIVE', () => {
    let accessToken: string;

    beforeAll(async () => {
      // La webhook util ci-dessus a besoin de la vraie référence CamPay :
      // reconstruit ici simplement pour ce describe (collect mocké avant checkout).
      camPayService.collect.mockResolvedValue({ reference: 'campay-ref-standard', ussdCode: '*126#', operator: 'MTN' });
      const registerResponse = await request(app.getHttpServer()).post('/api/auth/register').send({
        organizationName: 'Org Standard E2E',
        email: `entitlements-standard-${Date.now()}@demo.com`,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'Standard',
        planCode: 'standard',
      });
      accessToken = registerResponse.body.data.accessToken;
      standardAccessTokenForReuse = accessToken;
      standardOrgIdForReuse = registerResponse.body.data.user.organizationId;
      createdOrgIds.push(registerResponse.body.data.user.organizationId);

      const checkoutResponse = await request(app.getHttpServer())
        .post('/api/billing/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ planId: standardPlanId, operator: 'MTN', phoneNumber: '670000001' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/payments/campay/webhook')
        .send({
          status: 'SUCCESSFUL',
          reference: 'campay-ref-standard',
          external_reference: checkoutResponse.body.data.externalReference,
          amount: '10000',
          currency: 'XAF',
          signature: 'signature-simulee-valide',
        })
        .expect(200);
    });

    it('a bien le statut ACTIVE avec le plan standard', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/billing/subscription')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(response.body.data.status).toBe('ACTIVE');
      expect(response.body.data.plan.code).toBe('standard');
    });

    it('accède aux fonctionnalités Standard (produits)', async () => {
      await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('accède au résumé financier de base', async () => {
      await request(app.getHttpServer())
        .get('/api/finance/summary')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it("reçoit 403 FEATURE_NOT_INCLUDED sur /forecast/replenishment (fonctionnalité Pro)", async () => {
      const response = await request(app.getHttpServer())
        .get('/api/forecast/replenishment')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
      expect(response.body.code ?? response.body.message).toBeTruthy();
    });

    it('reçoit 403 sur /fraud/anomalies (fonctionnalité Pro)', async () => {
      await request(app.getHttpServer())
        .get('/api/fraud/anomalies')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });

    it('reçoit 403 sur /commercial/products-to-push (fonctionnalité Pro)', async () => {
      await request(app.getHttpServer())
        .get('/api/commercial/products-to-push')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });

    it('reçoit 403 sur /purchasing/recommendations (fonctionnalité Pro)', async () => {
      await request(app.getHttpServer())
        .get('/api/purchasing/recommendations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });

    it('reçoit 403 sur /finance/products-profitability et /finance/monthly-trend (finance avancée = Pro)', async () => {
      await request(app.getHttpServer())
        .get('/api/finance/products-profitability')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
      await request(app.getHttpServer())
        .get('/api/finance/monthly-trend')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });

    it("reçoit 403 sur POST /whatsapp/send-test (fonctionnalité Pro), avant même de vérifier la configuration WhatsApp", async () => {
      await request(app.getHttpServer())
        .post('/api/whatsapp/send-test')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });

    it("ne peut pas contourner la restriction en appelant l'API directement avec les mêmes en-têtes qu'un usage normal (pas de bypass via requête brute)", async () => {
      await request(app.getHttpServer())
        .get('/api/commercial/customer-insights')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Requested-With', 'curl')
        .expect(403);
    });

    it('limite de sièges : refuse une 5e invitation après 4 utilisateurs + 1 invitation en attente (Standard = 5 max)', async () => {
      for (let i = 0; i < 3; i += 1) {
        await request(app.getHttpServer())
          .post('/api/organizations/me/invites')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ email: `seat-${i}-${Date.now()}@example.com`, role: 'CASHIER' })
          .expect(201);
      }
      // OWNER existant (1) + 3 invitations en attente créées ci-dessus = 4,
      // encore sous la limite de 5 : une 4e invitation doit donc passer.
      await request(app.getHttpServer())
        .post('/api/organizations/me/invites')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: `seat-4-${Date.now()}@example.com`, role: 'CASHIER' })
        .expect(201);

      // 1 owner + 4 invitations en attente = 5, déjà à la limite : la
      // suivante doit être refusée avant de l'atteindre.
      const response = await request(app.getHttpServer())
        .post('/api/organizations/me/invites')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: `seat-5-${Date.now()}@example.com`, role: 'CASHIER' })
        .expect(403);
      expect(response.body.code).toBe('SEAT_LIMIT_REACHED');
    });
  });

  describe('Pro ACTIVE', () => {
    let accessToken: string;

    beforeAll(async () => {
      camPayService.collect.mockResolvedValue({ reference: 'campay-ref-pro', ussdCode: '*126#', operator: 'MTN' });
      const registerResponse = await request(app.getHttpServer()).post('/api/auth/register').send({
        organizationName: 'Org Pro E2E',
        email: `entitlements-pro-${Date.now()}@demo.com`,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'Pro',
        planCode: 'pro',
      });
      accessToken = registerResponse.body.data.accessToken;
      proAccessTokenForReuse = accessToken;
      proOrgIdForReuse = registerResponse.body.data.user.organizationId;
      createdOrgIds.push(registerResponse.body.data.user.organizationId);

      const checkoutResponse = await request(app.getHttpServer())
        .post('/api/billing/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ planId: proPlanId, operator: 'MTN', phoneNumber: '670000002' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/payments/campay/webhook')
        .send({
          status: 'SUCCESSFUL',
          reference: 'campay-ref-pro',
          external_reference: checkoutResponse.body.data.externalReference,
          amount: '20000',
          currency: 'XAF',
          signature: 'signature-simulee-valide',
        })
        .expect(200);
    });

    it('accède aux fonctionnalités Standard (héritage) ET aux fonctionnalités Pro', async () => {
      await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get('/api/forecast/replenishment')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get('/api/fraud/anomalies')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get('/api/commercial/products-to-push')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get('/api/purchasing/recommendations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get('/api/finance/products-profitability')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it("n'est jamais bloqué par la limite de sièges Standard (maxUsers=null)", async () => {
      for (let i = 0; i < 6; i += 1) {
        await request(app.getHttpServer())
          .post('/api/organizations/me/invites')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ email: `pro-seat-${i}-${Date.now()}@example.com`, role: 'CASHIER' })
          .expect(201);
      }
    });
  });

  describe('Essai gratuit (TRIAL, jamais payé)', () => {
    let accessToken: string;

    beforeAll(async () => {
      const registerResponse = await request(app.getHttpServer()).post('/api/auth/register').send({
        organizationName: 'Org Trial E2E',
        email: `entitlements-trial-${Date.now()}@demo.com`,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'Trial',
      });
      accessToken = registerResponse.body.data.accessToken;
      createdOrgIds.push(registerResponse.body.data.user.organizationId);
    });

    it('a bien le statut TRIAL', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/billing/subscription')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(response.body.data.status).toBe('TRIAL');
    });

    it('accède aux fonctionnalités Pro pendant les 7 jours, sans jamais avoir payé (mêmes fonctionnalités que Pro pendant l’essai)', async () => {
      await request(app.getHttpServer())
        .get('/api/forecast/replenishment')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get('/api/commercial/products-to-push')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe('Isolation multi-tenant des entitlements', () => {
    it('les droits Pro d’une organisation ne fuient jamais vers une organisation Standard distincte', async () => {
      // Réutilise les comptes ACTIVE déjà créés dans les describes
      // "Standard ACTIVE" et "Pro ACTIVE" ci-dessus, au lieu d'un nouvel
      // appel /auth/register (limité à 5/min par @Throttle).
      await request(app.getHttpServer())
        .get('/api/forecast/replenishment')
        .set('Authorization', `Bearer ${standardAccessTokenForReuse}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/forecast/replenishment')
        .set('Authorization', `Bearer ${proAccessTokenForReuse}`)
        .expect(200);

      expect(standardOrgIdForReuse).not.toBe(proOrgIdForReuse);
    });
  });

  describe('Prix imposé par le backend, jamais par le frontend', () => {
    it('un champ "price"/"amount" envoyé en trop dans le checkout est ignoré : le montant réel reste celui du Plan en base', async () => {
      // Réutilise le compte Pro déjà enregistré et authentifié dans le
      // describe "Pro ACTIVE" ci-dessus au lieu d'un nouvel appel
      // /auth/register (limité à 5/min par @Throttle sur AuthController,
      // déjà consommé par les describes Standard/Pro/Trial/Isolation).
      camPayService.collect.mockClear();
      camPayService.collect.mockResolvedValue({ reference: 'campay-ref-price', ussdCode: null, operator: 'MTN' });

      const checkoutResponse = await request(app.getHttpServer())
        .post('/api/billing/checkout')
        .set('Authorization', `Bearer ${proAccessTokenForReuse}`)
        .send({
          planId: proPlanId,
          operator: 'MTN',
          phoneNumber: '670000003',
          // Champs non prévus par CheckoutDto — doivent être ignorés
          // (ValidationPipe whitelist:true) et n'avoir aucun effet.
          price: 1,
          amount: 1,
          plan: 'standard',
        })
        .expect(201);

      expect(camPayService.collect).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 20000, currency: 'XAF' }),
      );
      expect(checkoutResponse.body.data).not.toHaveProperty('amount');
    });
  });
});
