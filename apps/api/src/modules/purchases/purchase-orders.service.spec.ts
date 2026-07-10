import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PurchaseOrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StockService } from '../stock/stock.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { PurchaseOrdersService } from './purchase-orders.service';

describe('PurchaseOrdersService', () => {
  let purchaseOrdersService: PurchaseOrdersService;
  let prisma: { $transaction: jest.Mock };
  let suppliersService: { findOne: jest.Mock };
  let stockService: { incrementStockInTransaction: jest.Mock };
  let tx: {
    product: { findFirst: jest.Mock; update: jest.Mock };
    purchaseOrder: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
  };

  const organizationId = 'org-1';
  const userId = 'user-1';
  const supplierId = 'sup-1';

  const product = { id: 'prod-1', name: 'Riz 25kg' };

  const pendingOrder = {
    id: 'order-1',
    organizationId,
    supplierId,
    status: PurchaseOrderStatus.PENDING,
    items: [{ id: 'item-1', productId: product.id, productName: product.name, quantity: 20, unitCost: 11000 }],
    supplier: { id: supplierId, name: 'Grossiste Alpha' },
  };

  beforeEach(() => {
    tx = {
      product: { findFirst: jest.fn(), update: jest.fn() },
      purchaseOrder: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    };

    prisma = { $transaction: jest.fn((cb) => cb(tx)) };
    suppliersService = { findOne: jest.fn().mockResolvedValue({ id: supplierId }) };
    stockService = { incrementStockInTransaction: jest.fn() };

    purchaseOrdersService = new PurchaseOrdersService(
      prisma as unknown as PrismaService,
      suppliersService as unknown as SuppliersService,
      stockService as unknown as StockService,
    );
  });

  describe('create', () => {
    it('calcule le totalAmount et ne touche pas au stock', async () => {
      tx.product.findFirst.mockResolvedValue(product);
      tx.purchaseOrder.create.mockResolvedValue({ id: 'order-1', items: [], supplier: {} });

      await purchaseOrdersService.create(organizationId, userId, {
        supplierId,
        items: [{ productId: product.id, quantity: 20, unitCost: 11000 }],
      });

      expect(suppliersService.findOne).toHaveBeenCalledWith(organizationId, supplierId);
      expect(tx.purchaseOrder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: PurchaseOrderStatus.PENDING,
          totalAmount: 20 * 11000,
        }),
        include: { items: true, supplier: true },
      });
      expect(stockService.incrementStockInTransaction).not.toHaveBeenCalled();
    });

    it('lève une NotFoundException si un produit de la commande n’existe pas', async () => {
      tx.product.findFirst.mockResolvedValue(null);

      await expect(
        purchaseOrdersService.create(organizationId, userId, {
          supplierId,
          items: [{ productId: 'missing', quantity: 1, unitCost: 1000 }],
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('receive', () => {
    it('incrémente le stock, met à jour purchasePrice et passe la commande à RECEIVED', async () => {
      tx.purchaseOrder.findFirst.mockResolvedValue(pendingOrder);
      stockService.incrementStockInTransaction.mockResolvedValue({ product, movement: {} });
      tx.purchaseOrder.update.mockResolvedValue({ ...pendingOrder, status: PurchaseOrderStatus.RECEIVED });

      await purchaseOrdersService.receive(organizationId, userId, pendingOrder.id);

      expect(stockService.incrementStockInTransaction).toHaveBeenCalledWith(tx, {
        organizationId,
        productId: product.id,
        quantity: 20,
        performedByUserId: userId,
        reason: expect.stringContaining(pendingOrder.id),
      });
      expect(tx.product.update).toHaveBeenCalledWith({
        where: { id: product.id },
        data: { purchasePrice: 11000 },
      });
      expect(tx.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: pendingOrder.id },
        data: { status: PurchaseOrderStatus.RECEIVED, receivedAt: expect.any(Date) },
        include: { items: true, supplier: true },
      });
    });

    it('lève une BadRequestException si la commande n’est plus PENDING', async () => {
      tx.purchaseOrder.findFirst.mockResolvedValue({
        ...pendingOrder,
        status: PurchaseOrderStatus.RECEIVED,
      });

      await expect(
        purchaseOrdersService.receive(organizationId, userId, pendingOrder.id),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(stockService.incrementStockInTransaction).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('passe une commande PENDING à CANCELLED', async () => {
      tx.purchaseOrder.findFirst.mockResolvedValue(pendingOrder);
      tx.purchaseOrder.update.mockResolvedValue({ ...pendingOrder, status: PurchaseOrderStatus.CANCELLED });

      await purchaseOrdersService.cancel(organizationId, pendingOrder.id);

      expect(tx.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: pendingOrder.id },
        data: { status: PurchaseOrderStatus.CANCELLED },
        include: { items: true, supplier: true },
      });
    });

    it('lève une BadRequestException si la commande est déjà RECEIVED', async () => {
      tx.purchaseOrder.findFirst.mockResolvedValue({
        ...pendingOrder,
        status: PurchaseOrderStatus.RECEIVED,
      });

      await expect(purchaseOrdersService.cancel(organizationId, pendingOrder.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
