import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Stock (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  const email = `stock-e2e-${Date.now()}@demo.com`;

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
      organizationName: 'Boutique Stock E2E',
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
      await prisma.stockMovement.deleteMany({ where: { organizationId: user.organizationId } });
      await prisma.product.deleteMany({ where: { organizationId: user.organizationId } });
      await prisma.user.deleteMany({ where: { email } });
      await prisma.organization.deleteMany({ where: { id: user.organizationId } });
    }
    await app.close();
  });

  it('entrée -> sortie -> sortie refusée -> ajustement -> alertes', async () => {
    const productResponse = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Riz 25kg',
        sku: `RIZ-${Date.now()}`,
        purchasePrice: 12000,
        salePrice: 15000,
        initialStock: 10,
        minStock: 5,
      })
      .expect(201);

    const productId = productResponse.body.data.id;
    expect(productResponse.body.data.stockQuantity).toBe(10);

    const inResponse = await request(app.getHttpServer())
      .post('/api/stock/movements/in')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ productId, quantity: 20, reason: 'Réception fournisseur' })
      .expect(201);
    expect(inResponse.body.data.newQuantity).toBe(30);

    const outResponse = await request(app.getHttpServer())
      .post('/api/stock/movements/out')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ productId, quantity: 5, reason: 'Vente comptoir' })
      .expect(201);
    expect(outResponse.body.data.newQuantity).toBe(25);

    await request(app.getHttpServer())
      .post('/api/stock/movements/out')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ productId, quantity: 9999 })
      .expect(400);

    const adjustmentResponse = await request(app.getHttpServer())
      .post('/api/stock/movements/adjustment')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ productId, newQuantity: 3, reason: 'Écart inventaire' })
      .expect(201);
    expect(adjustmentResponse.body.data.newQuantity).toBe(3);
    expect(adjustmentResponse.body.data.quantity).toBe(-22);

    const alertsResponse = await request(app.getHttpServer())
      .get('/api/stock/alerts')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(alertsResponse.body.data.some((product: { id: string }) => product.id === productId)).toBe(
      true,
    );

    const movementsResponse = await request(app.getHttpServer())
      .get(`/api/stock/movements?productId=${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(movementsResponse.body.data).toHaveLength(3);
  });
});
