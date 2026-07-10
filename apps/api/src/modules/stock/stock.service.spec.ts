import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StockMovementType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StockService } from './stock.service';

describe('StockService', () => {
  let stockService: StockService;
  let tx: {
    product: {
      findFirst: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      findFirstOrThrow: jest.Mock;
      findMany: jest.Mock;
    };
    stockMovement: { create: jest.Mock; findMany: jest.Mock };
  };
  let prisma: { $transaction: jest.Mock; product: any; stockMovement: any };

  const organizationId = 'org-1';
  const userId = 'user-1';
  const productId = 'prod-1';

  const baseProduct = {
    id: productId,
    organizationId,
    name: 'Riz 25kg',
    sku: 'RIZ-25KG',
    purchasePrice: 12000,
    salePrice: 15000,
    stockQuantity: 10,
    minStock: 5,
    maxStock: 100,
    createdAt: new Date(),
  };

  beforeEach(() => {
    tx = {
      product: {
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findFirstOrThrow: jest.fn(),
        findMany: jest.fn(),
      },
      stockMovement: { create: jest.fn(), findMany: jest.fn() },
    };

    prisma = {
      $transaction: jest.fn((cb) => cb(tx)),
      product: tx.product,
      stockMovement: tx.stockMovement,
    };

    stockService = new StockService(prisma as unknown as PrismaService);
  });

  describe('recordIn', () => {
    it('incrémente le stock et crée un mouvement IN', async () => {
      tx.product.findFirst.mockResolvedValue(baseProduct);
      tx.product.update.mockResolvedValue({ ...baseProduct, stockQuantity: 30 });
      tx.stockMovement.create.mockResolvedValue({});

      await stockService.recordIn(organizationId, userId, { productId, quantity: 20 });

      expect(tx.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: { stockQuantity: { increment: 20 } },
      });
      expect(tx.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: StockMovementType.IN,
          quantity: 20,
          previousQuantity: 10,
          newQuantity: 30,
        }),
      });
    });

    it('lève une NotFoundException si le produit n’existe pas', async () => {
      tx.product.findFirst.mockResolvedValue(null);

      await expect(
        stockService.recordIn(organizationId, userId, { productId, quantity: 20 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('recordOut', () => {
    it('décrémente le stock si suffisant et crée un mouvement OUT', async () => {
      tx.product.updateMany.mockResolvedValue({ count: 1 });
      tx.product.findFirstOrThrow.mockResolvedValue({ ...baseProduct, stockQuantity: 5 });
      tx.stockMovement.create.mockResolvedValue({});

      await stockService.recordOut(organizationId, userId, { productId, quantity: 5 });

      expect(tx.product.updateMany).toHaveBeenCalledWith({
        where: { id: productId, organizationId, stockQuantity: { gte: 5 } },
        data: { stockQuantity: { decrement: 5 } },
      });
      expect(tx.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: StockMovementType.OUT,
          quantity: 5,
          previousQuantity: 10,
          newQuantity: 5,
        }),
      });
    });

    it('lève une BadRequestException si le stock est insuffisant', async () => {
      tx.product.updateMany.mockResolvedValue({ count: 0 });
      tx.product.findFirst.mockResolvedValue(baseProduct);

      await expect(
        stockService.recordOut(organizationId, userId, { productId, quantity: 999 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lève une NotFoundException si le produit n’existe pas', async () => {
      tx.product.updateMany.mockResolvedValue({ count: 0 });
      tx.product.findFirst.mockResolvedValue(null);

      await expect(
        stockService.recordOut(organizationId, userId, { productId, quantity: 1 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('recordAdjustment', () => {
    it('calcule le delta correctement et exige une raison', async () => {
      tx.product.findFirst.mockResolvedValue(baseProduct);
      tx.product.update.mockResolvedValue({ ...baseProduct, stockQuantity: 7 });
      tx.stockMovement.create.mockResolvedValue({});

      await stockService.recordAdjustment(organizationId, userId, {
        productId,
        newQuantity: 7,
        reason: 'Écart inventaire',
      });

      expect(tx.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: StockMovementType.ADJUSTMENT,
          quantity: -3,
          previousQuantity: 10,
          newQuantity: 7,
          reason: 'Écart inventaire',
        }),
      });
    });
  });

  describe('findAlerts', () => {
    it('ne retourne que les produits sous leur seuil minimum', async () => {
      prisma.product.findMany = jest.fn().mockResolvedValue([
        { ...baseProduct, id: 'p1', stockQuantity: 2, minStock: 5 },
        { ...baseProduct, id: 'p2', stockQuantity: 20, minStock: 5 },
      ]);

      const result = await stockService.findAlerts(organizationId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p1');
    });
  });
});
