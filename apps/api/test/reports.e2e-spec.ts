import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * superagent ne bufferise `res.body` en Buffer que pour les types qu'il
 * reconnaît explicitement — "application/pdf" n'en fait pas partie par
 * défaut. Parseur explicite pour garantir un vrai Buffer binaire ici,
 * plutôt que de dépendre d'un comportement par défaut incertain.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function bufferParser(res: any, callback: (err: Error | null, body: Buffer) => void) {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(chunk));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
}

describe('Reports (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let orgAToken: string;
  let orgAId: string;
  let orgBToken: string;
  let orgBId: string;
  let cashierToken: string;

  const emailA = `reports-org-a-${Date.now()}@demo.com`;
  const emailB = `reports-org-b-${Date.now()}@demo.com`;
  const cashierEmail = `reports-cashier-${Date.now()}@demo.com`;

  jest.setTimeout(30000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    const registerA = await request(app.getHttpServer()).post('/api/auth/register').send({
      organizationName: 'Boutique Rapports A',
      email: emailA,
      password: 'Password123!',
      firstName: 'Org',
      lastName: 'A',
    });
    orgAToken = registerA.body.data.accessToken;
    orgAId = registerA.body.data.user.organizationId;

    const registerB = await request(app.getHttpServer()).post('/api/auth/register').send({
      organizationName: 'Boutique Rapports B',
      email: emailB,
      password: 'Password123!',
      firstName: 'Org',
      lastName: 'B',
    });
    orgBToken = registerB.body.data.accessToken;
    orgBId = registerB.body.data.user.organizationId;

    await prisma.user.create({
      data: {
        email: cashierEmail,
        passwordHash: await bcrypt.hash('Password123!', 10),
        firstName: 'Cash',
        lastName: 'Ier',
        role: Role.CASHIER,
        organizationId: orgAId,
      },
    });
    const cashierLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: cashierEmail, password: 'Password123!' });
    cashierToken = cashierLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.saleItem.deleteMany({ where: { sale: { organizationId: { in: [orgAId, orgBId] } } } });
    await prisma.sale.deleteMany({ where: { organizationId: { in: [orgAId, orgBId] } } });
    await prisma.product.deleteMany({ where: { organizationId: { in: [orgAId, orgBId] } } });
    await prisma.user.deleteMany({ where: { organizationId: { in: [orgAId, orgBId] } } });
    await prisma.organization.deleteMany({ where: { id: { in: [orgAId, orgBId] } } });
    await app.close();
  });

  function todayDouala(): string {
    // Même logique que le backend (Africa/Douala, UTC+1 fixe) — juste pour
    // construire les URLs de ce test, pas une ré-implémentation métier.
    const now = new Date();
    const doualaMs = now.getTime() + 60 * 60000;
    return new Date(doualaMs).toISOString().slice(0, 10);
  }

  async function createProductAndSale(token: string, quantity: number, salePrice: number) {
    const productResponse = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Riz Rapports',
        sku: `RIZ-REPORTS-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        purchasePrice: 5000,
        salePrice,
        initialStock: 1000,
      })
      .expect(201);
    const product = productResponse.body.data;

    const saleResponse = await request(app.getHttpServer())
      .post('/api/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({ paymentMethod: 'CASH', items: [{ productId: product.id, quantity }] })
      .expect(201);

    return { product, sale: saleResponse.body.data };
  }

  describe('GET /reports/daily', () => {
    it("renvoie hasActivity=false et des zéros réels pour une journée sans vente (pas de donnée fabriquée)", async () => {
      const response = await request(app.getHttpServer())
        .get('/api/reports/daily')
        .query({ date: '2020-01-01' })
        .set('Authorization', `Bearer ${orgAToken}`)
        .expect(200);

      expect(response.body.data.hasActivity).toBe(false);
      expect(response.body.data.totalRevenue).toBe(0);
      expect(response.body.data.salesCount).toBe(0);
      expect(response.body.data.stockAlerts).toEqual([]);
    });

    it("reflète une vente réelle du jour", async () => {
      const { sale } = await createProductAndSale(orgAToken, 3, 10000);
      const date = todayDouala();

      const response = await request(app.getHttpServer())
        .get('/api/reports/daily')
        .query({ date })
        .set('Authorization', `Bearer ${orgAToken}`)
        .expect(200);

      expect(response.body.data.hasActivity).toBe(true);
      expect(response.body.data.totalRevenue).toBeGreaterThanOrEqual(Number(sale.totalAmount));
      expect(response.body.data.salesCount).toBeGreaterThanOrEqual(1);
    });

    it('refuse (403) pour un rôle CASHIER', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/daily')
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(403);
    });
  });

  describe('Alertes stock historiques (anomalie QA #2)', () => {
    it("un rapport passé n'affiche jamais une alerte de stock apparue APRÈS la date du rapport", async () => {
      const productResponse = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${orgAToken}`)
        .send({
          name: 'Produit QA Stock',
          sku: `QA-STOCK-${Date.now()}`,
          purchasePrice: 1000,
          salePrice: 1500,
          initialStock: 50,
          minStock: 5,
        })
        .expect(201);
      const productId = productResponse.body.data.id;

      // Sortie ramenant le stock à 2 (bas) — on force sa date au passé.
      const outResponse = await request(app.getHttpServer())
        .post('/api/stock/movements/out')
        .set('Authorization', `Bearer ${orgAToken}`)
        .send({ productId, quantity: 48, reason: 'QA test' })
        .expect(201);
      const pastDate = new Date(Date.now() - 3 * 86400000);
      await prisma.stockMovement.update({
        where: { id: outResponse.body.data.id },
        data: { createdAt: pastDate },
      });
      const pastDateString = pastDate.toISOString().slice(0, 10);

      // Réapprovisionnement "aujourd'hui" (date réelle, non forcée).
      await request(app.getHttpServer())
        .post('/api/stock/movements/in')
        .set('Authorization', `Bearer ${orgAToken}`)
        .send({ productId, quantity: 48, reason: 'QA test réappro' })
        .expect(201);

      // Le rapport du jour passé doit montrer l'alerte (stock réellement
      // bas à cette date-là).
      const pastReport = await request(app.getHttpServer())
        .get('/api/reports/daily')
        .query({ date: pastDateString })
        .set('Authorization', `Bearer ${orgAToken}`)
        .expect(200);
      const pastAlert = pastReport.body.data.stockAlerts.find(
        (a: { productId: string }) => a.productId === productId,
      );
      expect(pastAlert).toBeDefined();
      expect(pastAlert.status).toBe('low');
      expect(pastAlert.stockQuantity).toBe(2);

      // Le rapport d'aujourd'hui, lui, ne doit PAS montrer cette alerte
      // (stock réapprovisionné) — c'est exactement le bug remonté par le
      // QA : un rapport du 26/10 affichait une alerte apparue le 28/10.
      const todayReport = await request(app.getHttpServer())
        .get('/api/reports/daily')
        .query({ date: todayDouala() })
        .set('Authorization', `Bearer ${orgAToken}`)
        .expect(200);
      const todayAlert = todayReport.body.data.stockAlerts.find(
        (a: { productId: string }) => a.productId === productId,
      );
      expect(todayAlert).toBeUndefined();
    });
  });

  describe('Validation des dates calendaires (anomalie QA #3)', () => {
    it('date=bonjour → 400', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/daily')
        .query({ date: 'bonjour' })
        .set('Authorization', `Bearer ${orgAToken}`)
        .expect(400);
    });

    it('date=2026-13-45 (mois et jour impossibles) → 400', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/daily')
        .query({ date: '2026-13-45' })
        .set('Authorization', `Bearer ${orgAToken}`)
        .expect(400);
    });

    it('date inexistante (30 février) → 400', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/daily')
        .query({ date: '2026-02-30' })
        .set('Authorization', `Bearer ${orgAToken}`)
        .expect(400);
    });

    it('date valide → fonctionne toujours normalement (200)', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/daily')
        .query({ date: '2026-10-27' })
        .set('Authorization', `Bearer ${orgAToken}`)
        .expect(200);
    });

    it('month=2026-13 → 400', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/monthly')
        .query({ month: '2026-13' })
        .set('Authorization', `Bearer ${orgAToken}`)
        .expect(400);
    });

    it('month valide → fonctionne toujours normalement (200)', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/monthly')
        .query({ month: '2026-10' })
        .set('Authorization', `Bearer ${orgAToken}`)
        .expect(200);
    });

    it('from/to impossibles sur la liste journalière → 400 (même validateur, étendu par cohérence)', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/daily/list')
        .query({ from: '2026-13-01', to: '2026-10-27' })
        .set('Authorization', `Bearer ${orgAToken}`)
        .expect(400);
    });
  });

  describe('GET /reports/daily/list', () => {
    it('isole strictement par organisation : org B ne voit jamais les ventes de org A', async () => {
      const date = todayDouala();
      // 30 jours en arrière (dans la limite de la plage autorisée) — ces
      // organisations viennent d'être créées, donc aucune vente avant.
      const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

      const [responseA, responseB] = await Promise.all([
        request(app.getHttpServer())
          .get('/api/reports/daily/list')
          .query({ from, to: date })
          .set('Authorization', `Bearer ${orgAToken}`)
          .expect(200),
        request(app.getHttpServer())
          .get('/api/reports/daily/list')
          .query({ from, to: date })
          .set('Authorization', `Bearer ${orgBToken}`)
          .expect(200),
      ]);

      const todayRowA = responseA.body.data.find((row: { date: string }) => row.date === date);
      const todayRowB = responseB.body.data.find((row: { date: string }) => row.date === date);
      expect(todayRowA.totalRevenue).toBeGreaterThan(0);
      expect(todayRowB.totalRevenue).toBe(0);
    });

    it('rejette une plage invalide (from postérieur à to)', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/daily/list')
        .query({ from: '2026-10-10', to: '2026-10-01' })
        .set('Authorization', `Bearer ${orgAToken}`)
        .expect(400);
    });
  });

  describe('GET /reports/daily/pdf', () => {
    it('renvoie un PDF téléchargeable avec un nom de fichier explicite', async () => {
      const date = todayDouala();
      const response = await request(app.getHttpServer())
        .get('/api/reports/daily/pdf')
        .query({ date })
        .set('Authorization', `Bearer ${orgAToken}`)
        .buffer(true)
        .parse(bufferParser)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toContain(`UGE_Rapport_Journalier_${date}.pdf`);
      expect((response.body as Buffer).subarray(0, 4).toString('ascii')).toBe('%PDF');
    });
  });

  describe('GET /reports/monthly', () => {
    it("agrège les ventes du mois en cours (un seul calcul, pas de somme de rapports journaliers)", async () => {
      const month = todayDouala().slice(0, 7);

      const response = await request(app.getHttpServer())
        .get('/api/reports/monthly')
        .query({ month })
        .set('Authorization', `Bearer ${orgAToken}`)
        .expect(200);

      expect(response.body.data.month).toBe(month);
      expect(response.body.data.hasActivity).toBe(true);
      expect(response.body.data.totalRevenue).toBeGreaterThan(0);
    });

    it("renvoie hasActivity=false pour un mois sans aucune activité", async () => {
      const response = await request(app.getHttpServer())
        .get('/api/reports/monthly')
        .query({ month: '2019-01' })
        .set('Authorization', `Bearer ${orgAToken}`)
        .expect(200);

      expect(response.body.data.hasActivity).toBe(false);
      expect(response.body.data.totalRevenue).toBe(0);
    });
  });

  describe('GET /reports/monthly/pdf', () => {
    it('renvoie un PDF téléchargeable avec un nom de fichier explicite', async () => {
      const month = todayDouala().slice(0, 7);
      const response = await request(app.getHttpServer())
        .get('/api/reports/monthly/pdf')
        .query({ month })
        .set('Authorization', `Bearer ${orgAToken}`)
        .buffer(true)
        .parse(bufferParser)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toContain(`UGE_Rapport_Mensuel_${month}.pdf`);
      expect((response.body as Buffer).subarray(0, 4).toString('ascii')).toBe('%PDF');
    });

    it('refuse (403) pour un rôle CASHIER', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/monthly/pdf')
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(403);
    });
  });
});
