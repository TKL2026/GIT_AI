import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { MailService } from '../src/modules/mail/mail.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mailService: MailService;
  const email = `e2e-${Date.now()}@demo.com`;

  // Ce fichier enchaîne volontairement plus de 5 connexions au total (une
  // par scénario de vérification de code) — largement au-delà du throttle
  // réel de /auth/login (5/60s, inchangé en production, déjà couvert
  // ailleurs). Une app NestJS fraîche par test (plutôt qu'une seule partagée
  // via beforeAll) donne un ThrottlerStorage neuf à chaque fois, sans avoir
  // à mocker le guard — la base Postgres, elle, persiste normalement entre
  // les tests (seul le conteneur DI est recréé).
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    mailService = app.get(MailService);
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    const cleanupModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const cleanupPrisma = cleanupModule.get(PrismaService);
    // `startsWith` (pas `contains`) : ce fichier ne crée que des emails
    // commençant par "e2e-" (ex: e2e-orga-..., e2e-suspended-...), mais
    // "e2e-" apparaît aussi en sous-chaîne dans d'autres specs e2e (ex:
    // admin.e2e-spec.ts -> "admin-e2e-orgA-..."). `contains` capturait donc
    // aussi leurs utilisateurs quand la suite complète tourne en parallèle,
    // provoquant une violation de clé étrangère (stock_movements) à la
    // suppression d'un utilisateur encore référencé par un autre fichier.
    await cleanupPrisma.user.deleteMany({ where: { email: { startsWith: 'e2e-' } } });
    await cleanupModule.close();
  });

  /** Déclenche une connexion email+mot de passe réelle et capture le code
   * réellement envoyé (en interceptant l'appel à MailService, l'envoi Resend
   * réel sous-jacent continue de s'exécuter normalement et peut échouer
   * silencieusement en sandbox — comme pour les autres flux email de cette
   * suite — sans jamais affecter ce test). */
  async function loginAndCaptureCode(
    loginEmail: string,
    password: string,
  ): Promise<{ challengeToken: string; code: string }> {
    const sendSpy = jest.spyOn(mailService, 'sendLoginVerificationCode');
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: loginEmail, password })
      .expect(200);

    const { challengeToken } = loginResponse.body.data;
    expect(challengeToken).toEqual(expect.any(String));
    expect(loginResponse.body.data.accessToken).toBeUndefined();

    const call = sendSpy.mock.calls.find(([to]) => to === loginEmail);
    expect(call).toBeDefined();
    const code = call![1];
    sendSpy.mockRestore();

    return { challengeToken, code };
  }

  it('register -> login (challenge, pas de tokens) -> verify-login-code -> accès protégé -> refresh', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        organizationName: 'Boutique E2E',
        email,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      })
      .expect(201);

    const { challengeToken, code } = await loginAndCaptureCode(email, 'Password123!');

    // Aucun accès métier possible avant la vérification du code.
    await request(app.getHttpServer()).get('/api/products').expect(401);

    const verifyResponse = await request(app.getHttpServer())
      .post('/api/auth/verify-login-code')
      .send({ challengeToken, code })
      .expect(200);

    const { accessToken, refreshToken } = verifyResponse.body.data;
    expect(accessToken).toEqual(expect.any(String));
    expect(verifyResponse.body.data.user.email).toBe(email);

    await request(app.getHttpServer()).get('/api/products').expect(401);
    await request(app.getHttpServer())
      .get('/api/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);
    expect(refreshResponse.body.data.accessToken).toBeDefined();
    expect(refreshResponse.body.data.refreshToken).not.toBe(refreshToken);
  });

  it('identifiants incorrects : 401, aucune vérification créée', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'mauvais-mot-de-passe' })
      .expect(401);
  });

  it('code incorrect : 401 LOGIN_CODE_INVALID, aucun accès', async () => {
    const { challengeToken } = await loginAndCaptureCode(email, 'Password123!');

    const response = await request(app.getHttpServer())
      .post('/api/auth/verify-login-code')
      .send({ challengeToken, code: '000000' })
      .expect(401);

    expect(response.body.code).toBe('LOGIN_CODE_INVALID');
  });

  it('code expiré : 401 LOGIN_CODE_EXPIRED', async () => {
    const { challengeToken } = await loginAndCaptureCode(email, 'Password123!');

    await prisma.loginVerification.update({
      where: { challengeToken },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/verify-login-code')
      .send({ challengeToken, code: '123456' })
      .expect(401);

    expect(response.body.code).toBe('LOGIN_CODE_EXPIRED');
  });

  it('code déjà utilisé : la seconde vérification échoue (LOGIN_CHALLENGE_INVALID)', async () => {
    const { challengeToken, code } = await loginAndCaptureCode(email, 'Password123!');

    await request(app.getHttpServer())
      .post('/api/auth/verify-login-code')
      .send({ challengeToken, code })
      .expect(200);

    const second = await request(app.getHttpServer())
      .post('/api/auth/verify-login-code')
      .send({ challengeToken, code })
      .expect(401);

    expect(second.body.code).toBe('LOGIN_CHALLENGE_INVALID');
  });

  it("renvoi de code : l'ancien code ne fonctionne plus, le nouveau fonctionne", async () => {
    const { challengeToken, code: oldCode } = await loginAndCaptureCode(email, 'Password123!');

    // lastSentAt vient d'être posé par login() lui-même (à l'instant) : un
    // renvoi "naturel" juste après serait refusé par le cooldown (comportement
    // voulu, couvert par le test suivant) — on recule lastSentAt pour tester
    // ici spécifiquement la régénération du code, pas le cooldown.
    await prisma.loginVerification.update({
      where: { challengeToken },
      data: { lastSentAt: new Date(Date.now() - 61 * 1000) },
    });

    const sendSpy = jest.spyOn(mailService, 'sendLoginVerificationCode');
    await request(app.getHttpServer())
      .post('/api/auth/resend-login-code')
      .send({ challengeToken })
      .expect(200);
    const newCode = sendSpy.mock.calls[sendSpy.mock.calls.length - 1][1];
    sendSpy.mockRestore();

    expect(newCode).not.toBe(oldCode);

    await request(app.getHttpServer())
      .post('/api/auth/verify-login-code')
      .send({ challengeToken, code: oldCode })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/verify-login-code')
      .send({ challengeToken, code: newCode })
      .expect(200);
  });

  it('renvoi trop rapproché (y compris juste après le code initial de connexion) : 429 LOGIN_CODE_RESEND_TOO_SOON', async () => {
    const { challengeToken } = await loginAndCaptureCode(email, 'Password123!');

    // Aucun backdating ici : lastSentAt vient d'être posé par login() lui-même,
    // donc ce tout premier renvoi doit déjà être refusé par le cooldown.
    const response = await request(app.getHttpServer())
      .post('/api/auth/resend-login-code')
      .send({ challengeToken })
      .expect(429);

    expect(response.body.code).toBe('LOGIN_CODE_RESEND_TOO_SOON');
  });

  it('trop de tentatives : bloqué même avec le bon code au 6e essai', async () => {
    const { challengeToken, code } = await loginAndCaptureCode(email, 'Password123!');

    for (let i = 0; i < 5; i += 1) {
      await request(app.getHttpServer())
        .post('/api/auth/verify-login-code')
        .send({ challengeToken, code: '000000' })
        .expect(401);
    }

    const final = await request(app.getHttpServer())
      .post('/api/auth/verify-login-code')
      .send({ challengeToken, code })
      .expect(401);

    expect(['LOGIN_CODE_MAX_ATTEMPTS', 'LOGIN_CHALLENGE_INVALID']).toContain(final.body.code);
  });

  it('challengeToken falsifié/aléatoire : 401 LOGIN_CHALLENGE_INVALID', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/verify-login-code')
      .send({ challengeToken: '00000000-0000-0000-0000-000000000000', code: '123456' })
      .expect(401);

    expect(response.body.code).toBe('LOGIN_CHALLENGE_INVALID');
  });

  it("le challengeToken (simple UUID, jamais un JWT) ne donne accès à aucune route protégée s'il est présenté comme un Bearer token", async () => {
    const { challengeToken } = await loginAndCaptureCode(email, 'Password123!');

    await request(app.getHttpServer())
      .get('/api/products')
      .set('Authorization', `Bearer ${challengeToken}`)
      .expect(401);
    await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${challengeToken}`)
      .expect(401);
  });

  it('vérifications concurrentes du même code : une seule réussit', async () => {
    const { challengeToken, code } = await loginAndCaptureCode(email, 'Password123!');

    const [a, b] = await Promise.all([
      request(app.getHttpServer()).post('/api/auth/verify-login-code').send({ challengeToken, code }),
      request(app.getHttpServer()).post('/api/auth/verify-login-code').send({ challengeToken, code }),
    ]);

    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([200, 401]);
  });

  it('organisation suspendue : la vérification réussit mais une route protégée reste refusée (SubscriptionGuard)', async () => {
    const suspendedEmail = `e2e-suspended-${Date.now()}@demo.com`;
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        organizationName: 'Boutique Suspendue E2E',
        email: suspendedEmail,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'Suspendu',
      })
      .expect(201);

    const organizationId = registerResponse.body.data.user.organizationId;
    await prisma.organization.update({
      where: { id: organizationId },
      data: { suspendedAt: new Date() },
    });

    const { challengeToken, code } = await loginAndCaptureCode(suspendedEmail, 'Password123!');

    const verifyResponse = await request(app.getHttpServer())
      .post('/api/auth/verify-login-code')
      .send({ challengeToken, code })
      .expect(200);

    const protectedResponse = await request(app.getHttpServer())
      .get('/api/products')
      .set('Authorization', `Bearer ${verifyResponse.body.data.accessToken}`)
      .expect(403);
    expect(protectedResponse.body.code).toBe('ORGANIZATION_SUSPENDED');

    await prisma.organization.delete({ where: { id: organizationId } });
  });

  it('isolation inter-organisations : le code d\'un utilisateur ne débloque jamais le compte d\'un autre', async () => {
    const emailA = `e2e-orga-${Date.now()}@demo.com`;
    const emailB = `e2e-orgb-${Date.now()}@demo.com`;

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        organizationName: 'Organisation A E2E',
        email: emailA,
        password: 'Password123!',
        firstName: 'A',
        lastName: 'User',
      })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        organizationName: 'Organisation B E2E',
        email: emailB,
        password: 'Password123!',
        firstName: 'B',
        lastName: 'User',
      })
      .expect(201);

    const { challengeToken: challengeA, code: codeA } = await loginAndCaptureCode(emailA, 'Password123!');
    const { code: codeB } = await loginAndCaptureCode(emailB, 'Password123!');

    // Le code de B ne fonctionne pas sur le challenge de A.
    await request(app.getHttpServer())
      .post('/api/auth/verify-login-code')
      .send({ challengeToken: challengeA, code: codeB })
      .expect(401);

    // Le vrai code de A fonctionne et renvoie bien le compte A.
    const verifyA = await request(app.getHttpServer())
      .post('/api/auth/verify-login-code')
      .send({ challengeToken: challengeA, code: codeA })
      .expect(200);
    expect(verifyA.body.data.user.email).toBe(emailA);
  });
});
