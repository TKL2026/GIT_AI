import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CamPayService } from '../src/modules/campay/campay.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Billing (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let camPayService: { collect: jest.Mock; getTransactionStatus: jest.Mock; verifyWebhookSignature: jest.Mock };
  let accessToken: string;
  let organizationId: string;
  let planId: string;
  const email = `billing-e2e-${Date.now()}@demo.com`;
  const cashierEmail = `billing-cashier-e2e-${Date.now()}@demo.com`;

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
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    const plan = await prisma.plan.findUniqueOrThrow({ where: { code: 'standard' } });
    planId = plan.id;

    const registerResponse = await request(app.getHttpServer()).post('/api/auth/register').send({
      organizationName: 'Boutique Billing E2E',
      email,
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    });

    accessToken = registerResponse.body.data.accessToken;
    organizationId = registerResponse.body.data.user.organizationId;

    await prisma.user.create({
      data: {
        email: cashierEmail,
        passwordHash: await bcrypt.hash('Password123!', 10),
        firstName: 'Cash',
        lastName: 'Ier',
        role: Role.CASHIER,
        organizationId,
      },
    });
  });

  afterAll(async () => {
    await prisma.paymentTransaction.deleteMany({ where: { organizationId } });
    await prisma.subscription.deleteMany({ where: { organizationId } });
    await prisma.user.deleteMany({ where: { organizationId } });
    await prisma.organization.deleteMany({ where: { id: organizationId } });
    await app.close();
  });

  it('liste les plans publiquement, sans authentification', async () => {
    const response = await request(app.getHttpServer()).get('/api/billing/plans').expect(200);
    const codes = response.body.data.map((p: { code: string }) => p.code);
    expect(codes).toEqual(expect.arrayContaining(['standard', 'pro']));
  });

  it('refuse le checkout à un rôle CASHIER', async () => {
    const loginResponse = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: cashierEmail,
      password: 'Password123!',
    });
    const cashierToken = loginResponse.body.data.accessToken;

    await request(app.getHttpServer())
      .post('/api/billing/checkout')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({ planId, operator: 'MTN', phoneNumber: '670000000' })
      .expect(403);
  });

  it('parcours complet : checkout -> webhook -> abonnement actif, avec idempotence sur webhook dupliqué', async () => {
    camPayService.collect.mockResolvedValue({ reference: 'campay-ref-e2e', ussdCode: '*126#', operator: 'MTN' });

    const checkoutResponse = await request(app.getHttpServer())
      .post('/api/billing/checkout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ planId, operator: 'MTN', phoneNumber: '670000000' })
      .expect(201);

    const { externalReference } = checkoutResponse.body.data;
    expect(checkoutResponse.body.data.status).toBe('PENDING');

    // Le montant/devise envoyés au webhook correspondent au VRAI prix du plan (10000 XAF, seedé).
    const webhookPayload = {
      status: 'SUCCESSFUL',
      reference: 'campay-ref-e2e',
      amount: '10000',
      currency: 'XAF',
      external_reference: externalReference,
      signature: 'signature-simulee-valide',
    };

    await request(app.getHttpServer()).post('/api/payments/campay/webhook').send(webhookPayload).expect(200);

    const subscriptionResponse = await request(app.getHttpServer())
      .get('/api/billing/subscription')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(subscriptionResponse.body.data.status).toBe('ACTIVE');
    expect(subscriptionResponse.body.data.plan.code).toBe('standard');
    const firstPeriodEnd = subscriptionResponse.body.data.currentPeriodEnd;

    const transactionResponse = await request(app.getHttpServer())
      .get(`/api/billing/transactions/${externalReference}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(transactionResponse.body.data.status).toBe('SUCCESS');

    // Webhook dupliqué (CamPay peut renvoyer le même événement) : aucune double activation.
    await request(app.getHttpServer()).post('/api/payments/campay/webhook').send(webhookPayload).expect(200);

    const subscriptionAfterDuplicate = await request(app.getHttpServer())
      .get('/api/billing/subscription')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(subscriptionAfterDuplicate.body.data.currentPeriodEnd).toBe(firstPeriodEnd);

    const historyResponse = await request(app.getHttpServer())
      .get('/api/billing/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(historyResponse.body.data).toHaveLength(1);
  });

  it('rejette le webhook avec une signature invalide', async () => {
    camPayService.verifyWebhookSignature.mockReturnValueOnce(false);

    await request(app.getHttpServer())
      .post('/api/payments/campay/webhook')
      .send({
        status: 'SUCCESSFUL',
        reference: 'r',
        amount: '10000',
        currency: 'XAF',
        external_reference: 'ref-inexistant',
        signature: 'invalide',
      })
      .expect(403);
  });

  it('accepte le webhook livré en GET avec les champs en query string (format réel constaté côté CamPay)', async () => {
    camPayService.collect.mockResolvedValue({ reference: 'campay-ref-get-e2e', ussdCode: '*126#', operator: 'MTN' });

    const checkoutResponse = await request(app.getHttpServer())
      .post('/api/billing/checkout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ planId, operator: 'MTN', phoneNumber: '670000001' })
      .expect(201);
    const { externalReference } = checkoutResponse.body.data;

    await request(app.getHttpServer())
      .get('/api/payments/campay/webhook')
      .query({
        status: 'SUCCESSFUL',
        reference: 'campay-ref-get-e2e',
        amount: '10000',
        currency: 'XAF',
        external_reference: externalReference,
        signature: 'signature-simulee-valide',
      })
      .expect(200);

    const transactionResponse = await request(app.getHttpServer())
      .get(`/api/billing/transactions/${externalReference}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(transactionResponse.body.data.status).toBe('SUCCESS');
  });

  it('rejette (GET) un webhook avec une signature invalide, comme en POST', async () => {
    camPayService.verifyWebhookSignature.mockReturnValueOnce(false);

    await request(app.getHttpServer())
      .get('/api/payments/campay/webhook')
      .query({
        status: 'SUCCESSFUL',
        reference: 'r',
        amount: '10000',
        currency: 'XAF',
        external_reference: 'ref-inexistant',
        signature: 'invalide',
      })
      .expect(403);
  });

  it('isolation multi-tenant : une organisation ne peut pas consulter la transaction d’une autre', async () => {
    const otherRegisterResponse = await request(app.getHttpServer()).post('/api/auth/register').send({
      organizationName: 'Autre Boutique E2E',
      email: `billing-other-e2e-${Date.now()}@demo.com`,
      password: 'Password123!',
      firstName: 'Autre',
      lastName: 'User',
    });
    const otherToken = otherRegisterResponse.body.data.accessToken;
    const otherOrgId = otherRegisterResponse.body.data.user.organizationId;

    camPayService.collect.mockResolvedValue({ reference: 'campay-ref-isolation', ussdCode: null, operator: 'MTN' });
    const checkoutResponse = await request(app.getHttpServer())
      .post('/api/billing/checkout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ planId, operator: 'MTN', phoneNumber: '671111111' })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/billing/transactions/${checkoutResponse.body.data.externalReference}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);

    await prisma.user.deleteMany({ where: { organizationId: otherOrgId } });
    await prisma.organization.deleteMany({ where: { id: otherOrgId } });
  });

  describe('Offre payante choisie à l’inscription (AWAITING_PAYMENT, sans essai de 48h)', () => {
    let awaitingToken: string;
    let awaitingOrgId: string;
    const awaitingEmail = `billing-awaiting-e2e-${Date.now()}@demo.com`;

    afterAll(async () => {
      await prisma.paymentTransaction.deleteMany({ where: { organizationId: awaitingOrgId } });
      await prisma.subscription.deleteMany({ where: { organizationId: awaitingOrgId } });
      await prisma.user.deleteMany({ where: { organizationId: awaitingOrgId } });
      await prisma.organization.deleteMany({ where: { id: awaitingOrgId } });
    });

    it("l'inscription avec planCode='pro' échoue proprement si le code ne correspond à aucune offre active", async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          organizationName: 'Offre Invalide E2E',
          email: `billing-invalid-plan-e2e-${Date.now()}@demo.com`,
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          planCode: 'code-qui-nexiste-pas',
        })
        .expect(404);
    });

    it("inscription avec planCode='pro' : crée directement une Subscription AWAITING_PAYMENT, sans essai", async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          organizationName: 'Boutique Awaiting Payment E2E',
          email: awaitingEmail,
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          planCode: 'pro',
        })
        .expect(201);

      awaitingToken = registerResponse.body.data.accessToken;
      awaitingOrgId = registerResponse.body.data.user.organizationId;

      const subscriptionResponse = await request(app.getHttpServer())
        .get('/api/billing/subscription')
        .set('Authorization', `Bearer ${awaitingToken}`)
        .expect(200);
      expect(subscriptionResponse.body.data.status).toBe('AWAITING_PAYMENT');
      expect(subscriptionResponse.body.data.plan.code).toBe('pro');
      expect(subscriptionResponse.body.data.currentPeriodEnd).toBeNull();
    });

    it('AWAITING_PAYMENT : le Dashboard (routes protégées) est inaccessible (403 SUBSCRIPTION_EXPIRED)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${awaitingToken}`)
        .expect(403);
      expect(response.body.code ?? response.body.message).toBeTruthy();
    });

    it('AWAITING_PAYMENT : le checkout reste accessible pour payer (non bloqué par le verrou)', async () => {
      camPayService.collect.mockResolvedValue({ reference: 'campay-ref-awaiting', ussdCode: '*126#', operator: 'MTN' });
      const proPlan = await prisma.plan.findUniqueOrThrow({ where: { code: 'pro' } });

      await request(app.getHttpServer())
        .post('/api/billing/checkout')
        .set('Authorization', `Bearer ${awaitingToken}`)
        .send({ planId: proPlan.id, operator: 'MTN', phoneNumber: '672222222' })
        .expect(201);
    });

    it('abandon du paiement (aucun webhook reçu) : reste AWAITING_PAYMENT, ne retombe jamais sur TRIAL', async () => {
      const subscriptionResponse = await request(app.getHttpServer())
        .get('/api/billing/subscription')
        .set('Authorization', `Bearer ${awaitingToken}`)
        .expect(200);
      expect(subscriptionResponse.body.data.status).toBe('AWAITING_PAYMENT');
    });

    it('paiement confirmé (webhook valide) : bascule en ACTIVE et le Dashboard redevient accessible', async () => {
      const transactionsResponse = await request(app.getHttpServer())
        .get('/api/billing/transactions')
        .set('Authorization', `Bearer ${awaitingToken}`)
        .expect(200);
      const pending = transactionsResponse.body.data.find((t: { status: string }) => t.status === 'PENDING');
      expect(pending).toBeTruthy();

      await request(app.getHttpServer())
        .post('/api/payments/campay/webhook')
        .send({
          status: 'SUCCESSFUL',
          reference: 'campay-ref-awaiting',
          amount: '20000',
          currency: 'XAF',
          external_reference: pending.externalReference,
          signature: 'signature-simulee-valide',
        })
        .expect(200);

      const subscriptionResponse = await request(app.getHttpServer())
        .get('/api/billing/subscription')
        .set('Authorization', `Bearer ${awaitingToken}`)
        .expect(200);
      expect(subscriptionResponse.body.data.status).toBe('ACTIVE');

      await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${awaitingToken}`)
        .expect(200);
    });
  });
});
