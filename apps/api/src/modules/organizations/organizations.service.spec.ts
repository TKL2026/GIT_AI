import { PrismaService } from '../../prisma/prisma.service';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsService', () => {
  let organizationsService: OrganizationsService;
  let prisma: { organization: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock } };

  const organizationId = 'org-1';

  beforeEach(() => {
    prisma = {
      organization: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    organizationsService = new OrganizationsService(prisma as unknown as PrismaService);
  });

  describe('update', () => {
    it('transmet uniquement les champs fournis (mise à jour incrémentale par écran)', async () => {
      prisma.organization.update.mockResolvedValue({ id: organizationId, country: 'Cameroun' });

      await organizationsService.update(organizationId, { country: 'Cameroun' });

      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: organizationId },
        data: { country: 'Cameroun' },
      });
    });
  });

  describe('completeOnboarding', () => {
    it('fixe onboardingStep à "done" et horodate onboardingCompletedAt', async () => {
      prisma.organization.update.mockResolvedValue({ id: organizationId });

      await organizationsService.completeOnboarding(organizationId);

      const call = prisma.organization.update.mock.calls[0][0];
      expect(call.where).toEqual({ id: organizationId });
      expect(call.data.onboardingStep).toBe('done');
      expect(call.data.onboardingCompletedAt).toBeInstanceOf(Date);
    });
  });
});
