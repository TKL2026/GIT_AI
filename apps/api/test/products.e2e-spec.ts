import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Products (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let organizationId: string;
  const email = `products-e2e-${Date.now()}@demo.com`;
  const cashierEmail = `products-cashier-e2e-${Date.now()}@demo.com`;

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
      organizationName: 'Boutique Products E2E',
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
    await prisma.product.deleteMany({ where: { organizationId } });
    await prisma.user.deleteMany({ where: { organizationId } });
    await prisma.organization.deleteMany({ where: { id: organizationId } });
    await app.close();
  });

  async function createProduct(name: string) {
    const response = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name,
        sku: `${name.replace(/\s+/g, '-').toUpperCase()}-${Date.now()}-${Math.random()}`,
        purchasePrice: 1000,
        salePrice: 1500,
        initialStock: 5,
      })
      .expect(201);
    return response.body.data;
  }

  it('BUG-004 : modifie un produit (PATCH) et vérifie la persistance', async () => {
    const product = await createProduct('Savon');

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/products/${product.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Savon de Marseille', salePrice: 2000 })
      .expect(200);

    expect(updateResponse.body.data.name).toBe('Savon de Marseille');
    expect(updateResponse.body.data.salePrice).toBe(2000);
    // Un champ non envoyé (purchasePrice) ne doit pas être effacé.
    expect(updateResponse.body.data.purchasePrice).toBe(1000);

    const refetched = await request(app.getHttpServer())
      .get(`/api/products/${product.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(refetched.body.data.name).toBe('Savon de Marseille');
  });

  it('BUG-004 : archive un produit (DELETE), le masque du catalogue mais garde sa fiche consultable', async () => {
    const product = await createProduct('Bougie');

    await request(app.getHttpServer())
      .delete(`/api/products/${product.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const listResponse = await request(app.getHttpServer())
      .get('/api/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(listResponse.body.data.some((p: { id: string }) => p.id === product.id)).toBe(false);

    const detailResponse = await request(app.getHttpServer())
      .get(`/api/products/${product.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(detailResponse.body.data.isActive).toBe(false);
  });

  it('refuse la modification et l’archivage pour un rôle CASHIER', async () => {
    const product = await createProduct('Allumettes');

    const loginResponse = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: cashierEmail,
      password: 'Password123!',
    });
    const cashierToken = loginResponse.body.data.accessToken;

    await request(app.getHttpServer())
      .patch(`/api/products/${product.id}`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({ name: 'Hack' })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/api/products/${product.id}`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .expect(403);
  });
});
