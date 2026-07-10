import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Purchases (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  const email = `purchases-e2e-${Date.now()}@demo.com`;

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
      organizationName: 'Boutique Purchases E2E',
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
      await prisma.purchaseOrderItem.deleteMany({
        where: { purchaseOrder: { organizationId: user.organizationId } },
      });
      await prisma.purchaseOrder.deleteMany({ where: { organizationId: user.organizationId } });
      await prisma.stockMovement.deleteMany({ where: { organizationId: user.organizationId } });
      await prisma.product.deleteMany({ where: { organizationId: user.organizationId } });
      await prisma.supplier.deleteMany({ where: { organizationId: user.organizationId } });
      await prisma.user.deleteMany({ where: { email } });
      await prisma.organization.deleteMany({ where: { id: user.organizationId } });
    }
    await app.close();
  });

  async function createSupplier(name: string) {
    const response = await request(app.getHttpServer())
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name })
      .expect(201);
    return response.body.data;
  }

  async function createProduct(name: string, purchasePrice: number, salePrice: number) {
    const response = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name,
        sku: `${name.replace(/\s+/g, '-').toUpperCase()}-${Date.now()}-${Math.random()}`,
        purchasePrice,
        salePrice,
        initialStock: 0,
      })
      .expect(201);
    return response.body.data;
  }

  it('commande -> réception incrémente le stock et met à jour purchasePrice', async () => {
    const supplier = await createSupplier('Grossiste Alpha');
    const product = await createProduct('Riz 25kg', 10000, 15000);

    const orderResponse = await request(app.getHttpServer())
      .post('/api/purchases')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        supplierId: supplier.id,
        items: [{ productId: product.id, quantity: 50, unitCost: 11000 }],
      })
      .expect(201);

    expect(orderResponse.body.data.status).toBe('PENDING');
    expect(orderResponse.body.data.totalAmount).toBe(50 * 11000);
    const orderId = orderResponse.body.data.id;

    const productBeforeReceive = await request(app.getHttpServer())
      .get(`/api/products/${product.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(productBeforeReceive.body.data.stockQuantity).toBe(0);

    const receiveResponse = await request(app.getHttpServer())
      .post(`/api/purchases/${orderId}/receive`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);
    expect(receiveResponse.body.data.status).toBe('RECEIVED');

    const productAfterReceive = await request(app.getHttpServer())
      .get(`/api/products/${product.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(productAfterReceive.body.data.stockQuantity).toBe(50);
    expect(productAfterReceive.body.data.purchasePrice).toBe(11000);

    await request(app.getHttpServer())
      .post(`/api/purchases/${orderId}/receive`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
  });

  it('annule une commande en attente sans toucher au stock', async () => {
    const supplier = await createSupplier('Grossiste Beta');
    const product = await createProduct('Huile 5L', 6000, 8000);

    const orderResponse = await request(app.getHttpServer())
      .post('/api/purchases')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        supplierId: supplier.id,
        items: [{ productId: product.id, quantity: 10, unitCost: 6500 }],
      })
      .expect(201);
    const orderId = orderResponse.body.data.id;

    const cancelResponse = await request(app.getHttpServer())
      .post(`/api/purchases/${orderId}/cancel`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);
    expect(cancelResponse.body.data.status).toBe('CANCELLED');

    const productAfter = await request(app.getHttpServer())
      .get(`/api/products/${product.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(productAfter.body.data.stockQuantity).toBe(0);

    await request(app.getHttpServer())
      .post(`/api/purchases/${orderId}/receive`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
  });
});
