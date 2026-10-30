import { ConflictException, HttpException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHmac } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

const TEST_PEPPER = 'test-pepper-not-for-production';
function hashCode(code: string): string {
  return createHmac('sha256', TEST_PEPPER).update(code).digest('hex');
}

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: {
    $transaction: jest.Mock;
    refreshToken: { create: jest.Mock; findFirst: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
    organization: { create: jest.Mock };
    user: { create: jest.Mock; update: jest.Mock };
    plan: { findUnique: jest.Mock };
    passwordResetToken: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
    emailVerificationToken: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
    loginVerification: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let subscriptionCreate: jest.Mock;
  let usersService: { findByEmail: jest.Mock; findById: jest.Mock };
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let configService: { get: jest.Mock };
  let mailService: {
    sendPasswordResetEmail: jest.Mock;
    sendInviteEmail: jest.Mock;
    sendVerificationEmail: jest.Mock;
    sendLoginVerificationCode: jest.Mock;
  };

  const fakeUser = {
    id: 'user-1',
    email: 'owner@demo.com',
    passwordHash: '',
    firstName: 'Demo',
    lastName: 'Owner',
    role: Role.OWNER,
    organizationId: 'org-1',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    fakeUser.passwordHash = await bcrypt.hash('Password123!', 10);

    subscriptionCreate = jest.fn().mockResolvedValue({});

    prisma = {
      $transaction: jest.fn(async (arg) =>
        Array.isArray(arg)
          ? Promise.all(arg)
          : arg({
              organization: { create: jest.fn().mockResolvedValue({ id: 'org-1', name: 'Boutique' }) },
              user: { create: jest.fn().mockResolvedValue(fakeUser) },
              subscription: { create: subscriptionCreate },
            }),
      ),
      refreshToken: {
        create: jest.fn().mockResolvedValue({}),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({}),
      },
      organization: { create: jest.fn() },
      user: { create: jest.fn(), update: jest.fn().mockResolvedValue(fakeUser) },
      plan: { findUnique: jest.fn() },
      passwordResetToken: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      emailVerificationToken: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      loginVerification: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };

    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
      verifyAsync: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          JWT_ACCESS_SECRET: 'access-secret',
          JWT_REFRESH_SECRET: 'refresh-secret',
          JWT_ACCESS_EXPIRES_IN: '15m',
          JWT_REFRESH_EXPIRES_IN: '7d',
          CORS_ORIGIN: 'http://localhost:5173',
          LOGIN_CODE_PEPPER: 'test-pepper-not-for-production',
          NODE_ENV: 'test',
        };
        return values[key];
      }),
    };

    mailService = {
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      sendInviteEmail: jest.fn().mockResolvedValue(undefined),
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendLoginVerificationCode: jest.fn().mockResolvedValue(undefined),
    };

    authService = new AuthService(
      prisma as unknown as PrismaService,
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
      mailService as unknown as MailService,
    );
  });

  describe('register', () => {
    it('crée une organisation et un utilisateur OWNER puis retourne des tokens', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await authService.register({
        organizationName: 'Boutique',
        email: 'owner@demo.com',
        password: 'Password123!',
        firstName: 'Demo',
        lastName: 'Owner',
      });

      expect(result.user).toEqual(fakeUser);
      expect(result.tokens.accessToken).toBe('signed-token');
      expect(result.tokens.refreshToken).toBe('signed-token');
      expect(prisma.refreshToken.create).toHaveBeenCalled();
      expect(prisma.emailVerificationToken.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: fakeUser.id }) }),
      );
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        fakeUser.email,
        expect.stringContaining('/verify-email?token='),
      );
    });

    it("sans planCode : crée une Subscription TRIAL avec 7 jours d'essai (comportement par défaut)", async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await authService.register({
        organizationName: 'Boutique',
        email: 'owner@demo.com',
        password: 'Password123!',
        firstName: 'Demo',
        lastName: 'Owner',
      });

      expect(prisma.plan.findUnique).not.toHaveBeenCalled();
      expect(subscriptionCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-1',
          status: 'TRIAL',
          startedAt: expect.any(Date),
          currentPeriodEnd: expect.any(Date),
        }),
      });
      const call = subscriptionCreate.mock.calls[0][0].data;
      expect(call.currentPeriodEnd.getTime() - call.startedAt.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('avec planCode=standard : vérifie le plan en base puis crée une Subscription AWAITING_PAYMENT, sans aucune période d\'essai', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      prisma.plan.findUnique.mockResolvedValue({ id: 'plan-standard', code: 'standard', isActive: true, price: 5000 });

      await authService.register({
        email: 'owner@demo.com',
        password: 'Password123!',
        firstName: 'Demo',
        lastName: 'Owner',
        planCode: 'standard',
      });

      expect(prisma.plan.findUnique).toHaveBeenCalledWith({ where: { code: 'standard' } });
      expect(subscriptionCreate).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          planId: 'plan-standard',
          status: 'AWAITING_PAYMENT',
        },
      });
    });

    it('avec planCode=pro : vérifie le plan en base puis crée une Subscription AWAITING_PAYMENT, sans aucune période d\'essai', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      prisma.plan.findUnique.mockResolvedValue({ id: 'plan-pro', code: 'pro', isActive: true, price: 10000 });

      await authService.register({
        email: 'owner@demo.com',
        password: 'Password123!',
        firstName: 'Demo',
        lastName: 'Owner',
        planCode: 'pro',
      });

      expect(subscriptionCreate).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          planId: 'plan-pro',
          status: 'AWAITING_PAYMENT',
        },
      });
    });

    it("lève une NotFoundException et ne crée rien si planCode ne correspond à aucune offre (jamais confiance au frontend)", async () => {
      usersService.findByEmail.mockResolvedValue(null);
      prisma.plan.findUnique.mockResolvedValue(null);

      await expect(
        authService.register({
          email: 'owner@demo.com',
          password: 'Password123!',
          firstName: 'Demo',
          lastName: 'Owner',
          planCode: 'inexistant',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('lève une NotFoundException si le plan existe mais est inactif', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      prisma.plan.findUnique.mockResolvedValue({ id: 'plan-old', code: 'starter', isActive: false });

      await expect(
        authService.register({
          email: 'owner@demo.com',
          password: 'Password123!',
          firstName: 'Demo',
          lastName: 'Owner',
          planCode: 'starter',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("lève une ConflictException si l'email existe déjà", async () => {
      usersService.findByEmail.mockResolvedValue(fakeUser);

      await expect(
        authService.register({
          organizationName: 'Boutique',
          email: 'owner@demo.com',
          password: 'Password123!',
          firstName: 'Demo',
          lastName: 'Owner',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("utilise un nom d'entreprise générique si organizationName est omis (fourni à l'écran d'onboarding suivant)", async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const createOrganization = jest.fn().mockResolvedValue({ id: 'org-1', name: 'Mon entreprise' });
      prisma.$transaction = jest.fn(async (cb) =>
        cb({
          organization: { create: createOrganization },
          user: { create: jest.fn().mockResolvedValue(fakeUser) },
          subscription: { create: jest.fn().mockResolvedValue({}) },
        }),
      );

      await authService.register({
        email: 'owner@demo.com',
        password: 'Password123!',
        firstName: 'Demo',
        lastName: 'Owner',
      });

      expect(createOrganization).toHaveBeenCalledWith({
        data: { name: 'Mon entreprise', onboardingStep: 'company' },
      });
    });
  });

  describe('login', () => {
    it("retourne un challenge (pas de tokens) si les identifiants sont corrects", async () => {
      usersService.findByEmail.mockResolvedValue(fakeUser);

      const result = await authService.login({
        email: 'owner@demo.com',
        password: 'Password123!',
      });

      expect(result.challengeToken).toEqual(expect.any(String));
      expect(result.expiresInSeconds).toBe(600);
      expect(result.resendAvailableInSeconds).toBe(60);
      expect(result).not.toHaveProperty('accessToken');
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
      expect(mailService.sendLoginVerificationCode).toHaveBeenCalledWith(
        fakeUser.email,
        expect.stringMatching(/^\d{6}$/),
      );
    });

    it('invalide toute vérification de connexion encore active pour cet utilisateur avant d\'en créer une nouvelle', async () => {
      usersService.findByEmail.mockResolvedValue(fakeUser);

      await authService.login({ email: 'owner@demo.com', password: 'Password123!' });

      expect(prisma.loginVerification.updateMany).toHaveBeenCalledWith({
        where: { userId: fakeUser.id, usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
    });

    it('lève une UnauthorizedException si le mot de passe est incorrect (comportement inchangé)', async () => {
      usersService.findByEmail.mockResolvedValue(fakeUser);

      await expect(
        authService.login({ email: 'owner@demo.com', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.loginVerification.create).not.toHaveBeenCalled();
    });

    it("lève une UnauthorizedException si l'utilisateur n'existe pas (comportement inchangé)", async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'unknown@demo.com', password: 'Password123!' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("un échec du service de messagerie (ex: fournisseur indisponible) ne doit ni faire planter login() ni finaliser une session : le challenge est créé normalement, mais sans aucun token émis", async () => {
      usersService.findByEmail.mockResolvedValue(fakeUser);
      mailService.sendLoginVerificationCode.mockRejectedValueOnce(
        new Error('Service de messagerie indisponible'),
      );

      // MailService#send() avale déjà ses propres erreurs réseau en
      // production (voir mail.service.ts) ; ce test vérifie en plus que
      // AuthService lui-même ne dépend d'aucune façon du succès de l'envoi
      // pour construire le challenge — même si l'appel rejette malgré tout
      // (bug futur dans MailService, timeout non catché...), aucune session
      // ne doit jamais être émise à la place.
      await expect(
        authService.login({ email: 'owner@demo.com', password: 'Password123!' }),
      ).rejects.toThrow('Service de messagerie indisponible');
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
      expect(prisma.loginVerification.create).toHaveBeenCalled();
    });
  });

  describe('verifyLoginCode', () => {
    const now = new Date();
    function freshVerification(overrides: Record<string, unknown> = {}) {
      return {
        id: 'verif-1',
        userId: fakeUser.id,
        challengeToken: 'challenge-1',
        codeHash: hashCode('123456'),
        attempts: 0,
        createdAt: now,
        lastSentAt: now,
        expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
        usedAt: null,
        ...overrides,
      };
    }

    it('émet une vraie session si le code est correct', async () => {
      const verification = freshVerification();
      prisma.loginVerification.findUnique.mockResolvedValue(verification);
      prisma.loginVerification.updateMany.mockResolvedValue({ count: 1 });
      prisma.loginVerification.findUniqueOrThrow.mockResolvedValue({ ...verification, attempts: 1 });
      usersService.findById.mockResolvedValue(fakeUser);

      const result = await authService.verifyLoginCode({
        challengeToken: 'challenge-1',
        code: '123456',
      });

      expect(result.user).toEqual(fakeUser);
      expect(result.tokens.accessToken).toBe('signed-token');
      expect(prisma.refreshToken.create).toHaveBeenCalled();
      // La consommation finale utilise bien la garde usedAt:null (anti-double-usage).
      expect(prisma.loginVerification.updateMany).toHaveBeenLastCalledWith({
        where: { id: verification.id, usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
    });

    it('LOGIN_CHALLENGE_INVALID si le challengeToken est introuvable', async () => {
      prisma.loginVerification.findUnique.mockResolvedValue(null);

      await expect(
        authService.verifyLoginCode({ challengeToken: 'inconnu', code: '123456' }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'LOGIN_CHALLENGE_INVALID' }),
      });
    });

    it('LOGIN_CHALLENGE_INVALID si la vérification a déjà été utilisée', async () => {
      prisma.loginVerification.findUnique.mockResolvedValue(
        freshVerification({ usedAt: new Date() }),
      );

      await expect(
        authService.verifyLoginCode({ challengeToken: 'challenge-1', code: '123456' }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'LOGIN_CHALLENGE_INVALID' }),
      });
    });

    it('LOGIN_CODE_EXPIRED si le code a expiré', async () => {
      prisma.loginVerification.findUnique.mockResolvedValue(
        freshVerification({ expiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(
        authService.verifyLoginCode({ challengeToken: 'challenge-1', code: '123456' }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'LOGIN_CODE_EXPIRED' }),
      });
      expect(prisma.loginVerification.update).toHaveBeenCalledWith({
        where: { id: 'verif-1' },
        data: { usedAt: expect.any(Date) },
      });
    });

    it('LOGIN_CODE_MAX_ATTEMPTS si la réservation atomique de tentative échoue (limite déjà atteinte)', async () => {
      prisma.loginVerification.findUnique.mockResolvedValue(freshVerification({ attempts: 5 }));
      prisma.loginVerification.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        authService.verifyLoginCode({ challengeToken: 'challenge-1', code: '123456' }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'LOGIN_CODE_MAX_ATTEMPTS' }),
      });
      // La garde atomique porte bien sur usedAt:null ET attempts < MAX.
      expect(prisma.loginVerification.updateMany).toHaveBeenCalledWith({
        where: { id: 'verif-1', usedAt: null, attempts: { lt: 5 } },
        data: { attempts: { increment: 1 } },
      });
    });

    it('LOGIN_CODE_INVALID avec le nombre de tentatives restantes si le code est incorrect', async () => {
      const verification = freshVerification();
      prisma.loginVerification.findUnique.mockResolvedValue(verification);
      prisma.loginVerification.updateMany.mockResolvedValue({ count: 1 });
      prisma.loginVerification.findUniqueOrThrow.mockResolvedValue({ ...verification, attempts: 2 });

      await expect(
        authService.verifyLoginCode({ challengeToken: 'challenge-1', code: '000000' }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'LOGIN_CODE_INVALID',
          message: expect.stringContaining('3'),
        }),
      });
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it('LOGIN_CHALLENGE_INVALID si la consommation finale perd la course (déjà consommé par une autre requête concurrente)', async () => {
      const verification = freshVerification();
      prisma.loginVerification.findUnique.mockResolvedValue(verification);
      // 1er updateMany (réservation de tentative) réussit, 2e (consommation) échoue.
      prisma.loginVerification.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });
      prisma.loginVerification.findUniqueOrThrow.mockResolvedValue({ ...verification, attempts: 1 });

      await expect(
        authService.verifyLoginCode({ challengeToken: 'challenge-1', code: '123456' }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'LOGIN_CHALLENGE_INVALID' }),
      });
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });
  });

  describe('resendLoginCode', () => {
    const now = new Date();
    function activeVerification(overrides: Record<string, unknown> = {}) {
      return {
        id: 'verif-1',
        userId: fakeUser.id,
        challengeToken: 'challenge-1',
        codeHash: hashCode('123456'),
        attempts: 2,
        createdAt: now,
        lastSentAt: new Date(now.getTime() - 61 * 1000),
        expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
        usedAt: null,
        ...overrides,
      };
    }

    it('régénère un code et réinitialise le compteur de tentatives après le délai de cooldown', async () => {
      prisma.loginVerification.findUnique.mockResolvedValue(activeVerification());
      usersService.findById.mockResolvedValue(fakeUser);

      const result = await authService.resendLoginCode({ challengeToken: 'challenge-1' });

      expect(result.challengeToken).toBe('challenge-1');
      expect(prisma.loginVerification.update).toHaveBeenCalledWith({
        where: { id: 'verif-1' },
        data: {
          codeHash: expect.any(String),
          attempts: 0,
          lastSentAt: expect.any(Date),
          expiresAt: expect.any(Date),
        },
      });
      expect(mailService.sendLoginVerificationCode).toHaveBeenCalledWith(
        fakeUser.email,
        expect.stringMatching(/^\d{6}$/),
      );
    });

    it('refuse (LOGIN_CODE_RESEND_TOO_SOON, 429) un renvoi trop rapproché', async () => {
      prisma.loginVerification.findUnique.mockResolvedValue(
        activeVerification({ lastSentAt: new Date() }),
      );

      const error: unknown = await authService
        .resendLoginCode({ challengeToken: 'challenge-1' })
        .catch((e) => e);

      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
      expect((error as HttpException).getResponse()).toMatchObject({
        code: 'LOGIN_CODE_RESEND_TOO_SOON',
      });
      expect(prisma.loginVerification.update).not.toHaveBeenCalled();
    });

    it('LOGIN_CHALLENGE_INVALID si le challengeToken est introuvable/déjà utilisé/expiré', async () => {
      prisma.loginVerification.findUnique.mockResolvedValue(null);

      await expect(
        authService.resendLoginCode({ challengeToken: 'inconnu' }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'LOGIN_CHALLENGE_INVALID' }),
      });
    });

    it("LOGIN_CHALLENGE_INVALID au-delà du plafond de vie absolu (30 min), même avec un cooldown respecté", async () => {
      prisma.loginVerification.findUnique.mockResolvedValue(
        activeVerification({ createdAt: new Date(Date.now() - 31 * 60 * 1000) }),
      );

      await expect(
        authService.resendLoginCode({ challengeToken: 'challenge-1' }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'LOGIN_CHALLENGE_INVALID' }),
      });
      // La ligne est tuée (usedAt) pour ne pas rester indéfiniment renvoyable.
      expect(prisma.loginVerification.update).toHaveBeenCalledWith({
        where: { id: 'verif-1' },
        data: { usedAt: expect.any(Date) },
      });
    });
  });

  describe('demoLogin', () => {
    const baseConfig: Record<string, string> = {
      JWT_ACCESS_SECRET: 'access-secret',
      JWT_REFRESH_SECRET: 'refresh-secret',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
    };

    it("lève une NotFoundException si DEMO_MODE_ENABLED n'est pas 'true'", async () => {
      configService.get.mockImplementation((key: string) => baseConfig[key]);

      await expect(authService.demoLogin()).rejects.toBeInstanceOf(NotFoundException);
      expect(usersService.findByEmail).not.toHaveBeenCalled();
    });

    it("lève une NotFoundException si le compte démo n'existe pas", async () => {
      configService.get.mockImplementation((key: string) =>
        key === 'DEMO_MODE_ENABLED' ? 'true' : baseConfig[key],
      );
      usersService.findByEmail.mockResolvedValue(null);

      await expect(authService.demoLogin()).rejects.toBeInstanceOf(NotFoundException);
    });

    it('retourne des tokens pour le compte démo (owner@demo.com par défaut) quand activé', async () => {
      configService.get.mockImplementation((key: string) =>
        key === 'DEMO_MODE_ENABLED' ? 'true' : baseConfig[key],
      );
      usersService.findByEmail.mockResolvedValue(fakeUser);

      const result = await authService.demoLogin();

      expect(usersService.findByEmail).toHaveBeenCalledWith('owner@demo.com');
      expect(result.user).toEqual(fakeUser);
      expect(result.tokens.accessToken).toBe('signed-token');
    });

    it('utilise DEMO_USER_EMAIL si configuré au lieu du défaut', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'DEMO_MODE_ENABLED') return 'true';
        if (key === 'DEMO_USER_EMAIL') return 'custom-demo@example.com';
        return baseConfig[key];
      });
      usersService.findByEmail.mockResolvedValue(fakeUser);

      await authService.demoLogin();

      expect(usersService.findByEmail).toHaveBeenCalledWith('custom-demo@example.com');
    });

    it('retombe sur le défaut si DEMO_USER_EMAIL est une chaîne vide (valeur laissée en blanc dans .env)', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'DEMO_MODE_ENABLED') return 'true';
        if (key === 'DEMO_USER_EMAIL') return '';
        return baseConfig[key];
      });
      usersService.findByEmail.mockResolvedValue(fakeUser);

      await authService.demoLogin();

      expect(usersService.findByEmail).toHaveBeenCalledWith('owner@demo.com');
    });
  });

  describe('forgotPassword', () => {
    it('crée un token de réinitialisation si le compte existe', async () => {
      usersService.findByEmail.mockResolvedValue(fakeUser);

      await authService.forgotPassword({ email: 'owner@demo.com' });

      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: fakeUser.id }) }),
      );
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        fakeUser.email,
        expect.stringContaining('/reset-password?token='),
      );
    });

    it("ne lève aucune erreur et ne crée/n'envoie rien si l'email n'existe pas (pas d'énumération de comptes)", async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(authService.forgotPassword({ email: 'inconnu@demo.com' })).resolves.toBeUndefined();
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const validToken = {
      id: 'reset-1',
      userId: fakeUser.id,
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      usedAt: null,
      createdAt: new Date(),
    };

    it('met à jour le mot de passe et révoque les sessions actives si le token est valide', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(validToken);

      await authService.resetPassword({ token: 'valid-token', password: 'NouveauMotDePasse123!' });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: fakeUser.id } }),
      );
      expect(prisma.passwordResetToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: validToken.id }, data: { usedAt: expect.any(Date) } }),
      );
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: fakeUser.id, revoked: false },
        data: { revoked: true },
      });
    });

    it('lève une NotFoundException si le token est introuvable', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        authService.resetPassword({ token: 'inconnu', password: 'NouveauMotDePasse123!' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lève une NotFoundException si le token est expiré', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        ...validToken,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        authService.resetPassword({ token: 'valid-token', password: 'NouveauMotDePasse123!' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lève une NotFoundException si le token a déjà été utilisé', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({ ...validToken, usedAt: new Date() });

      await expect(
        authService.resetPassword({ token: 'valid-token', password: 'NouveauMotDePasse123!' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('verifyEmail', () => {
    const validToken = {
      id: 'verif-1',
      userId: fakeUser.id,
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      usedAt: null,
      createdAt: new Date(),
    };

    it("marque l'email comme vérifié si le token est valide", async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue(validToken);

      await authService.verifyEmail({ token: 'valid-token' });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: fakeUser.id },
          data: { emailVerifiedAt: expect.any(Date) },
        }),
      );
      expect(prisma.emailVerificationToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: validToken.id }, data: { usedAt: expect.any(Date) } }),
      );
    });

    it('lève une NotFoundException si le token est introuvable', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue(null);

      await expect(authService.verifyEmail({ token: 'inconnu' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lève une NotFoundException si le token est expiré', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        ...validToken,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(authService.verifyEmail({ token: 'valid-token' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lève une NotFoundException si le token a déjà été utilisé', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue({ ...validToken, usedAt: new Date() });

      await expect(authService.verifyEmail({ token: 'valid-token' })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('resendVerificationEmail', () => {
    it("renvoie un email si le compte n'est pas encore vérifié", async () => {
      usersService.findById.mockResolvedValue({ ...fakeUser, emailVerifiedAt: null });

      await authService.resendVerificationEmail(fakeUser.id);

      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        fakeUser.email,
        expect.stringContaining('/verify-email?token='),
      );
    });

    it('ne fait rien si le compte est déjà vérifié', async () => {
      usersService.findById.mockResolvedValue({ ...fakeUser, emailVerifiedAt: new Date() });

      await authService.resendVerificationEmail(fakeUser.id);

      expect(mailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });
});
