import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Admin back-office (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let orgAId: string;
  let orgAOwnerToken: string;
  let orgAProductId: string;
  let orgBId: string;
  let orgBOwnerToken: string;
  let platformAdminId: string;
  let platformAdminToken: string;

  const tenantTokensByRole: Partial<Record<Role, string>> = {};

  const suffix = Date.now();
  const platformAdminEmail = `admin-e2e-platform-${suffix}@uge.pro`;
  const platformAdminPassword = 'AdminPassword123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // --- Organisation A : un OWNER + un utilisateur par rôle (pour les tests RBAC) ---
    const orgARes = await request(app.getHttpServer()).post('/api/auth/register').send({
      organizationName: 'Admin E2E Org A',
      email: `admin-e2e-orgA-owner-${suffix}@demo.com`,
      password: 'Password123!',
      firstName: 'Owner',
      lastName: 'A',
    });
    orgAOwnerToken = orgARes.body.data.accessToken;
    orgAId = orgARes.body.data.user.organizationId;
    tenantTokensByRole[Role.OWNER] = orgAOwnerToken;

    const productRes = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${orgAOwnerToken}`)
      .send({ name: 'Produit Admin E2E', sku: `ADMIN-E2E-${suffix}`, purchasePrice: 1000, salePrice: 1500, initialStock: 5 });
    orgAProductId = productRes.body.data.id;

    await request(app.getHttpServer())
      .post('/api/sales')
      .set('Authorization', `Bearer ${orgAOwnerToken}`)
      .send({ paymentMethod: 'CASH', items: [{ productId: orgAProductId, quantity: 1 }] });

    for (const role of [Role.ADMIN, Role.DIRECTOR, Role.STOCK_MANAGER, Role.CASHIER]) {
      const email = `admin-e2e-orgA-${role.toLowerCase()}-${suffix}@demo.com`;
      await prisma.user.create({
        data: {
          email,
          passwordHash: await bcrypt.hash('Password123!', 10),
          firstName: role,
          lastName: 'Test',
          role,
          organizationId: orgAId,
        },
      });
      const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'Password123!' });
      tenantTokensByRole[role] = login.body.data.accessToken;
    }

    // --- Organisation B : isolation multi-tenant ---
    const orgBRes = await request(app.getHttpServer()).post('/api/auth/register').send({
      organizationName: 'Admin E2E Org B',
      email: `admin-e2e-orgB-owner-${suffix}@demo.com`,
      password: 'Password123!',
      firstName: 'Owner',
      lastName: 'B',
    });
    orgBOwnerToken = orgBRes.body.data.accessToken;
    orgBId = orgBRes.body.data.user.organizationId;

    // --- PLATFORM_ADMIN : jamais via une route publique, toujours créé hors-bande ---
    const platformAdmin = await prisma.platformAdmin.create({
      data: {
        email: platformAdminEmail,
        passwordHash: await bcrypt.hash(platformAdminPassword, 10),
        firstName: 'Plateforme',
        lastName: 'Admin',
      },
    });
    platformAdminId = platformAdmin.id;

    const adminLogin = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ email: platformAdminEmail, password: platformAdminPassword });
    platformAdminToken = adminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.adminAuditLog.deleteMany({ where: { platformAdminId } });
    await prisma.platformAdmin.deleteMany({ where: { id: platformAdminId } });
    await prisma.sale.deleteMany({ where: { organizationId: orgAId } });
    await prisma.product.deleteMany({ where: { organizationId: { in: [orgAId, orgBId] } } });
    await prisma.user.deleteMany({ where: { organizationId: { in: [orgAId, orgBId] } } });
    await prisma.organization.deleteMany({ where: { id: { in: [orgAId, orgBId] } } });
    await app.close();
  });

  function admin(path: string) {
    return request(app.getHttpServer()).get(path).set('Authorization', `Bearer ${platformAdminToken}`);
  }

  it('refuse (401) un accès sans aucun token', async () => {
    await request(app.getHttpServer()).get('/api/admin/dashboard').expect(401);
  });

  it(
    'refuse (401) un token d’organisation sur les routes admin, pour chaque rôle — un secret JWT distinct rend ' +
      'ces tokens structurellement invalides ici, pas seulement "rôle insuffisant" (voir rapport final)',
    async () => {
      for (const [role, token] of Object.entries(tenantTokensByRole)) {
        const response = await request(app.getHttpServer())
          .get('/api/admin/dashboard')
          .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(401);
        expect(response.body.message).not.toContain('passwordHash');
        void role;
      }
    },
  );

  it('refuse (401) un token PLATFORM_ADMIN sur une route tenant — isolation dans les deux sens', async () => {
    await request(app.getHttpServer())
      .get('/api/products')
      .set('Authorization', `Bearer ${platformAdminToken}`)
      .expect(401);
  });

  it('un OWNER authentifié ne devient jamais PLATFORM_ADMIN (refusé sur /admin/auth/me)', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/auth/me')
      .set('Authorization', `Bearer ${orgAOwnerToken}`)
      .expect(401);
  });

  it('permet à un PLATFORM_ADMIN authentifié de consulter le dashboard, les organisations, les utilisateurs, les abonnements, les paiements, le système et le journal d’audit', async () => {
    await admin('/api/admin/dashboard').expect(200);
    await admin('/api/admin/organizations').expect(200);
    await admin('/api/admin/users').expect(200);
    await admin('/api/admin/subscriptions').expect(200);
    await admin('/api/admin/payments').expect(200);
    await admin('/api/admin/system').expect(200);
    await admin('/api/admin/audit-logs').expect(200);
  });

  it('l’admin peut consulter le détail de deux organisations différentes (A et B)', async () => {
    const resA = await admin(`/api/admin/organizations/${orgAId}`).expect(200);
    const resB = await admin(`/api/admin/organizations/${orgBId}`).expect(200);
    expect(resA.body.data.id).toBe(orgAId);
    expect(resB.body.data.id).toBe(orgBId);
    expect(resA.body.data.name).toBe('Admin E2E Org A');
    expect(resB.body.data.name).toBe('Admin E2E Org B');
  });

  it('le détail d’une organisation reflète ses données réelles (utilisateurs, produits, ventes)', async () => {
    const res = await admin(`/api/admin/organizations/${orgAId}`).expect(200);
    // OWNER + ADMIN + DIRECTOR + STOCK_MANAGER + CASHIER = 5 utilisateurs.
    expect(res.body.data.userCount).toBe(5);
    expect(res.body.data.productCount).toBe(1);
    expect(res.body.data.salesCount).toBe(1);
    expect(res.body.data.lastSaleAt).not.toBeNull();
  });

  it('la pagination des organisations respecte page/pageSize et renvoie le bon total', async () => {
    const pageSize1 = await admin('/api/admin/organizations?page=1&pageSize=1').expect(200);
    expect(pageSize1.body.data.data).toHaveLength(1);
    expect(pageSize1.body.data.total).toBeGreaterThanOrEqual(2);
  });

  it('le filtre de recherche sur les organisations fonctionne', async () => {
    const res = await admin(`/api/admin/organizations?search=Admin E2E Org A`).expect(200);
    expect(res.body.data.data.some((org: { id: string }) => org.id === orgAId)).toBe(true);
    expect(res.body.data.data.some((org: { id: string }) => org.id === orgBId)).toBe(false);
  });

  it('le filtre organisationId fonctionne sur la liste des utilisateurs', async () => {
    const res = await admin(`/api/admin/users?organizationId=${orgAId}&pageSize=50`).expect(200);
    expect(res.body.data.total).toBe(5);
    expect(res.body.data.data.every((u: { organizationId: string }) => u.organizationId === orgAId)).toBe(true);
  });

  it(
    'suspend réellement l’accès tenant (403 ORGANIZATION_SUSPENDED) ; un double-suspend échoue (409) sans effet ; ' +
      'la réactivation restaure l’accès',
    async () => {
      await admin(`/api/admin/organizations/${orgBId}`); // no-op, juste pour varier la cible

      await request(app.getHttpServer())
        .post(`/api/admin/organizations/${orgAId}/suspend`)
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .expect(200);

      const blocked = await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${orgAOwnerToken}`);
      expect(blocked.status).toBe(403);
      expect(blocked.body.code).toBe('ORGANIZATION_SUSPENDED');

      await request(app.getHttpServer())
        .post(`/api/admin/organizations/${orgAId}/suspend`)
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .expect(409);

      await request(app.getHttpServer())
        .post(`/api/admin/organizations/${orgAId}/reactivate`)
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .expect(200);

      const restored = await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${orgAOwnerToken}`);
      expect(restored.status).toBe(200);
    },
  );

  it('extend-trial prolonge réellement currentPeriodEnd de l’organisation', async () => {
    const before = await admin(`/api/admin/organizations/${orgBId}`).expect(200);
    const periodBefore = new Date(before.body.data.currentPeriodEnd).getTime();

    await request(app.getHttpServer())
      .post(`/api/admin/organizations/${orgBId}/extend-trial`)
      .set('Authorization', `Bearer ${platformAdminToken}`)
      .send({ days: 7 })
      .expect(200);

    const after = await admin(`/api/admin/organizations/${orgBId}`).expect(200);
    const periodAfter = new Date(after.body.data.currentPeriodEnd).getTime();
    expect(periodAfter).toBeGreaterThan(periodBefore);
  });

  it('refuse (400) une extension d’essai hors bornes (ex: 0 ou 100 jours)', async () => {
    await request(app.getHttpServer())
      .post(`/api/admin/organizations/${orgBId}/extend-trial`)
      .set('Authorization', `Bearer ${platformAdminToken}`)
      .send({ days: 0 })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/api/admin/organizations/${orgBId}/extend-trial`)
      .set('Authorization', `Bearer ${platformAdminToken}`)
      .send({ days: 100 })
      .expect(400);
  });

  it(
    'chaque action sensible (connexion, suspension, réactivation, prolongation) crée une entrée append-only ' +
      'dans le journal d’audit, consultable via /admin/audit-logs',
    async () => {
      // Le journal est volontairement global (tous les admins y figurent, pas
      // seulement celui du test) — on vérifie que NOS actions y apparaissent
      // bien, avec la bonne cible, pas que la page entière n'appartient qu'à
      // nous.
      const res = await admin('/api/admin/audit-logs?pageSize=100').expect(200);
      const ownEntries = res.body.data.data.filter(
        (log: { platformAdminId: string }) => log.platformAdminId === platformAdminId,
      );
      const ownActions = ownEntries.map((log: { action: string }) => log.action);
      expect(ownActions).toContain('admin.login');
      expect(ownActions).toContain('organization.suspend');
      expect(ownActions).toContain('organization.reactivate');
      expect(ownActions).toContain('organization.extend_trial');
      expect(
        ownEntries.some(
          (log: { action: string; targetId: string | null }) =>
            log.action === 'organization.suspend' && log.targetId === orgAId,
        ),
      ).toBe(true);
    },
  );

  it('n’expose jamais de champ ressemblant à un secret sur les endpoints admin', async () => {
    const responses = await Promise.all([
      admin('/api/admin/dashboard'),
      admin('/api/admin/organizations'),
      admin(`/api/admin/organizations/${orgAId}`),
      admin('/api/admin/users'),
      admin('/api/admin/subscriptions'),
      admin('/api/admin/payments'),
      admin('/api/admin/system'),
      admin('/api/admin/audit-logs'),
      admin('/api/admin/auth/me'),
    ]);

    const forbiddenKeys = /passwordHash|refreshToken|jwt_access_secret|jwt_refresh_secret|campay_permanent_token|campay_password|webhook_key|api_key|anthropic_api_key/i;
    for (const response of responses) {
      expect(response.status).toBe(200);
      expect(JSON.stringify(response.body)).not.toMatch(forbiddenKeys);
    }
  });

  it('l’isolation multi-tenant tenant reste inchangée (A ne voit pas les produits de B)', async () => {
    const asA = await request(app.getHttpServer())
      .get('/api/products')
      .set('Authorization', `Bearer ${orgAOwnerToken}`)
      .expect(200);
    expect(asA.body.data.some((p: { id: string }) => p.id === orgAProductId)).toBe(true);

    const asB = await request(app.getHttpServer())
      .get('/api/products')
      .set('Authorization', `Bearer ${orgBOwnerToken}`)
      .expect(200);
    expect(asB.body.data.some((p: { id: string }) => p.id === orgAProductId)).toBe(false);
  });
});
