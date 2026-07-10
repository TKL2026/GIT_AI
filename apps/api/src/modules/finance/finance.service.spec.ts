import { PrismaService } from '../../prisma/prisma.service';
import { FinanceService } from './finance.service';

describe('FinanceService', () => {
  let financeService: FinanceService;
  let prisma: {
    sale: { findMany: jest.Mock };
    expense: { findMany: jest.Mock };
    saleItem: { findMany: jest.Mock };
  };

  const organizationId = 'org-1';

  beforeEach(() => {
    prisma = {
      sale: { findMany: jest.fn() },
      expense: { findMany: jest.fn() },
      saleItem: { findMany: jest.fn() },
    };

    financeService = new FinanceService(prisma as unknown as PrismaService);
  });

  describe('getSummary', () => {
    it('calcule revenu, dépenses, COGS, marge brute et bénéfice net', async () => {
      prisma.sale.findMany.mockResolvedValue([{ totalAmount: 100000 }, { totalAmount: 50000 }]);
      prisma.expense.findMany.mockResolvedValue([{ amount: 20000 }]);
      prisma.saleItem.findMany.mockResolvedValue([
        { quantity: 2, product: { purchasePrice: 10000 } },
        { quantity: 3, product: { purchasePrice: 5000 } },
      ]);

      const summary = await financeService.getSummary(organizationId);

      expect(summary).toEqual({
        totalRevenue: 150000,
        totalExpenses: 20000,
        totalCogs: 35000,
        grossMargin: 115000,
        netProfit: 95000,
        salesCount: 2,
      });
    });
  });

  describe('getProductsProfitability', () => {
    it('regroupe par produit et trie par marge estimée décroissante', async () => {
      prisma.saleItem.findMany.mockResolvedValue([
        {
          productId: 'p1',
          productName: 'Riz',
          quantity: 2,
          lineTotal: 30000,
          product: { purchasePrice: 10000 },
        },
        {
          productId: 'p1',
          productName: 'Riz',
          quantity: 1,
          lineTotal: 15000,
          product: { purchasePrice: 10000 },
        },
        {
          productId: 'p2',
          productName: 'Huile',
          quantity: 3,
          lineTotal: 24000,
          product: { purchasePrice: 5000 },
        },
      ]);

      const result = await financeService.getProductsProfitability(organizationId);

      expect(result).toEqual([
        {
          productId: 'p1',
          productName: 'Riz',
          quantitySold: 3,
          totalRevenue: 45000,
          estimatedCost: 30000,
          estimatedMargin: 15000,
        },
        {
          productId: 'p2',
          productName: 'Huile',
          quantitySold: 3,
          totalRevenue: 24000,
          estimatedCost: 15000,
          estimatedMargin: 9000,
        },
      ]);
    });
  });
});
