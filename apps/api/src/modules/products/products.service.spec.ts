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
      },
    };

    productsService = new ProductsService(prisma as unknown as PrismaService);
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
  });
});
