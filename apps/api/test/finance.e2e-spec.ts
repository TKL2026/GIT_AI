import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Finance (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let organizationId: string;
  const email = `finance-e2e-${Date.now()}@demo.com`;
  const cashierEmail = `finance-cashier-e2e-${Date.now()}@demo.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    const registerResponse = await request(app.getHttpServer()).post('/api/auth/register').send({
      organizationName: 'Boutique Finance E2E',
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
    await prisma.expense.deleteMany({ where: { organizationId } });
    await prisma.saleItem.deleteMany({ where: { sale: { organizationId } } });
    await prisma.sale.deleteMany({ where: { organizationId } });
    await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { organizationId } } });
    await prisma.purchaseOrder.deleteMany({ where: { organizationId } });
    await prisma.supplier.deleteMany({ where: { organizationId } });
    await prisma.product.deleteMany({ where: { organizationId } });
    await prisma.user.deleteMany({ where: { organizationId } });
    await prisma.organization.deleteMany({ where: { id: organizationId } });
    await app.close();
  });

  it('agrège ventes, dépenses et rentabilité produit correctement', async () => {
    const productResponse = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Riz 25kg',
        sku: `RIZ-FIN-${Date.now()}`,
        purchasePrice: 10000,
        salePrice: 15000,
        initialStock: 100,
      })
      .expect(201);
    const product = productResponse.body.data;

    await request(app.getHttpServer())
      .post('/api/sales')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        paymentMethod: 'CASH',
        items: [{ productId: product.id, quantity: 4 }],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/expenses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ category: 'RENT', amount: 20000, description: 'Loyer' })
      .expect(201);

    const summaryResponse = await request(app.getHttpServer())
      .get('/api/finance/summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(summaryResponse.body.data.totalRevenue).toBe(4 * 15000);
    expect(summaryResponse.body.data.totalExpenses).toBe(20000);
    expect(summaryResponse.body.data.totalCogs).toBe(4 * 10000);
    expect(summaryResponse.body.data.grossMargin).toBe(4 * 15000 - 4 * 10000);
    expect(summaryResponse.body.data.netProfit).toBe(4 * 15000 - 4 * 10000 - 20000);
    expect(summaryResponse.body.data.salesCount).toBe(1);

    const profitabilityResponse = await request(app.getHttpServer())
      .get('/api/finance/products-profitability')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const entry = profitabilityResponse.body.data.find(
      (p: { productId: string }) => p.productId === product.id,
    );
    expect(entry).toBeDefined();
    expect(entry.quantitySold).toBe(4);
    expect(entry.totalRevenue).toBe(4 * 15000);
    expect(entry.estimatedMargin).toBe(4 * 15000 - 4 * 10000);
  });

  it('BUG-006 : une nouvelle réception à un prix différent ne réécrit jamais le COGS d’une vente déjà conclue', async () => {
    const supplierResponse = await request(app.getHttpServer())
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Grossiste BUG-006' })
      .expect(201);
    const supplierId = supplierResponse.body.data.id;

    const productResponse = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Sucre 50kg',
        sku: `SUCRE-BUG006-${Date.now()}`,
        purchasePrice: 100,
        salePrice: 500,
        initialStock: 0,
      })
      .expect(201);
    const productId = productResponse.body.data.id;

    // 1) Achat au prix A (300) puis réception : 133 unités à 300.
    const orderAResponse = await request(app.getHttpServer())
      .post('/api/purchases')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ supplierId, items: [{ productId, quantity: 133, unitCost: 300 }] })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/purchases/${orderAResponse.body.data.id}/receive`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    // 2) Vente de 7 unités au coût A (300) : COGS attendu = 2100.
    const oldSaleResponse = await request(app.getHttpServer())
      .post('/api/sales')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ paymentMethod: 'CASH', items: [{ productId, quantity: 7 }] })
      .expect(201);
    const oldSaleItemId = oldSaleResponse.body.data.items[0].id;

    const oldUnitCost = await prisma.saleItem.findUniqueOrThrow({ where: { id: oldSaleItemId } });
    expect(Number(oldUnitCost.unitCost)).toBe(300);

    // 3) Nouvelle réception à prix B (280) : stock total 156 (133-7+30), Product.purchasePrice passe à 280.
    const orderBResponse = await request(app.getHttpServer())
      .post('/api/purchases')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ supplierId, items: [{ productId, quantity: 30, unitCost: 280 }] })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/purchases/${orderBResponse.body.data.id}/receive`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    const productAfterSecondReceive = await request(app.getHttpServer())
      .get(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(productAfterSecondReceive.body.data.stockQuantity).toBe(156);
    expect(productAfterSecondReceive.body.data.purchasePrice).toBe(280);

    // 4) L'ancienne vente ne doit pas avoir bougé (c'est précisément BUG-006).
    const oldSaleItemAfter = await prisma.saleItem.findUniqueOrThrow({
      where: { id: oldSaleItemId },
    });
    expect(Number(oldSaleItemAfter.unitCost)).toBe(300);

    // 5) Une nouvelle vente après la 2e réception utilise bien le nouveau coût (280).
    const newSaleResponse = await request(app.getHttpServer())
      .post('/api/sales')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ paymentMethod: 'CASH', items: [{ productId, quantity: 2 }] })
      .expect(201);
    const newSaleItem = await prisma.saleItem.findUniqueOrThrow({
      where: { id: newSaleResponse.body.data.items[0].id },
    });
    expect(Number(newSaleItem.unitCost)).toBe(280);

    // 6) Finance : le COGS total = 7*300 (ancienne vente, inchangée) + 2*280 (nouvelle vente).
    const profitabilityResponse = await request(app.getHttpServer())
      .get('/api/finance/products-profitability')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const entry = profitabilityResponse.body.data.find(
      (p: { productId: string }) => p.productId === productId,
    );
    expect(entry.estimatedCost).toBe(7 * 300 + 2 * 280);
  });

  it('refuse l’accès aux données financières pour un rôle CASHIER', async () => {
    const loginResponse = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: cashierEmail,
      password: 'Password123!',
    });
    const cashierToken = loginResponse.body.data.accessToken;

    await request(app.getHttpServer())
      .get('/api/finance/summary')
      .set('Authorization', `Bearer ${cashierToken}`)
      .expect(403);
  });
});
