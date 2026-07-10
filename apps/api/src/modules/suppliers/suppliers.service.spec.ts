import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SuppliersService } from './suppliers.service';

describe('SuppliersService', () => {
  let suppliersService: SuppliersService;
  let prisma: {
    supplier: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const organizationId = 'org-1';

  beforeEach(() => {
    prisma = {
      supplier: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    suppliersService = new SuppliersService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('crée un fournisseur rattaché à l’organisation', async () => {
      prisma.supplier.create.mockResolvedValue({ id: 'sup-1', name: 'Grossiste Alpha' });

      await suppliersService.create(organizationId, { name: 'Grossiste Alpha' });

      expect(prisma.supplier.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ organizationId, name: 'Grossiste Alpha' }),
      });
    });
  });

  describe('findOne', () => {
    it('lève une NotFoundException si le fournisseur n’existe pas dans cette organisation', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);

      await expect(suppliersService.findOne(organizationId, 'missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('lève une NotFoundException si le fournisseur n’existe pas avant de mettre à jour', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);

      await expect(
        suppliersService.update(organizationId, 'missing-id', { name: 'Nouveau nom' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.supplier.update).not.toHaveBeenCalled();
    });
  });
});
