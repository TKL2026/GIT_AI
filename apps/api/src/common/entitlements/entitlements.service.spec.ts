import { FEATURES, PRO_FEATURES, STANDARD_FEATURES } from '@copilote/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { EntitlementsService } from './entitlements.service';

describe('EntitlementsService', () => {
  let service: EntitlementsService;
  let prisma: { subscription: { findUnique: jest.Mock } };

  const organizationId = 'org-1';

  beforeEach(() => {
    prisma = { subscription: { findUnique: jest.fn() } };
    service = new EntitlementsService(prisma as unknown as PrismaService);
  });

  it("accorde le niveau Pro complet quand aucune Subscription n'existe (accès libre historique, ex: compte démo)", async () => {
    prisma.subscription.findUnique.mockResolvedValue(null);

    const features = await service.getFeatures(organizationId);

    expect([...features].sort()).toEqual([...PRO_FEATURES].sort());
  });

  it('accorde le niveau Pro complet pendant un essai TRIAL (mêmes fonctionnalités que Pro pendant les 48h)', async () => {
    prisma.subscription.findUnique.mockResolvedValue({ status: 'TRIAL', plan: null });

    const features = await service.getFeatures(organizationId);

    expect([...features].sort()).toEqual([...PRO_FEATURES].sort());
    expect(features.has(FEATURES.FORECAST)).toBe(true);
    expect(features.has(FEATURES.WHATSAPP)).toBe(true);
  });

  it('ACTIVE + plan Standard : renvoie exactement les features du plan, ni plus ni moins', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      plan: { features: { maxUsers: 5, features: STANDARD_FEATURES } },
    });

    const features = await service.getFeatures(organizationId);

    expect([...features].sort()).toEqual([...STANDARD_FEATURES].sort());
    expect(features.has(FEATURES.FORECAST)).toBe(false);
    expect(features.has(FEATURES.FRAUD)).toBe(false);
    expect(features.has(FEATURES.COMMERCIAL)).toBe(false);
    expect(features.has(FEATURES.WHATSAPP)).toBe(false);
    expect(features.has(FEATURES.PRODUCTS)).toBe(true);
    expect(features.has(FEATURES.COPILOT_BASIC)).toBe(true);
  });

  it('ACTIVE + plan Pro : renvoie Standard + les fonctionnalités avancées', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      plan: { features: { maxUsers: null, features: PRO_FEATURES } },
    });

    const features = await service.getFeatures(organizationId);

    expect(features.has(FEATURES.FORECAST)).toBe(true);
    expect(features.has(FEATURES.FRAUD)).toBe(true);
    expect(features.has(FEATURES.FINANCE_ADVANCED)).toBe(true);
    expect(features.has(FEATURES.COMMERCIAL)).toBe(true);
    expect(features.has(FEATURES.PURCHASING_AI)).toBe(true);
    expect(features.has(FEATURES.WHATSAPP)).toBe(true);
    // Héritage : Pro a aussi tout Standard.
    expect(features.has(FEATURES.PRODUCTS)).toBe(true);
    expect(features.has(FEATURES.COPILOT_BASIC)).toBe(true);
  });

  it("n'accorde aucune fonctionnalité dans un statut verrouillé (filet de sécurité — ne devrait normalement jamais être atteint, SubscriptionGuard bloque avant)", async () => {
    prisma.subscription.findUnique.mockResolvedValue({ status: 'AWAITING_PAYMENT', plan: null });

    const features = await service.getFeatures(organizationId);

    expect(features.size).toBe(0);
  });

  it('hasFeature délègue correctement à getFeatures', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      plan: { features: { maxUsers: 5, features: STANDARD_FEATURES } },
    });

    await expect(service.hasFeature(organizationId, FEATURES.PRODUCTS)).resolves.toBe(true);
    await expect(service.hasFeature(organizationId, FEATURES.FORECAST)).resolves.toBe(false);
  });

  it('isolation multi-tenant : getFeatures interroge toujours la Subscription de l’organisationId fourni', async () => {
    prisma.subscription.findUnique.mockResolvedValue(null);

    await service.getFeatures('org-A');

    expect(prisma.subscription.findUnique).toHaveBeenCalledWith({
      where: { organizationId: 'org-A' },
      include: { plan: true },
    });
  });
});
