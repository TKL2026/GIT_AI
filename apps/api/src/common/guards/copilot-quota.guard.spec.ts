import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CopilotQuotaService } from '../entitlements/copilot-quota.service';
import { CopilotUserQuotaService } from '../entitlements/copilot-user-quota.service';
import { AuthenticatedUser } from '../types/authenticated-user.interface';
import { CopilotQuotaGuard } from './copilot-quota.guard';

function buildContext(user: AuthenticatedUser | undefined): { context: ExecutionContext; user: AuthenticatedUser | undefined } {
  const context = {
    getHandler: () => 'handler',
    getClass: () => 'class',
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
  return { context, user };
}

describe('CopilotQuotaGuard', () => {
  let prisma: { subscription: { findUnique: jest.Mock } };
  let copilotQuotaService: { consumeOne: jest.Mock };
  let copilotUserQuotaService: { consumeOne: jest.Mock };
  let guard: CopilotQuotaGuard;

  const fakeUser = (): AuthenticatedUser => ({
    userId: 'user-1',
    email: 'a@b.com',
    role: 'OWNER' as AuthenticatedUser['role'],
    organizationId: 'org-1',
  });

  beforeEach(() => {
    prisma = { subscription: { findUnique: jest.fn() } };
    copilotQuotaService = { consumeOne: jest.fn() };
    copilotUserQuotaService = { consumeOne: jest.fn() };
    guard = new CopilotQuotaGuard(
      prisma as unknown as PrismaService,
      copilotQuotaService as unknown as CopilotQuotaService,
      copilotUserQuotaService as unknown as CopilotUserQuotaService,
    );
  });

  it('laisse passer une route @Public() (pas de request.user) sans consulter le quota', async () => {
    const { context } = buildContext(undefined);
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(prisma.subscription.findUnique).not.toHaveBeenCalled();
  });

  describe('organisation ACTIVE/TRIAL/sans abonnement — dispatch inchangé vers le quota par organisation', () => {
    it.each(['ACTIVE', 'TRIAL', null])('status=%s : consomme via CopilotQuotaService, pas CopilotUserQuotaService', async (status) => {
      prisma.subscription.findUnique.mockResolvedValue(status ? { status } : null);
      copilotQuotaService.consumeOne.mockResolvedValue({ allowed: true, limit: 500 });
      const { context, user } = buildContext(fakeUser());

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(copilotQuotaService.consumeOne).toHaveBeenCalledWith('org-1');
      expect(copilotUserQuotaService.consumeOne).not.toHaveBeenCalled();
      expect(user?.copilotQuotaMechanism).toBe('org');
    });

    it('bloque (403, code COPILOT_QUOTA_EXCEEDED) quand le quota par organisation est atteint', async () => {
      prisma.subscription.findUnique.mockResolvedValue({ status: 'ACTIVE' });
      copilotQuotaService.consumeOne.mockResolvedValue({ allowed: false, limit: 500 });
      const { context } = buildContext(fakeUser());

      await expect(guard.canActivate(context)).rejects.toMatchObject({
        constructor: ForbiddenException,
        response: { code: 'COPILOT_QUOTA_EXCEEDED' },
      });
    });
  });

  describe('organisation LAUNCH_PROGRAM — dispatch vers le quota par utilisateur', () => {
    it('consomme via CopilotUserQuotaService(userId), pas CopilotQuotaService', async () => {
      prisma.subscription.findUnique.mockResolvedValue({ status: 'LAUNCH_PROGRAM' });
      copilotUserQuotaService.consumeOne.mockResolvedValue({ allowed: true, limit: 700 });
      const { context, user } = buildContext(fakeUser());

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(copilotUserQuotaService.consumeOne).toHaveBeenCalledWith('user-1');
      expect(copilotQuotaService.consumeOne).not.toHaveBeenCalled();
      expect(user?.copilotQuotaMechanism).toBe('per-user');
    });

    it('bloque (403, code COPILOT_QUOTA_EXCEEDED) quand le quota par utilisateur est atteint', async () => {
      prisma.subscription.findUnique.mockResolvedValue({ status: 'LAUNCH_PROGRAM' });
      copilotUserQuotaService.consumeOne.mockResolvedValue({ allowed: false, limit: 700 });
      const { context } = buildContext(fakeUser());

      await expect(guard.canActivate(context)).rejects.toMatchObject({
        constructor: ForbiddenException,
        response: { code: 'COPILOT_QUOTA_EXCEEDED' },
      });
    });
  });
});
