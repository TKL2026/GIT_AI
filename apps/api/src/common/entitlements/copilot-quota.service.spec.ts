import { PrismaService } from '../../prisma/prisma.service';
import { CopilotQuotaService, TRIAL_COPILOT_QUOTA } from './copilot-quota.service';

describe('CopilotQuotaService', () => {
  let service: CopilotQuotaService;
  let prisma: { subscription: { findUnique: jest.Mock; updateMany: jest.Mock } };

  const organizationId = 'org-1';

  beforeEach(() => {
    prisma = {
      subscription: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    service = new CopilotQuotaService(prisma as unknown as PrismaService);
  });

  describe('getQuota', () => {
    it("renvoie null (illimité) quand aucune Subscription n'existe (accès libre historique, ex: compte démo)", async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);
      await expect(service.getQuota(organizationId)).resolves.toBeNull();
    });

    it('renvoie le quota fixe TRIAL_COPILOT_QUOTA pendant un essai, peu importe le plan', async () => {
      prisma.subscription.findUnique.mockResolvedValue({ status: 'TRIAL', plan: null });
      await expect(service.getQuota(organizationId)).resolves.toBe(TRIAL_COPILOT_QUOTA);
    });

    it('ACTIVE + plan Standard : renvoie copilotQuota du plan (500)', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        status: 'ACTIVE',
        plan: { features: { maxUsers: 5, features: [], copilotQuota: 500 } },
      });
      await expect(service.getQuota(organizationId)).resolves.toBe(500);
    });

    it('ACTIVE + plan Pro : renvoie copilotQuota du plan (1500)', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        status: 'ACTIVE',
        plan: { features: { maxUsers: null, features: [], copilotQuota: 1500 } },
      });
      await expect(service.getQuota(organizationId)).resolves.toBe(1500);
    });

    it.each(['AWAITING_PAYMENT', 'TRIAL_EXPIRED', 'EXPIRED', 'PAST_DUE', 'CANCELLED'])(
      'renvoie 0 par défaut sûr pour le statut %s (ne devrait normalement jamais être atteint, SubscriptionGuard bloque avant)',
      async (status) => {
        prisma.subscription.findUnique.mockResolvedValue({ status, plan: null });
        await expect(service.getQuota(organizationId)).resolves.toBe(0);
      },
    );
  });

  describe('consumeOne', () => {
    it('autorise sans écriture en base quand le quota est illimité (pas de Subscription)', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);

      const result = await service.consumeOne(organizationId);

      expect(result).toEqual({ allowed: true, limit: null });
      expect(prisma.subscription.updateMany).not.toHaveBeenCalled();
    });

    it('autorise et incrémente de façon atomique quand il reste du quota (CAS)', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        status: 'ACTIVE',
        plan: { features: { maxUsers: 5, features: [], copilotQuota: 500 } },
      });
      prisma.subscription.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.consumeOne(organizationId);

      expect(result).toEqual({ allowed: true, limit: 500 });
      expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
        where: { organizationId, copilotRequestsUsed: { lt: 500 } },
        data: { copilotRequestsUsed: { increment: 1 } },
      });
    });

    it('refuse quand le quota est déjà atteint (updateMany ne touche aucune ligne)', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        status: 'ACTIVE',
        plan: { features: { maxUsers: 5, features: [], copilotQuota: 500 } },
      });
      prisma.subscription.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.consumeOne(organizationId);

      expect(result).toEqual({ allowed: false, limit: 500 });
    });

    it('refuse pour un statut à quota 0 (ex: TRIAL_EXPIRED) sans jamais pouvoir incrémenter (lt: 0 ne matche aucune ligne)', async () => {
      prisma.subscription.findUnique.mockResolvedValue({ status: 'TRIAL_EXPIRED', plan: null });
      prisma.subscription.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.consumeOne(organizationId);

      expect(result).toEqual({ allowed: false, limit: 0 });
      expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
        where: { organizationId, copilotRequestsUsed: { lt: 0 } },
        data: { copilotRequestsUsed: { increment: 1 } },
      });
    });
  });
});
