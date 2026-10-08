import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedPlatformAdmin } from '../../common/types/authenticated-platform-admin.interface';
import { AdminAuditLogService } from './admin-audit-log.service';
import { AdminOrganizationsService } from './admin-organizations.service';

describe('AdminOrganizationsService', () => {
  let service: AdminOrganizationsService;
  let prisma: {
    organization: { findMany: jest.Mock; count: jest.Mock; findUnique: jest.Mock };
    subscription: { findUnique: jest.Mock };
    sale: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };
  let auditLogService: { record: jest.Mock };
  let txOrganizationUpdate: jest.Mock;
  let txSubscriptionUpdate: jest.Mock;

  const performedBy: AuthenticatedPlatformAdmin = { platformAdminId: 'admin-1', email: 'admin@uge.pro' };

  beforeEach(() => {
    txOrganizationUpdate = jest.fn().mockResolvedValue({});
    txSubscriptionUpdate = jest.fn().mockResolvedValue({});
    prisma = {
      organization: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn() },
      subscription: { findUnique: jest.fn() },
      sale: { findFirst: jest.fn() },
      $transaction: jest.fn(async (callback: (tx: unknown) => Promise<void>) =>
        callback({
          organization: { update: txOrganizationUpdate },
          subscription: { update: txSubscriptionUpdate },
        }),
      ),
    };
    auditLogService = { record: jest.fn().mockResolvedValue(undefined) };
    service = new AdminOrganizationsService(
      prisma as unknown as PrismaService,
      auditLogService as unknown as AdminAuditLogService,
    );
  });

  describe('suspend', () => {
    it("lève NotFoundException si l'organisation n'existe pas", async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      await expect(service.suspend('org-x', performedBy)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lève ConflictException si déjà suspendue (jamais un double effet silencieux)', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1', suspendedAt: new Date() });
      await expect(service.suspend('org-1', performedBy)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('suspend et journalise dans la même transaction (action + audit atomiques)', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1', suspendedAt: null });

      await service.suspend('org-1', performedBy);

      expect(txOrganizationUpdate).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: { suspendedAt: expect.any(Date) },
      });
      expect(auditLogService.record).toHaveBeenCalledWith(
        {
          platformAdminId: 'admin-1',
          action: 'organization.suspend',
          targetType: 'organization',
          targetId: 'org-1',
        },
        expect.anything(),
      );
    });
  });

  describe('reactivate', () => {
    it("lève ConflictException si l'organisation n'est pas suspendue", async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1', suspendedAt: null });
      await expect(service.reactivate('org-1', performedBy)).rejects.toBeInstanceOf(ConflictException);
    });

    it('réactive (suspendedAt -> null) et journalise', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1', suspendedAt: new Date() });

      await service.reactivate('org-1', performedBy);

      expect(txOrganizationUpdate).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: { suspendedAt: null },
      });
      expect(auditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'organization.reactivate', targetId: 'org-1' }),
        expect.anything(),
      );
    });
  });

  describe('extendTrial', () => {
    it("lève NotFoundException si l'organisation n'a pas d'abonnement", async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);
      await expect(service.extendTrial('org-1', 7, performedBy)).rejects.toBeInstanceOf(NotFoundException);
    });

    it("refuse si l'abonnement n'est ni TRIAL ni TRIAL_EXPIRED (ex: ACTIVE)", async () => {
      prisma.subscription.findUnique.mockResolvedValue({ status: 'ACTIVE', currentPeriodEnd: new Date() });
      await expect(service.extendTrial('org-1', 7, performedBy)).rejects.toBeInstanceOf(ConflictException);
    });

    it('prolonge depuis maintenant si le TRIAL est déjà expiré (currentPeriodEnd dans le passé)', async () => {
      const past = new Date(Date.now() - 1000 * 60 * 60 * 24);
      prisma.subscription.findUnique.mockResolvedValue({ status: 'TRIAL_EXPIRED', currentPeriodEnd: past });

      await service.extendTrial('org-1', 7, performedBy);

      const call = txSubscriptionUpdate.mock.calls[0][0];
      expect(call.data.status).toBe('TRIAL');
      const newEnd: Date = call.data.currentPeriodEnd;
      expect(newEnd.getTime()).toBeGreaterThan(Date.now() + 6 * 24 * 60 * 60 * 1000);
    });

    it('prolonge depuis la fin de période existante si le TRIAL est encore valide (ne raccourcit jamais)', async () => {
      const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3); // +3 jours
      prisma.subscription.findUnique.mockResolvedValue({ status: 'TRIAL', currentPeriodEnd: future });

      await service.extendTrial('org-1', 7, performedBy);

      const call = txSubscriptionUpdate.mock.calls[0][0];
      const newEnd: Date = call.data.currentPeriodEnd;
      // Doit partir de `future` (+3j) + 7j = +10j, pas de maintenant + 7j.
      expect(newEnd.getTime()).toBe(future.getTime() + 7 * 24 * 60 * 60 * 1000);
      expect(auditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'organization.extend_trial',
          metadata: expect.objectContaining({ days: 7 }),
        }),
        expect.anything(),
      );
    });
  });
});
