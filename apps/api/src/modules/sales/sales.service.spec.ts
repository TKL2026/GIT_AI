import { BadRequestException } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StockService } from '../stock/stock.service';
import { SalesService } from './sales.service';

describe('SalesService', () => {
  let salesService: SalesService;
  let prisma: { $transaction: jest.Mock; sale: { create: jest.Mock } };
  let stockService: { decrementStockInTransaction: jest.Mock };

  const organizationId = 'org-1';
  const userId = 'user-1';

  const productA = {
    id: 'prod-a',
    name: 'Riz 25kg',
    salePrice: 15000,
  };
  const productB = {
    id: 'prod-b',
    name: 'Huile 5L',
    salePrice: 8000,
  };

  beforeEach(() => {
    const saleCreate = jest.fn();
    const tx = { sale: { create: saleCreate } };

    prisma = {
      $transaction: jest.fn((cb) => cb(tx)),
      sale: { create: saleCreate },
    };

    stockService = {
      decrementStockInTransaction: jest.fn(),
    };

    salesService = new SalesService(
      prisma as unknown as PrismaService,
      stockService as unknown as StockService,
    );
  });

  it('calcule le total sur plusieurs lignes et crée la vente avec ses items', async () => {
    stockService.decrementStockInTransaction
      .mockResolvedValueOnce({ product: productA, movement: {} })
      .mockResolvedValueOnce({ product: productB, movement: {} });
    prisma.sale.create.mockResolvedValue({ id: 'sale-1', items: [] });

    await salesService.create(organizationId, userId, {
      paymentMethod: PaymentMethod.CASH,
      items: [
        { productId: productA.id, quantity: 2 },
        { productId: productB.id, quantity: 3 },
      ],
    });

    expect(prisma.sale.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId,
        performedByUserId: userId,
        paymentMethod: PaymentMethod.CASH,
        totalAmount: 2 * 15000 + 3 * 8000,
        items: {
          create: [
            {
              productId: productA.id,
              productName: productA.name,
              quantity: 2,
              unitPrice: 15000,
              lineTotal: 30000,
            },
            {
              productId: productB.id,
              productName: productB.name,
              quantity: 3,
              unitPrice: 8000,
              lineTotal: 24000,
            },
          ],
        },
      }),
      include: { items: true },
    });
  });

  it('propage l’échec si le stock est insuffisant pour une ligne (annule toute la vente)', async () => {
    stockService.decrementStockInTransaction.mockRejectedValue(
      new BadRequestException('Stock insuffisant pour Riz 25kg.'),
    );

    await expect(
      salesService.create(organizationId, userId, {
        paymentMethod: PaymentMethod.CASH,
        items: [{ productId: productA.id, quantity: 999 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.sale.create).not.toHaveBeenCalled();
  });
});
