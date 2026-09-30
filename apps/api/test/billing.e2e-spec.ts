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

    const plan = await prisma.plan.findUniqueOrThrow({ where: { code: 'starter' } });
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
    expect(codes).toEqual(expect.arrayContaining(['starter', 'business', 'pro']));
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

    // Le montant/devise envoyés au webhook correspondent au VRAI prix du plan (5000 XAF, seedé).
    const webhookPayload = {
      status: 'SUCCESSFUL',
      reference: 'campay-ref-e2e',
      amount: '5000',
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
    expect(subscriptionResponse.body.data.plan.code).toBe('starter');
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
        amount: '5000',
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
});
