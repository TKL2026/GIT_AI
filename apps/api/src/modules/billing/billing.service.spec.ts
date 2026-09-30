import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CamPayService } from '../campay/campay.service';
import { BillingService } from './billing.service';

describe('BillingService', () => {
  let billingService: BillingService;
  let prisma: {
    plan: { findUnique: jest.Mock };
    subscription: { findUnique: jest.Mock; upsert: jest.Mock };
    paymentTransaction: {
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let camPayService: { collect: jest.Mock; getTransactionStatus: jest.Mock };

  const organizationId = 'org-1';
  const otherOrganizationId = 'org-2';

  const starterPlan = {
    id: 'plan-starter',
    code: 'starter',
    name: 'Starter',
    price: 5000,
    currency: 'XAF',
    period: 'MONTHLY' as const,
    features: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const baseTransaction = {
    id: 'txn-1',
    organizationId,
    planId: starterPlan.id,
    subscriptionId: null,
    amount: 5000,
    currency: 'XAF',
    provider: 'CAMPAY' as const,
    operator: 'MTN' as const,
    phoneNumber: '237670000000',
    status: 'PENDING' as const,
    externalReference: 'uge_ref-1',
    providerReference: 'campay-ref-1',
    providerStatusRaw: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    paidAt: null,
  };

  beforeEach(() => {
    prisma = {
      plan: { findUnique: jest.fn() },
      subscription: { findUnique: jest.fn(), upsert: jest.fn().mockResolvedValue({ id: 'sub-1' }) },
      paymentTransaction: {
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    camPayService = {
      collect: jest.fn(),
      getTransactionStatus: jest.fn(),
    };

    billingService = new BillingService(
      prisma as unknown as PrismaService,
      camPayService as unknown as CamPayService,
    );
  });

  describe('checkout', () => {
    it('crée une transaction PENDING avec le VRAI prix du plan, jamais un montant fourni par le client', async () => {
      prisma.plan.findUnique.mockResolvedValue(starterPlan);
      prisma.paymentTransaction.create.mockResolvedValue({ ...baseTransaction, providerReference: null });
      camPayService.collect.mockResolvedValue({ reference: 'campay-ref-1', ussdCode: '*126#', operator: 'MTN' });

      const result = await billingService.checkout(organizationId, {
        planId: starterPlan.id,
        operator: 'MTN',
        phoneNumber: '670000000',
      });

      expect(prisma.paymentTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId,
            planId: starterPlan.id,
            amount: starterPlan.price,
            currency: starterPlan.currency,
            phoneNumber: '237670000000',
            status: 'PENDING',
          }),
        }),
      );
      expect(camPayService.collect).toHaveBeenCalledWith(
        expect.objectContaining({ amount: starterPlan.price, currency: starterPlan.currency, from: '237670000000' }),
      );
      expect(result.ussdCode).toBe('*126#');
      expect(result.status).toBe('PENDING');
    });

    it('lève une NotFoundException si le plan est introuvable', async () => {
      prisma.plan.findUnique.mockResolvedValue(null);

      await expect(
        billingService.checkout(organizationId, { planId: 'inconnu', operator: 'MTN', phoneNumber: '670000000' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.paymentTransaction.create).not.toHaveBeenCalled();
    });

    it('lève une NotFoundException si le plan est inactif', async () => {
      prisma.plan.findUnique.mockResolvedValue({ ...starterPlan, isActive: false });

      await expect(
        billingService.checkout(organizationId, { planId: starterPlan.id, operator: 'MTN', phoneNumber: '670000000' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('marque la transaction FAILED si l’appel CamPay échoue', async () => {
      prisma.plan.findUnique.mockResolvedValue(starterPlan);
      prisma.paymentTransaction.create.mockResolvedValue({ ...baseTransaction, providerReference: null });
      camPayService.collect.mockRejectedValue(new Error('CamPay indisponible'));

      await expect(
        billingService.checkout(organizationId, { planId: starterPlan.id, operator: 'MTN', phoneNumber: '670000000' }),
      ).rejects.toThrow('CamPay indisponible');

      expect(prisma.paymentTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }),
      );
    });
  });

  describe('applyPaymentResult', () => {
    function pendingTransactionWith(overrides: Partial<Record<string, unknown>> = {}) {
      return { ...baseTransaction, plan: starterPlan, ...overrides };
    }

    it('ignore un événement pour une external_reference inconnue', async () => {
      prisma.paymentTransaction.findUnique.mockResolvedValue(null);

      await billingService.applyPaymentResult({
        reference: 'campay-ref-1',
        externalReference: 'inconnue',
        status: 'SUCCESSFUL',
        amount: 5000,
        currency: 'XAF',
      });

      expect(prisma.paymentTransaction.updateMany).not.toHaveBeenCalled();
      expect(prisma.subscription.upsert).not.toHaveBeenCalled();
    });

    it('ignore un webhook dupliqué (transaction déjà SUCCESS) — idempotence', async () => {
      prisma.paymentTransaction.findUnique.mockResolvedValue(pendingTransactionWith({ status: 'SUCCESS' }));

      await billingService.applyPaymentResult({
        reference: 'campay-ref-1',
        externalReference: baseTransaction.externalReference,
        status: 'SUCCESSFUL',
        amount: 5000,
        currency: 'XAF',
      });

      expect(prisma.paymentTransaction.updateMany).not.toHaveBeenCalled();
      expect(prisma.subscription.upsert).not.toHaveBeenCalled();
    });

    it('paiement déjà traité (FAILED) : un second événement ne le retraite pas', async () => {
      prisma.paymentTransaction.findUnique.mockResolvedValue(pendingTransactionWith({ status: 'FAILED' }));

      await billingService.applyPaymentResult({
        reference: 'campay-ref-1',
        externalReference: baseTransaction.externalReference,
        status: 'SUCCESSFUL',
        amount: 5000,
        currency: 'XAF',
      });

      expect(prisma.paymentTransaction.updateMany).not.toHaveBeenCalled();
    });

    it('rejette (FAILED) si le montant ne correspond pas, sans activer d’abonnement', async () => {
      prisma.paymentTransaction.findUnique.mockResolvedValue(pendingTransactionWith());

      await billingService.applyPaymentResult({
        reference: 'campay-ref-1',
        externalReference: baseTransaction.externalReference,
        status: 'SUCCESSFUL',
        amount: 999999,
        currency: 'XAF',
      });

      expect(prisma.paymentTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED', providerStatusRaw: 'mismatch' }) }),
      );
      expect(prisma.subscription.upsert).not.toHaveBeenCalled();
    });

    it('rejette (FAILED) si la devise ne correspond pas', async () => {
      prisma.paymentTransaction.findUnique.mockResolvedValue(pendingTransactionWith());

      await billingService.applyPaymentResult({
        reference: 'campay-ref-1',
        externalReference: baseTransaction.externalReference,
        status: 'SUCCESSFUL',
        amount: 5000,
        currency: 'EUR',
      });

      expect(prisma.paymentTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED', providerStatusRaw: 'mismatch' }) }),
      );
      expect(prisma.subscription.upsert).not.toHaveBeenCalled();
    });

    it('active un nouvel abonnement ACTIVE quand le paiement est confirmé (SUCCESSFUL)', async () => {
      prisma.paymentTransaction.findUnique.mockResolvedValue(pendingTransactionWith());
      prisma.subscription.findUnique.mockResolvedValue(null);

      await billingService.applyPaymentResult({
        reference: 'campay-ref-1',
        externalReference: baseTransaction.externalReference,
        status: 'SUCCESSFUL',
        amount: 5000,
        currency: 'XAF',
      });

      expect(prisma.paymentTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'SUCCESS', paidAt: expect.any(Date) }) }),
      );
      expect(prisma.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId },
          create: expect.objectContaining({ status: 'ACTIVE', planId: starterPlan.id }),
        }),
      );
    });

    it('marque FAILED sans activer d’abonnement quand CamPay renvoie un échec', async () => {
      prisma.paymentTransaction.findUnique.mockResolvedValue(pendingTransactionWith());

      await billingService.applyPaymentResult({
        reference: 'campay-ref-1',
        externalReference: baseTransaction.externalReference,
        status: 'FAILED',
        amount: 5000,
        currency: 'XAF',
      });

      expect(prisma.paymentTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED', paidAt: null }) }),
      );
      expect(prisma.subscription.upsert).not.toHaveBeenCalled();
    });

    it('renouvellement : prolonge depuis la fin de période actuelle, sans écraser une période déjà payée', async () => {
      prisma.paymentTransaction.findUnique.mockResolvedValue(pendingTransactionWith());
      const futurePeriodEnd = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // dans 10 jours
      prisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        organizationId,
        status: 'ACTIVE',
        currentPeriodEnd: futurePeriodEnd,
        startedAt: new Date('2026-01-01'),
      });

      await billingService.applyPaymentResult({
        reference: 'campay-ref-1',
        externalReference: baseTransaction.externalReference,
        status: 'SUCCESSFUL',
        amount: 5000,
        currency: 'XAF',
      });

      const call = prisma.subscription.upsert.mock.calls[0][0];
      const newPeriodEnd = call.update.currentPeriodEnd as Date;
      // La nouvelle échéance doit partir de futurePeriodEnd (+ ~30 jours), pas de maintenant.
      const expectedMin = new Date(futurePeriodEnd.getTime() + 29 * 24 * 60 * 60 * 1000);
      expect(newPeriodEnd.getTime()).toBeGreaterThan(expectedMin.getTime());
    });

    it('après expiration : un nouveau paiement repart de maintenant, pas de l’ancienne échéance passée', async () => {
      prisma.paymentTransaction.findUnique.mockResolvedValue(pendingTransactionWith());
      const pastPeriodEnd = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // il y a 10 jours
      prisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        organizationId,
        status: 'EXPIRED',
        currentPeriodEnd: pastPeriodEnd,
        startedAt: new Date('2026-01-01'),
      });

      const before = Date.now();
      await billingService.applyPaymentResult({
        reference: 'campay-ref-1',
        externalReference: baseTransaction.externalReference,
        status: 'SUCCESSFUL',
        amount: 5000,
        currency: 'XAF',
      });

      const call = prisma.subscription.upsert.mock.calls[0][0];
      const newPeriodEnd = call.update.currentPeriodEnd as Date;
      // Repart d'environ "maintenant + 30 jours", pas de pastPeriodEnd + 30 jours.
      expect(newPeriodEnd.getTime()).toBeGreaterThan(before + 29 * 24 * 60 * 60 * 1000);
    });
  });

  describe('getTransactionForOrganization', () => {
    it('lève une NotFoundException si la transaction n’existe pas', async () => {
      prisma.paymentTransaction.findFirst.mockResolvedValue(null);

      await expect(
        billingService.getTransactionForOrganization(organizationId, 'inconnue'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('isolation multi-tenant : une transaction d’une autre organisation est introuvable', async () => {
      // findFirst filtre déjà par organizationId — on simule ici le cas où
      // la transaction existe mais appartient à otherOrganizationId : le
      // filtre where empêche findFirst de la retourner.
      prisma.paymentTransaction.findFirst.mockImplementation(({ where }) =>
        where.organizationId === otherOrganizationId ? { ...baseTransaction, organizationId: otherOrganizationId } : null,
      );

      await expect(
        billingService.getTransactionForOrganization(organizationId, baseTransaction.externalReference),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('ne revérifie pas auprès de CamPay si la transaction est déjà finalisée', async () => {
      prisma.paymentTransaction.findFirst.mockResolvedValue({ ...baseTransaction, status: 'SUCCESS' });

      const result = await billingService.getTransactionForOrganization(organizationId, baseTransaction.externalReference);

      expect(camPayService.getTransactionStatus).not.toHaveBeenCalled();
      expect(result.status).toBe('SUCCESS');
    });

    it('revérifie activement auprès de CamPay si encore PENDING (filet de sécurité)', async () => {
      prisma.paymentTransaction.findFirst.mockResolvedValue(pendingTxnForReconciliation());
      prisma.paymentTransaction.findUnique
        .mockResolvedValueOnce({ ...baseTransaction, plan: starterPlan }) // lu par applyPaymentResult
        .mockResolvedValueOnce({ ...baseTransaction, status: 'SUCCESS' }); // relu après traitement
      prisma.subscription.findUnique.mockResolvedValue(null);
      camPayService.getTransactionStatus.mockResolvedValue({
        reference: 'campay-ref-1',
        status: 'SUCCESSFUL',
        amount: '5000',
        currency: 'XAF',
        operator: 'MTN',
        operatorReference: null,
      });

      const result = await billingService.getTransactionForOrganization(organizationId, baseTransaction.externalReference);

      expect(camPayService.getTransactionStatus).toHaveBeenCalledWith('campay-ref-1');
      expect(result.status).toBe('SUCCESS');
    });

    function pendingTxnForReconciliation() {
      return { ...baseTransaction, status: 'PENDING', providerReference: 'campay-ref-1' };
    }
  });
});
