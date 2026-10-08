import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let productsService: ProductsService;
  let prisma: {
    product: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const organizationId = 'org-1';

  beforeEach(() => {
    prisma = {
      product: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    productsService = new ProductsService(prisma as unknown as PrismaService);
  });

  describe('findAll', () => {
    it('BUG-004 : ne renvoie que les produits actifs (masque les produits archivés)', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await productsService.findAll(organizationId);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId, isActive: true } }),
      );
    });
  });

  describe('create', () => {
    it('crée un produit quand le SKU est disponible', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue({
        id: 'prod-1',
        organizationId,
        name: 'Riz 25kg',
        sku: 'RIZ-25KG',
        purchasePrice: 12000,
        salePrice: 15000,
        createdAt: new Date(),
      });

      const result = await productsService.create(organizationId, {
        name: 'Riz 25kg',
        sku: 'RIZ-25KG',
        purchasePrice: 12000,
        salePrice: 15000,
      });

      expect(result.sku).toBe('RIZ-25KG');
      expect(prisma.product.create).toHaveBeenCalled();
    });

    it('lève une ConflictException si le SKU existe déjà pour cette organisation', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        productsService.create(organizationId, {
          name: 'Riz 25kg',
          sku: 'RIZ-25KG',
          purchasePrice: 12000,
          salePrice: 15000,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findOne', () => {
    it('lève une NotFoundException si le produit n’existe pas dans cette organisation', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(productsService.findOne(organizationId, 'missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('BUG-004 : ne filtre pas par isActive (une fiche archivée reste consultable)', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'prod-1', isActive: false });

      const result = await productsService.findOne(organizationId, 'prod-1');

      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: 'prod-1', organizationId },
      });
      expect(result.isActive).toBe(false);
    });
  });

  describe('update', () => {
    it('BUG-004 : met à jour les champs fournis sans toucher au stock', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'prod-1', organizationId });
      prisma.product.update.mockResolvedValue({ id: 'prod-1', name: 'Nouveau nom' });

      await productsService.update(organizationId, 'prod-1', { name: 'Nouveau nom' });

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: expect.objectContaining({ name: 'Nouveau nom' }),
      });
    });

    it('lève une ConflictException si le nouveau SKU est déjà utilisé par un autre produit', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'prod-1', organizationId });
      prisma.product.findUnique.mockResolvedValue({ id: 'prod-2' });

      await expect(
        productsService.update(organizationId, 'prod-1', { sku: 'DEJA-PRIS' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('autorise de garder son propre SKU inchangé', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'prod-1', organizationId });
      prisma.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      prisma.product.update.mockResolvedValue({ id: 'prod-1', sku: 'RIZ-25KG' });

      await expect(
        productsService.update(organizationId, 'prod-1', { sku: 'RIZ-25KG' }),
      ).resolves.toBeDefined();
    });
  });

  describe('archive', () => {
    it('BUG-004 : désactive le produit (isActive=false) sans suppression physique', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'prod-1', organizationId });
      prisma.product.update.mockResolvedValue({ id: 'prod-1', isActive: false });

      await productsService.archive(organizationId, 'prod-1');

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { isActive: false },
      });
    });
  });
});
