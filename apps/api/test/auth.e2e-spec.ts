import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const email = `e2e-${Date.now()}@demo.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('register -> login -> accès protégé -> refresh', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        organizationName: 'Boutique E2E',
        email,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      })
      .expect(201);

    expect(registerResponse.body.data.accessToken).toBeDefined();
    expect(registerResponse.body.data.user.email).toBe(email);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'Password123!' })
      .expect(200);

    const { accessToken, refreshToken } = loginResponse.body.data;

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
});
