import { PrismaService } from '../../prisma/prisma.service';
import { ForecastService } from './forecast.service';

describe('ForecastService', () => {
  const organizationId = 'org-1';

  let prisma: {
    product: { findMany: jest.Mock };
    saleItem: { findMany: jest.Mock };
  };
  let forecastService: ForecastService;

  beforeEach(() => {
    prisma = {
      product: { findMany: jest.fn() },
      saleItem: { findMany: jest.fn() },
    };
    forecastService = new ForecastService(prisma as unknown as PrismaService);
  });

  it('calcule un jours-avant-rupture et une quantité recommandée pour un produit avec des ventes régulières', async () => {
    // 60 unités vendues sur 30 jours => 2/jour ; stock 20 => 10 jours avant rupture
    // recommandé = 2*30 - 20 = 40
    prisma.product.findMany.mockResolvedValue([
      { id: 'prod-1', name: 'Riz 25kg', stockQuantity: 20 },
    ]);
    prisma.saleItem.findMany.mockResolvedValue([{ productId: 'prod-1', quantity: 60 }]);

    const [result] = await forecastService.getReplenishmentForecast(organizationId);

    expect(result.averageDailySales).toBe(2);
    expect(result.daysUntilStockout).toBe(10);
    expect(result.recommendedReorderQuantity).toBe(40);
  });

  it("renvoie null pour un produit sans vente récente (impossible à estimer)", async () => {
    prisma.product.findMany.mockResolvedValue([
      { id: 'prod-2', name: 'Produit dormant', stockQuantity: 5 },
    ]);
    prisma.saleItem.findMany.mockResolvedValue([]);

    const [result] = await forecastService.getReplenishmentForecast(organizationId);

    expect(result.averageDailySales).toBe(0);
    expect(result.daysUntilStockout).toBeNull();
    expect(result.recommendedReorderQuantity).toBeNull();
  });

  it('ne recommande aucun réapprovisionnement si le stock couvre déjà la période cible', async () => {
    // 30 unités sur 30 jours => 1/jour ; stock 100 largement suffisant pour 30 jours
    prisma.product.findMany.mockResolvedValue([
      { id: 'prod-3', name: 'Stock confortable', stockQuantity: 100 },
    ]);
    prisma.saleItem.findMany.mockResolvedValue([{ productId: 'prod-3', quantity: 30 }]);

    const [result] = await forecastService.getReplenishmentForecast(organizationId);

    expect(result.recommendedReorderQuantity).toBe(0);
  });

  it('trie les résultats par urgence croissante, produits sans historique en dernier', async () => {
    prisma.product.findMany.mockResolvedValue([
      { id: 'no-history', name: 'Sans historique', stockQuantity: 5 },
      { id: 'urgent', name: 'Urgent', stockQuantity: 4 },
      { id: 'moins-urgent', name: 'Moins urgent', stockQuantity: 40 },
    ]);
    prisma.saleItem.findMany.mockResolvedValue([
      { productId: 'urgent', quantity: 60 }, // 2/jour, stock 4 => 2 jours
      { productId: 'moins-urgent', quantity: 30 }, // 1/jour, stock 40 => 40 jours
    ]);

    const results = await forecastService.getReplenishmentForecast(organizationId);

    expect(results.map((r) => r.productId)).toEqual(['urgent', 'moins-urgent', 'no-history']);
  });
});
