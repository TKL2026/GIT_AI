import { ForecastService } from '../forecast/forecast.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PurchasingService } from './purchasing.service';

describe('PurchasingService', () => {
  const organizationId = 'org-1';

  let prisma: { purchaseOrderItem: { findMany: jest.Mock } };
  let forecastService: { getReplenishmentForecast: jest.Mock };
  let purchasingService: PurchasingService;

  beforeEach(() => {
    prisma = { purchaseOrderItem: { findMany: jest.fn().mockResolvedValue([]) } };
    forecastService = { getReplenishmentForecast: jest.fn().mockResolvedValue([]) };
    purchasingService = new PurchasingService(
      prisma as unknown as PrismaService,
      forecastService as unknown as ForecastService,
    );
  });

  it('recommande le fournisseur historique quand un seul existe', async () => {
    forecastService.getReplenishmentForecast.mockResolvedValue([
      { productId: 'p1', productName: 'Riz', currentStock: 5, averageDailySales: 1, daysUntilStockout: 5, recommendedReorderQuantity: 30 },
    ]);
    prisma.purchaseOrderItem.findMany.mockResolvedValue([
      {
        productId: 'p1',
        unitCost: 1000,
        purchaseOrder: { createdAt: new Date('2026-07-01'), supplier: { id: 'sup-1', name: 'Fournisseur A' } },
      },
    ]);

    const [result] = await purchasingService.getPurchaseRecommendations(organizationId);

    expect(result.recommendedSupplierId).toBe('sup-1');
    expect(result.recommendedSupplierName).toBe('Fournisseur A');
    expect(result.lastUnitCost).toBe(1000);
    expect(result.hasSupplierHistory).toBe(true);
    expect(result.alternativeSupplierCount).toBe(0);
  });

  it('recommande le fournisseur le moins cher parmi plusieurs', async () => {
    forecastService.getReplenishmentForecast.mockResolvedValue([
      { productId: 'p1', productName: 'Riz', currentStock: 5, averageDailySales: 1, daysUntilStockout: 5, recommendedReorderQuantity: 30 },
    ]);
    prisma.purchaseOrderItem.findMany.mockResolvedValue([
      {
        productId: 'p1',
        unitCost: 1200,
        purchaseOrder: { createdAt: new Date('2026-07-05'), supplier: { id: 'sup-cher', name: 'Fournisseur Cher' } },
      },
      {
        productId: 'p1',
        unitCost: 900,
        purchaseOrder: { createdAt: new Date('2026-07-01'), supplier: { id: 'sup-pascher', name: 'Fournisseur Pas Cher' } },
      },
    ]);

    const [result] = await purchasingService.getPurchaseRecommendations(organizationId);

    expect(result.recommendedSupplierId).toBe('sup-pascher');
    expect(result.alternativeSupplierCount).toBe(1);
  });

  it("signale l'absence d'historique fournisseur plutôt que de deviner", async () => {
    forecastService.getReplenishmentForecast.mockResolvedValue([
      { productId: 'p2', productName: 'Nouveau produit', currentStock: 2, averageDailySales: 1, daysUntilStockout: 2, recommendedReorderQuantity: 20 },
    ]);
    prisma.purchaseOrderItem.findMany.mockResolvedValue([]);

    const [result] = await purchasingService.getPurchaseRecommendations(organizationId);

    expect(result.hasSupplierHistory).toBe(false);
    expect(result.recommendedSupplierId).toBeNull();
  });

  it('exclut les produits sans besoin de réapprovisionnement', async () => {
    forecastService.getReplenishmentForecast.mockResolvedValue([
      { productId: 'p3', productName: 'Stock ok', currentStock: 100, averageDailySales: 1, daysUntilStockout: 100, recommendedReorderQuantity: 0 },
      { productId: 'p4', productName: 'Sans vente', currentStock: 5, averageDailySales: 0, daysUntilStockout: null, recommendedReorderQuantity: null },
    ]);

    const results = await purchasingService.getPurchaseRecommendations(organizationId);

    expect(results).toHaveLength(0);
    expect(prisma.purchaseOrderItem.findMany).not.toHaveBeenCalled();
  });

  it("trie par urgence croissante", async () => {
    forecastService.getReplenishmentForecast.mockResolvedValue([
      { productId: 'moins-urgent', productName: 'B', currentStock: 40, averageDailySales: 1, daysUntilStockout: 40, recommendedReorderQuantity: 10 },
      { productId: 'urgent', productName: 'A', currentStock: 2, averageDailySales: 1, daysUntilStockout: 2, recommendedReorderQuantity: 10 },
    ]);
    prisma.purchaseOrderItem.findMany.mockResolvedValue([]);

    const results = await purchasingService.getPurchaseRecommendations(organizationId);

    expect(results.map((r) => r.productId)).toEqual(['urgent', 'moins-urgent']);
  });
});
