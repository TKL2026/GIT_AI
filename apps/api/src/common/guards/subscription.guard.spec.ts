import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionGuard } from './subscription.guard';

function buildContext(user: Record<string, unknown> | undefined, skip = false): ExecutionContext {
  return {
    getHandler: () => (skip ? 'skip-handler' : 'handler'),
    getClass: () => 'class',
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('SubscriptionGuard', () => {
  let prisma: { subscription: { findUnique: jest.Mock; updateMany: jest.Mock } };
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: SubscriptionGuard;

  const fakeUser = { userId: 'user-1', email: 'a@b.com', role: 'OWNER', organizationId: 'org-1' };

  beforeEach(() => {
    prisma = {
      subscription: {
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    guard = new SubscriptionGuard(reflector as unknown as Reflector, prisma as any);
  });

  it('laisse passer une route @SkipSubscriptionCheck() sans même lire la base', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const result = await guard.canActivate(buildContext(fakeUser));
    expect(result).toBe(true);
    expect(prisma.subscription.findUnique).not.toHaveBeenCalled();
  });

  it('laisse passer une route @Public() (pas de request.user)', async () => {
    const result = await guard.canActivate(buildContext(undefined));
    expect(result).toBe(true);
    expect(prisma.subscription.findUnique).not.toHaveBeenCalled();
  });

  it("laisse passer quand aucune ligne Subscription n'existe (accès libre, ex: compte démo)", async () => {
    prisma.subscription.findUnique.mockResolvedValue(null);
    const result = await guard.canActivate(buildContext(fakeUser));
    expect(result).toBe(true);
  });

  it('laisse passer un essai TRIAL encore valide (currentPeriodEnd dans le futur)', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      id: 'sub-1',
      status: 'TRIAL',
      currentPeriodEnd: new Date(Date.now() + 60_000),
    });
    const result = await guard.canActivate(buildContext(fakeUser));
    expect(result).toBe(true);
    expect(prisma.subscription.updateMany).not.toHaveBeenCalled();
  });

  it('laisse passer un abonnement ACTIVE', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      id: 'sub-1',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    });
    const result = await guard.canActivate(buildContext(fakeUser));
    expect(result).toBe(true);
  });

  it('bloque (403, code SUBSCRIPTION_EXPIRED) un essai TRIAL dont currentPeriodEnd est passé', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      id: 'sub-1',
      status: 'TRIAL',
      currentPeriodEnd: new Date(Date.now() - 1000),
    });

    await expect(guard.canActivate(buildContext(fakeUser))).rejects.toMatchObject({
      constructor: ForbiddenException,
      response: { code: 'SUBSCRIPTION_EXPIRED' },
    });
  });

  it('auto-guérit TRIAL -> EXPIRED en base (compare-and-swap) quand l’essai est expiré', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      id: 'sub-1',
      status: 'TRIAL',
      currentPeriodEnd: new Date(Date.now() - 1000),
    });

    await expect(guard.canActivate(buildContext(fakeUser))).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
      where: { id: 'sub-1', status: 'TRIAL' },
      data: { status: 'EXPIRED' },
    });
  });

  it('bloque un abonnement déjà EXPIRED sans retenter d’auto-guérison (déjà dans cet état)', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      id: 'sub-1',
      status: 'EXPIRED',
      currentPeriodEnd: new Date(Date.now() - 1000),
    });

    await expect(guard.canActivate(buildContext(fakeUser))).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.subscription.updateMany).not.toHaveBeenCalled();
  });

  it('bloque (403, code SUBSCRIPTION_EXPIRED) une offre payante choisie a l\'inscription jamais payee (AWAITING_PAYMENT)', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      id: 'sub-1',
      status: 'AWAITING_PAYMENT',
      currentPeriodEnd: null,
    });

    await expect(guard.canActivate(buildContext(fakeUser))).rejects.toMatchObject({
      constructor: ForbiddenException,
      response: { code: 'SUBSCRIPTION_EXPIRED' },
    });
  });

  it('n\'auto-guerit jamais AWAITING_PAYMENT (aucun essai n\'a jamais ete accorde, rien a faire expirer)', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      id: 'sub-1',
      status: 'AWAITING_PAYMENT',
      currentPeriodEnd: null,
    });

    await expect(guard.canActivate(buildContext(fakeUser))).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.subscription.updateMany).not.toHaveBeenCalled();
  });

  it('laisse passer une fois la Subscription repassee a ACTIVE apres paiement confirme (ne bloque plus, meme organisation)', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      id: 'sub-1',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    });

    const result = await guard.canActivate(buildContext(fakeUser));
    expect(result).toBe(true);
  });
});
