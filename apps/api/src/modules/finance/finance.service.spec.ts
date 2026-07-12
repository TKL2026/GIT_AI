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

  describe('getMonthlyTrend', () => {
    it('calcule les ratios et la croissance mois par mois, du plus ancien au plus récent', async () => {
      // sale.findMany est appelé une fois par mois, dans l'ordre chronologique
      // (ranges.map + Promise.all préservent cet ordre d'appel synchrone).
      const revenuesByMonth = [100000, 150000];
      let callIndex = -1;
      prisma.sale.findMany.mockImplementation(() => {
        callIndex += 1;
        return Promise.resolve([{ totalAmount: revenuesByMonth[callIndex] }]);
      });
      prisma.expense.findMany.mockResolvedValue([]);
      prisma.saleItem.findMany.mockResolvedValue([]);

      const trend = await financeService.getMonthlyTrend(organizationId, 2);

      expect(trend).toHaveLength(2);
      expect(trend[0].month).toMatch(/^\d{4}-\d{2}$/);
      expect(trend[0].totalRevenue).toBe(100000);
      expect(trend[1].totalRevenue).toBe(150000);
      expect(trend[0].revenueGrowthRatio).toBeNull();
      expect(trend[1].revenueGrowthRatio).toBeCloseTo(0.5);
      expect(trend[0].grossMarginRatio).toBe(1); // pas de COGS/dépenses mockées
      expect(trend[0].netMarginRatio).toBe(1);
    });

    it('renvoie des ratios null quand le chiffre d’affaires du mois est nul', async () => {
      prisma.sale.findMany.mockResolvedValue([]);
      prisma.expense.findMany.mockResolvedValue([]);
      prisma.saleItem.findMany.mockResolvedValue([]);

      const [month] = await financeService.getMonthlyTrend(organizationId, 1);

      expect(month.totalRevenue).toBe(0);
      expect(month.grossMarginRatio).toBeNull();
      expect(month.netMarginRatio).toBeNull();
      expect(month.revenueGrowthRatio).toBeNull();
    });

    it('renvoie une croissance nulle si le mois précédent avait un CA de zéro', async () => {
      const revenuesByMonth = [0, 50000];
      let callIndex = -1;
      prisma.sale.findMany.mockImplementation(() => {
        callIndex += 1;
        const amount = revenuesByMonth[callIndex];
        return Promise.resolve(amount > 0 ? [{ totalAmount: amount }] : []);
      });
      prisma.expense.findMany.mockResolvedValue([]);
      prisma.saleItem.findMany.mockResolvedValue([]);

      const trend = await financeService.getMonthlyTrend(organizationId, 2);

      expect(trend[1].totalRevenue).toBe(50000);
      expect(trend[1].revenueGrowthRatio).toBeNull();
    });
  });
});
