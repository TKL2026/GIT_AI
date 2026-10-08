import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Products import (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let organizationId: string;
  let otherOrgAccessToken: string;
  let otherOrgId: string;
  const email = `products-import-e2e-${Date.now()}@demo.com`;
  const cashierEmail = `products-import-cashier-e2e-${Date.now()}@demo.com`;
  const otherOrgEmail = `products-import-other-org-e2e-${Date.now()}@demo.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.setGlobalPrefix('api');
    // Reflète la configuration réelle de bootstrap() (main.ts) : sans cette
    // limite, Express refuserait déjà (413/500) un lot de quelques milliers
    // de lignes avant même d'atteindre la validation applicative testée ici.
    app.useBodyParser('json', { limit: '5mb' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    const registerResponse = await request(app.getHttpServer()).post('/api/auth/register').send({
      organizationName: 'Boutique Products Import E2E',
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

    const otherOrgResponse = await request(app.getHttpServer()).post('/api/auth/register').send({
      organizationName: 'Boutique Products Import E2E (autre organisation)',
      email: otherOrgEmail,
      password: 'Password123!',
      firstName: 'Autre',
      lastName: 'Organisation',
    });
    otherOrgAccessToken = otherOrgResponse.body.data.accessToken;
    otherOrgId = otherOrgResponse.body.data.user.organizationId;
  });

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { organizationId: { in: [organizationId, otherOrgId] } } });
    await prisma.user.deleteMany({ where: { organizationId: { in: [organizationId, otherOrgId] } } });
    await prisma.organization.deleteMany({ where: { id: { in: [organizationId, otherOrgId] } } });
    await app.close();
  });

  function importRequest(token: string) {
    return request(app.getHttpServer()).post('/api/products/import').set('Authorization', `Bearer ${token}`);
  }

  it('importe les lignes valides, applique le stock initial et rejette les lignes invalides sans bloquer les autres', async () => {
    const skuOk = `IMPORT-OK-${Date.now()}`;

    const response = await importRequest(accessToken)
      .send({
        rows: [
          { line: 2, name: 'Riz 25kg', sku: skuOk, purchasePrice: '12000', salePrice: '15000', initialStock: '20' },
          { line: 3, name: '', sku: 'SANS-NOM', purchasePrice: '1000', salePrice: '2000' },
        ],
      })
      .expect(201);

    expect(response.body.data.importedCount).toBe(1);
    expect(response.body.data.rejectedCount).toBe(1);
    expect(response.body.data.errors).toEqual([
      { line: 3, message: 'La désignation du produit est manquante.' },
    ]);

    const listResponse = await request(app.getHttpServer())
      .get('/api/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const imported = listResponse.body.data.find((p: { sku: string }) => p.sku === skuOk);
    expect(imported).toBeDefined();
    expect(imported.stockQuantity).toBe(20);
  });

  it('refuse une ligne dont le SKU est déjà utilisé par un produit existant de la même organisation', async () => {
    const sku = `IMPORT-DUP-${Date.now()}`;

    await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Déjà existant', sku, purchasePrice: 1000, salePrice: 1500 })
      .expect(201);

    const response = await importRequest(accessToken)
      .send({
        rows: [{ line: 2, name: 'Doublon', sku, purchasePrice: '1000', salePrice: '1500' }],
      })
      .expect(201);

    expect(response.body.data.importedCount).toBe(0);
    expect(response.body.data.errors).toEqual([
      { line: 2, message: `Le SKU "${sku}" est déjà utilisé par un produit existant.` },
    ]);
  });

  it("n'applique pas la détection de doublon à travers les organisations (isolation multi-tenant)", async () => {
    const sharedSku = `IMPORT-SHARED-${Date.now()}`;

    await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Produit organisation A', sku: sharedSku, purchasePrice: 1000, salePrice: 1500 })
      .expect(201);

    const response = await importRequest(otherOrgAccessToken)
      .send({
        rows: [{ line: 2, name: 'Produit organisation B', sku: sharedSku, purchasePrice: '2000', salePrice: '2500' }],
      })
      .expect(201);

    expect(response.body.data.importedCount).toBe(1);
    expect(response.body.data.errors).toEqual([]);
  });

  it('refuse l’import pour un rôle CASHIER (RBAC)', async () => {
    const loginResponse = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: cashierEmail,
      password: 'Password123!',
    });
    const cashierToken = loginResponse.body.data.accessToken;

    await importRequest(cashierToken)
      .send({ rows: [{ line: 2, name: 'X', sku: `X-${Date.now()}`, purchasePrice: '1000', salePrice: '1500' }] })
      .expect(403);
  });

  it('refuse un tableau de lignes vide', async () => {
    await importRequest(accessToken).send({ rows: [] }).expect(400);
  });

  it('refuse un fichier dépassant la limite de lignes autorisées, avec un message compréhensible', async () => {
    const rows = Array.from({ length: 5001 }, (_, i) => ({
      line: i + 2,
      name: `Produit ${i}`,
      sku: `BULK-${Date.now()}-${i}`,
      purchasePrice: '1000',
      salePrice: '1500',
    }));

    const response = await importRequest(accessToken).send({ rows }).expect(400);
    expect(response.body.message).toContain('5000');
  });
});
