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
