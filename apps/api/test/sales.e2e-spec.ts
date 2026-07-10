import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Sales (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  const email = `sales-e2e-${Date.now()}@demo.com`;

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
      organizationName: 'Boutique Sales E2E',
      email,
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    });

    accessToken = registerResponse.body.data.accessToken;
  });

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.saleItem.deleteMany({
        where: { sale: { organizationId: user.organizationId } },
      });
      await prisma.sale.deleteMany({ where: { organizationId: user.organizationId } });
      await prisma.stockMovement.deleteMany({ where: { organizationId: user.organizationId } });
      await prisma.product.deleteMany({ where: { organizationId: user.organizationId } });
      await prisma.user.deleteMany({ where: { email } });
      await prisma.organization.deleteMany({ where: { id: user.organizationId } });
    }
    await app.close();
  });

  async function createProduct(name: string, salePrice: number, initialStock: number) {
    const response = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name,
        sku: `${name.replace(/\s+/g, '-').toUpperCase()}-${Date.now()}-${Math.random()}`,
        purchasePrice: Math.max(1, Math.round(salePrice * 0.7)),
        salePrice,
        initialStock,
      })
      .expect(201);
    return response.body.data;
  }

  it('vente multi-lignes décrémente le stock et calcule le total', async () => {
    const productA = await createProduct('Riz 25kg', 15000, 10);
    const productB = await createProduct('Huile 5L', 8000, 10);

    const saleResponse = await request(app.getHttpServer())
      .post('/api/sales')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        customerName: 'Awa Diallo',
        paymentMethod: 'CASH',
        items: [
          { productId: productA.id, quantity: 2 },
          { productId: productB.id, quantity: 3 },
        ],
      })
      .expect(201);

    expect(saleResponse.body.data.totalAmount).toBe(2 * 15000 + 3 * 8000);
    expect(saleResponse.body.data.items).toHaveLength(2);
    const saleId = saleResponse.body.data.id;

    const productAAfter = await request(app.getHttpServer())
      .get(`/api/products/${productA.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(productAAfter.body.data.stockQuantity).toBe(8);

    const productBAfter = await request(app.getHttpServer())
      .get(`/api/products/${productB.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(productBAfter.body.data.stockQuantity).toBe(7);

    const ticketResponse = await request(app.getHttpServer())
      .get(`/api/sales/${saleId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(ticketResponse.body.data.customerName).toBe('Awa Diallo');
    expect(ticketResponse.body.data.items).toHaveLength(2);
  });

  it('rejette une vente dépassant le stock disponible et ne modifie rien (atomicité)', async () => {
    const product = await createProduct('Savon', 1000, 5);

    await request(app.getHttpServer())
      .post('/api/sales')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        paymentMethod: 'CASH',
        items: [{ productId: product.id, quantity: 999 }],
      })
      .expect(400);

    const productAfter = await request(app.getHttpServer())
      .get(`/api/products/${product.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(productAfter.body.data.stockQuantity).toBe(5);
  });

  it('annule toute la vente si une seule ligne parmi plusieurs manque de stock', async () => {
    const productOk = await createProduct('Sucre', 2000, 10);
    const productShort = await createProduct('Farine', 3000, 1);

    await request(app.getHttpServer())
      .post('/api/sales')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        paymentMethod: 'MOBILE_MONEY',
        items: [
          { productId: productOk.id, quantity: 2 },
          { productId: productShort.id, quantity: 999 },
        ],
      })
      .expect(400);

    const productOkAfter = await request(app.getHttpServer())
      .get(`/api/products/${productOk.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(productOkAfter.body.data.stockQuantity).toBe(10);
  });
});
