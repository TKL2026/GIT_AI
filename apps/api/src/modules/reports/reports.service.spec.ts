import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FinanceService } from '../finance/finance.service';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: {
    organization: { findUnique: jest.Mock };
    sale: { findMany: jest.Mock };
    product: { findMany: jest.Mock };
    stockMovement: { findMany: jest.Mock };
  };
  let financeService: { getSummary: jest.Mock; getProductsProfitability: jest.Mock };

  const organizationId = 'org-1';

  const zeroSummary = {
    totalRevenue: 0,
    totalExpenses: 0,
    totalCogs: 0,
    grossMargin: 0,
    netProfit: 0,
    salesCount: 0,
  };

  beforeEach(() => {
    prisma = {
      organization: { findUnique: jest.fn().mockResolvedValue({ name: 'Boutique Awa' }) },
      sale: { findMany: jest.fn().mockResolvedValue([]) },
      product: { findMany: jest.fn().mockResolvedValue([]) },
      stockMovement: { findMany: jest.fn().mockResolvedValue([]) },
    };
    financeService = {
      getSummary: jest.fn().mockResolvedValue(zeroSummary),
      getProductsProfitability: jest.fn().mockResolvedValue([]),
    };

    service = new ReportsService(
      prisma as unknown as PrismaService,
      financeService as unknown as FinanceService,
    );
  });

  describe('getDailyReport', () => {
    it('lève une NotFoundException si l’organisation n’existe pas', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      await expect(service.getDailyReport(organizationId, '2026-10-18')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('interroge FinanceService avec les bornes Douala du jour demandé', async () => {
      await service.getDailyReport(organizationId, '2026-10-18');

      expect(financeService.getSummary).toHaveBeenCalledWith(
        organizationId,
        '2026-10-17T23:00:00.000Z',
        '2026-10-18T23:00:00.000Z',
      );
    });

    it('hasActivity est faux et les chiffres restent à 0 (pas de fabrication de données) quand aucune vente', async () => {
      const report = await service.getDailyReport(organizationId, '2026-10-18');

      expect(report.hasActivity).toBe(false);
      expect(report.totalRevenue).toBe(0);
      expect(report.salesCount).toBe(0);
    });

    it('hasActivity est vrai dès qu’il y a au moins une vente', async () => {
      financeService.getSummary.mockResolvedValue({ ...zeroSummary, totalRevenue: 5000, salesCount: 1 });

      const report = await service.getDailyReport(organizationId, '2026-10-18');

      expect(report.hasActivity).toBe(true);
    });

    it('plafonne les produits les plus vendus à 5', async () => {
      financeService.getProductsProfitability.mockResolvedValue(
        Array.from({ length: 8 }, (_, i) => ({
          productId: `p${i}`,
          productName: `Produit ${i}`,
          quantitySold: 8 - i,
          totalRevenue: 1000,
          estimatedCost: 500,
          estimatedMargin: 500,
        })),
      );

      const report = await service.getDailyReport(organizationId, '2026-10-18');

      expect(report.topProducts).toHaveLength(5);
    });

    it('mappe les alertes stock avec le bon statut (rupture/stock bas), produits sans aucun mouvement (stock courant fiable)', async () => {
      prisma.product.findMany.mockResolvedValue([
        { id: '1', name: 'Riz', stockQuantity: 0, minStock: 5 },
        { id: '2', name: 'Huile', stockQuantity: 2, minStock: 5 },
      ]);

      const report = await service.getDailyReport(organizationId, '2026-10-18');

      expect(report.stockAlerts).toEqual([
        { productId: '1', productName: 'Riz', stockQuantity: 0, minStock: 5, status: 'out' },
        { productId: '2', productName: 'Huile', stockQuantity: 2, minStock: 5, status: 'low' },
      ]);
    });

    it('utilise la date du jour (Africa/Douala) par défaut quand aucune date n’est fournie', async () => {
      await service.getDailyReport(organizationId);
      expect(financeService.getSummary).toHaveBeenCalled();
    });

    describe('anomalie QA #2 — alertes stock reconstruites à la date du rapport, jamais le stock actuel', () => {
      it("un rapport passé n'affiche jamais une alerte apparue APRÈS la date du rapport (cas exact remonté par le QA)", async () => {
        // Produit sain aujourd'hui (stock courant = 50), mais qui était en
        // stock bas (2) le 18/10 — reconstitué via le seul mouvement connu
        // (un réapprovisionnement le 20/10, APRÈS la date du rapport).
        prisma.product.findMany.mockResolvedValue([
          { id: '1', name: 'Riz', stockQuantity: 50, minStock: 5 },
        ]);
        prisma.stockMovement.findMany.mockResolvedValue([
          {
            productId: '1',
            createdAt: new Date('2026-10-20T10:00:00.000Z'), // après le 18/10
            previousQuantity: 2,
            newQuantity: 50,
          },
        ]);

        const pastReport = await service.getDailyReport(organizationId, '2026-10-18');
        expect(pastReport.stockAlerts).toEqual([
          { productId: '1', productName: 'Riz', stockQuantity: 2, minStock: 5, status: 'low' },
        ]);

        // Un rapport APRÈS le réapprovisionnement ne doit, lui, plus
        // montrer d'alerte — le stock courant (50) est bien sain à cette
        // date-là, pas de régression sur le cas normal.
        const laterReport = await service.getDailyReport(organizationId, '2026-10-25');
        expect(laterReport.stockAlerts).toEqual([]);
      });

      it('utilise le dernier mouvement connu AVANT (pas après) la date demandée', async () => {
        prisma.product.findMany.mockResolvedValue([
          { id: '1', name: 'Riz', stockQuantity: 100, minStock: 5 },
        ]);
        prisma.stockMovement.findMany.mockResolvedValue([
          { productId: '1', createdAt: new Date('2026-10-10T00:00:00.000Z'), previousQuantity: 50, newQuantity: 3 },
          { productId: '1', createdAt: new Date('2026-10-15T00:00:00.000Z'), previousQuantity: 3, newQuantity: 100 },
        ]);

        // Entre les deux mouvements : la quantité était 3 (basse).
        const report = await service.getDailyReport(organizationId, '2026-10-12');
        expect(report.stockAlerts).toEqual([
          { productId: '1', productName: 'Riz', stockQuantity: 3, minStock: 5, status: 'low' },
        ]);
      });

      it("utilise la quantité courante quand le produit n'a jamais eu le moindre mouvement enregistré", async () => {
        prisma.product.findMany.mockResolvedValue([
          { id: '1', name: 'Sucre', stockQuantity: 0, minStock: 5 },
        ]);
        prisma.stockMovement.findMany.mockResolvedValue([]);

        const report = await service.getDailyReport(organizationId, '2026-10-18');
        expect(report.stockAlerts).toEqual([
          { productId: '1', productName: 'Sucre', stockQuantity: 0, minStock: 5, status: 'out' },
        ]);
      });
    });
  });

  describe('getDailyReportsList', () => {
    it('ne fait qu’une seule requête sale.findMany pour toute la plage', async () => {
      await service.getDailyReportsList(organizationId, '2026-10-01', '2026-10-05');
      expect(prisma.sale.findMany).toHaveBeenCalledTimes(1);
    });

    it('produit une ligne par jour, y compris les jours sans vente (zéros réels, pas fabriqués)', async () => {
      const items = await service.getDailyReportsList(organizationId, '2026-10-01', '2026-10-03');

      expect(items).toHaveLength(3);
      expect(items.every((item) => item.totalRevenue === 0 && item.salesCount === 0 && !item.hasActivity)).toBe(
        true,
      );
    });

    it('trie du plus récent au plus ancien', async () => {
      const items = await service.getDailyReportsList(organizationId, '2026-10-01', '2026-10-03');
      expect(items.map((i) => i.date)).toEqual(['2026-10-03', '2026-10-02', '2026-10-01']);
    });

    it('regroupe correctement plusieurs ventes du même jour civil Douala, sans double comptage entre jours', async () => {
      prisma.sale.findMany.mockResolvedValue([
        { createdAt: new Date('2026-10-02T10:00:00.000Z'), totalAmount: 1000 },
        { createdAt: new Date('2026-10-02T12:00:00.000Z'), totalAmount: 2000 },
        // 23h30 UTC le 1er = 00h30 Douala le 2 -> doit compter sur le 2, pas le 1er.
        { createdAt: new Date('2026-10-01T23:30:00.000Z'), totalAmount: 500 },
      ]);

      const items = await service.getDailyReportsList(organizationId, '2026-10-01', '2026-10-02');
      const day1 = items.find((i) => i.date === '2026-10-01')!;
      const day2 = items.find((i) => i.date === '2026-10-02')!;

      expect(day1.totalRevenue).toBe(0);
      expect(day1.salesCount).toBe(0);
      expect(day2.totalRevenue).toBe(3500);
      expect(day2.salesCount).toBe(3);
    });

    it('rejette si from est postérieur à to', async () => {
      await expect(
        service.getDailyReportsList(organizationId, '2026-10-05', '2026-10-01'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejette une plage trop large (> 366 jours)', async () => {
      await expect(
        service.getDailyReportsList(organizationId, '2024-01-01', '2026-10-01'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getMonthlyReport', () => {
    it('interroge FinanceService avec les bornes Douala du mois demandé, en un seul appel (pas de somme de rapports journaliers)', async () => {
      await service.getMonthlyReport(organizationId, '2026-10');

      expect(financeService.getSummary).toHaveBeenCalledTimes(1);
      expect(financeService.getSummary).toHaveBeenCalledWith(
        organizationId,
        '2026-09-30T23:00:00.000Z',
        '2026-10-31T23:00:00.000Z',
      );
    });

    it('formate le libellé du mois en français', async () => {
      const report = await service.getMonthlyReport(organizationId, '2026-10');
      expect(report.monthLabel).toBe('octobre 2026');
    });

    it('lève une NotFoundException si l’organisation n’existe pas', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      await expect(service.getMonthlyReport(organizationId, '2026-10')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
