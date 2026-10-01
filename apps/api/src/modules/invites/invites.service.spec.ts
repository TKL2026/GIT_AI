import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { InvitesService } from './invites.service';

describe('InvitesService', () => {
  let invitesService: InvitesService;
  let prisma: {
    $transaction: jest.Mock;
    pendingInvite: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    user: { findUnique: jest.Mock; create: jest.Mock; count: jest.Mock };
    subscription: { findUnique: jest.Mock };
  };
  let authService: { issueTokens: jest.Mock };
  let mailService: { sendInviteEmail: jest.Mock };
  let configService: { get: jest.Mock };

  const organizationId = 'org-1';
  const invitedByUserId = 'user-owner';

  const baseInvite = {
    id: 'invite-1',
    organizationId,
    email: 'collegue@example.com',
    role: Role.CASHIER,
    token: 'a-token',
    invitedByUserId,
    createdAt: new Date(),
    acceptedAt: null as Date | null,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    organization: { name: 'Boutique Test' },
  };

  /** Le tx passé au callback $transaction reprend les mêmes mocks que
   * `prisma` (create/accept lisent et écrivent sur les mêmes tables) — évite
   * de dupliquer les attentes selon qu'on est dans une transaction ou non. */
  function buildTx() {
    return {
      subscription: prisma.subscription,
      user: { ...prisma.user, create: jest.fn().mockResolvedValue({ id: 'new-user', email: baseInvite.email }) },
      pendingInvite: { ...prisma.pendingInvite, update: jest.fn().mockResolvedValue({}) },
    };
  }

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(async (cb) => cb(buildTx())),
      pendingInvite: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      user: { findUnique: jest.fn(), create: jest.fn(), count: jest.fn().mockResolvedValue(0) },
      subscription: { findUnique: jest.fn().mockResolvedValue(null) },
    };

    authService = {
      issueTokens: jest.fn().mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' }),
    };

    mailService = {
      sendInviteEmail: jest.fn().mockResolvedValue(undefined),
    };

    configService = {
      get: jest.fn((key: string) => (key === 'CORS_ORIGIN' ? 'http://localhost:5173' : undefined)),
    };

    invitesService = new InvitesService(
      prisma as unknown as PrismaService,
      authService as unknown as AuthService,
      mailService as unknown as MailService,
      configService as unknown as ConfigService,
    );
  });

  describe('create', () => {
    it("crée une invitation avec un token et une expiration future, rattachée à l'organisation de l'appelant", async () => {
      prisma.pendingInvite.create.mockResolvedValue(baseInvite);

      await invitesService.create(organizationId, invitedByUserId, {
        email: 'collegue@example.com',
        role: Role.CASHIER,
      });

      const call = prisma.pendingInvite.create.mock.calls[0][0];
      expect(call.data.organizationId).toBe(organizationId);
      expect(call.data.invitedByUserId).toBe(invitedByUserId);
      expect(call.data.email).toBe('collegue@example.com');
      expect(call.data.role).toBe(Role.CASHIER);
      expect(typeof call.data.token).toBe('string');
      expect(call.data.token.length).toBeGreaterThan(0);
      expect(call.data.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(mailService.sendInviteEmail).toHaveBeenCalledWith(
        baseInvite.email,
        expect.stringContaining(`/accept-invite/${baseInvite.token}`),
        baseInvite.organization.name,
      );
    });

    it("n'applique aucune limite quand l'organisation n'a pas d'abonnement (accès libre historique)", async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);
      prisma.user.count.mockResolvedValue(999);
      prisma.pendingInvite.count.mockResolvedValue(999);
      prisma.pendingInvite.create.mockResolvedValue(baseInvite);

      await expect(
        invitesService.create(organizationId, invitedByUserId, { email: 'x@example.com', role: Role.CASHIER }),
      ).resolves.toBeDefined();
    });

    it("n'applique aucune limite pendant l'essai (TRIAL = niveau Pro complet)", async () => {
      prisma.subscription.findUnique.mockResolvedValue({ status: 'TRIAL', plan: null });
      prisma.user.count.mockResolvedValue(999);
      prisma.pendingInvite.create.mockResolvedValue(baseInvite);

      await expect(
        invitesService.create(organizationId, invitedByUserId, { email: 'x@example.com', role: Role.CASHIER }),
      ).resolves.toBeDefined();
    });

    it('Standard (maxUsers=5) : autorise une invitation quand 4 utilisateurs + 0 invitation en attente', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        status: 'ACTIVE',
        plan: { features: { maxUsers: 5, features: [] } },
      });
      prisma.user.count.mockResolvedValue(4);
      prisma.pendingInvite.count.mockResolvedValue(0);
      prisma.pendingInvite.create.mockResolvedValue(baseInvite);

      await expect(
        invitesService.create(organizationId, invitedByUserId, { email: 'x@example.com', role: Role.CASHIER }),
      ).resolves.toBeDefined();
      expect(prisma.pendingInvite.create).toHaveBeenCalled();
    });

    it('Standard (maxUsers=5) : refuse (403, SEAT_LIMIT_REACHED) une invitation quand 4 utilisateurs + 1 invitation en attente atteignent déjà 5', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        status: 'ACTIVE',
        plan: { features: { maxUsers: 5, features: [] } },
      });
      prisma.user.count.mockResolvedValue(4);
      prisma.pendingInvite.count.mockResolvedValue(1);

      await expect(
        invitesService.create(organizationId, invitedByUserId, { email: 'x@example.com', role: Role.CASHIER }),
      ).rejects.toMatchObject({
        constructor: ForbiddenException,
        response: { code: 'SEAT_LIMIT_REACHED' },
      });
      expect(prisma.pendingInvite.create).not.toHaveBeenCalled();
      expect(mailService.sendInviteEmail).not.toHaveBeenCalled();
    });

    it('Pro (maxUsers=null) : jamais limité, même avec beaucoup d’utilisateurs existants', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        status: 'ACTIVE',
        plan: { features: { maxUsers: null, features: [] } },
      });
      prisma.user.count.mockResolvedValue(500);
      prisma.pendingInvite.count.mockResolvedValue(50);
      prisma.pendingInvite.create.mockResolvedValue(baseInvite);

      await expect(
        invitesService.create(organizationId, invitedByUserId, { email: 'x@example.com', role: Role.CASHIER }),
      ).resolves.toBeDefined();
    });

    it('retente automatiquement une fois en cas de conflit de sérialisation (P2034) puis réussit', async () => {
      const conflictError = Object.assign(
        Object.create(Prisma.PrismaClientKnownRequestError.prototype),
        { code: 'P2034', message: 'conflict' },
      );
      let call = 0;
      prisma.$transaction = jest.fn(async (cb) => {
        call += 1;
        if (call === 1) throw conflictError;
        return cb(buildTx());
      });
      prisma.subscription.findUnique.mockResolvedValue(null);
      prisma.pendingInvite.create.mockResolvedValue(baseInvite);

      await expect(
        invitesService.create(organizationId, invitedByUserId, { email: 'x@example.com', role: Role.CASHIER }),
      ).resolves.toBeDefined();
      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    });
  });

  describe('findValidByToken', () => {
    it("lève une NotFoundException si le token n'existe pas", async () => {
      prisma.pendingInvite.findUnique.mockResolvedValue(null);
      await expect(invitesService.findValidByToken('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lève une NotFoundException si l’invitation est déjà acceptée', async () => {
      prisma.pendingInvite.findUnique.mockResolvedValue({ ...baseInvite, acceptedAt: new Date() });
      await expect(invitesService.findValidByToken('a-token')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lève une NotFoundException si l’invitation est expirée', async () => {
      prisma.pendingInvite.findUnique.mockResolvedValue({
        ...baseInvite,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(invitesService.findValidByToken('a-token')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('retourne l’invitation avec le nom de l’organisation si elle est valide', async () => {
      prisma.pendingInvite.findUnique.mockResolvedValue(baseInvite);
      const result = await invitesService.findValidByToken('a-token');
      expect(result.organization.name).toBe('Boutique Test');
    });
  });

  describe('accept', () => {
    it("lève une ConflictException si un compte existe déjà avec l'email invité", async () => {
      prisma.pendingInvite.findUnique.mockResolvedValue(baseInvite);
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        invitesService.accept('a-token', { firstName: 'A', lastName: 'B', password: 'Password123!' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("crée l'utilisateur avec le rôle et l'organisation de l'invitation, marque l'invitation acceptée, et connecte automatiquement", async () => {
      prisma.pendingInvite.findUnique.mockResolvedValue(baseInvite);
      prisma.user.findUnique.mockResolvedValue(null);

      const createUser = jest.fn().mockResolvedValue({ id: 'new-user', email: baseInvite.email });
      const updateInvite = jest.fn().mockResolvedValue({});
      prisma.$transaction = jest.fn(async (cb) =>
        cb({ user: { create: createUser }, pendingInvite: { update: updateInvite } }),
      );

      const result = await invitesService.accept('a-token', {
        firstName: 'Awa',
        lastName: 'Diallo',
        password: 'Password123!',
      });

      expect(createUser).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: baseInvite.email,
          firstName: 'Awa',
          lastName: 'Diallo',
          role: baseInvite.role,
          organizationId: baseInvite.organizationId,
        }),
      });
      expect(updateInvite).toHaveBeenCalledWith({
        where: { id: baseInvite.id },
        data: expect.objectContaining({ acceptedAt: expect.any(Date) }),
      });
      expect(authService.issueTokens).toHaveBeenCalled();
      expect(result.tokens).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
      expect(result.user.email).toBe(baseInvite.email);
    });
  });
});
