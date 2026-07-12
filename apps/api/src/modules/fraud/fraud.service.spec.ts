import { PrismaService } from '../../prisma/prisma.service';
import { FraudService } from './fraud.service';

describe('FraudService', () => {
  const organizationId = 'org-1';

  let prisma: {
    product: { findMany: jest.Mock };
    stockMovement: { findMany: jest.Mock };
    saleItem: { findMany: jest.Mock };
  };
  let fraudService: FraudService;

  beforeEach(() => {
    prisma = {
      product: { findMany: jest.fn().mockResolvedValue([{ id: 'prod-1', name: 'Riz 25kg' }]) },
      stockMovement: { findMany: jest.fn().mockResolvedValue([]) },
      saleItem: { findMany: jest.fn().mockResolvedValue([]) },
    };
    fraudService = new FraudService(prisma as unknown as PrismaService);
  });

  it('détecte un ajustement négatif sans motif', async () => {
    prisma.stockMovement.findMany.mockResolvedValue([
      { productId: 'prod-1', performedByUserId: 'user-1', quantity: -5, reason: null },
    ]);

    const [anomaly] = await fraudService.getAnomalies(organizationId);

    expect(anomaly.type).toBe('unexplained_stock_adjustment');
    expect(anomaly.occurrencesCount).toBe(1);
    expect(anomaly.totalImpact).toBe(5);
    expect(anomaly.severity).toBe('medium');
  });

  it('ignore un ajustement négatif avec un motif renseigné', async () => {
    prisma.stockMovement.findMany.mockResolvedValue([
      { productId: 'prod-1', performedByUserId: 'user-1', quantity: -5, reason: 'Produit périmé' },
    ]);

    const anomalies = await fraudService.getAnomalies(organizationId);

    expect(anomalies).toHaveLength(0);
  });

  it('marque en sévérité haute un cumul >= 10 unités', async () => {
    prisma.stockMovement.findMany.mockResolvedValue([
      { productId: 'prod-1', performedByUserId: 'user-1', quantity: -6, reason: '' },
      { productId: 'prod-1', performedByUserId: 'user-1', quantity: -6, reason: '  ' },
    ]);

    const [anomaly] = await fraudService.getAnomalies(organizationId);

    expect(anomaly.occurrencesCount).toBe(2);
    expect(anomaly.totalImpact).toBe(12);
    expect(anomaly.severity).toBe('high');
  });

  it('détecte une vente à un prix nettement inférieur au catalogue (sévérité haute >= 10%)', async () => {
    prisma.saleItem.findMany.mockResolvedValue([
      {
        productId: 'prod-1',
        quantity: 2,
        unitPrice: 8500, // salePrice 10000 => gap 15%
        product: { salePrice: 10000 },
        sale: { performedByUserId: 'user-2' },
      },
    ]);

    const [anomaly] = await fraudService.getAnomalies(organizationId);

    expect(anomaly.type).toBe('below_catalog_price_sale');
    expect(anomaly.severity).toBe('high');
    expect(anomaly.totalImpact).toBe(3000); // (10000-8500)*2
  });

  it('marque en sévérité moyenne un écart de prix entre 5% et 10%', async () => {
    prisma.saleItem.findMany.mockResolvedValue([
      {
        productId: 'prod-1',
        quantity: 1,
        unitPrice: 9300, // gap 7%
        product: { salePrice: 10000 },
        sale: { performedByUserId: 'user-2' },
      },
    ]);

    const [anomaly] = await fraudService.getAnomalies(organizationId);

    expect(anomaly.severity).toBe('medium');
  });

  it('ignore un écart de prix inférieur à 5%', async () => {
    prisma.saleItem.findMany.mockResolvedValue([
      {
        productId: 'prod-1',
        quantity: 1,
        unitPrice: 9800, // gap 2%
        product: { salePrice: 10000 },
        sale: { performedByUserId: 'user-2' },
      },
    ]);

    const anomalies = await fraudService.getAnomalies(organizationId);

    expect(anomalies).toHaveLength(0);
  });

  it('trie les résultats par sévérité puis par impact décroissant', async () => {
    prisma.product.findMany.mockResolvedValue([
      { id: 'prod-1', name: 'Riz 25kg' },
      { id: 'prod-2', name: 'Sel' },
    ]);
    prisma.stockMovement.findMany.mockResolvedValue([
      // medium: 3 unités
      { productId: 'prod-2', performedByUserId: 'user-1', quantity: -3, reason: null },
      // high: 15 unités
      { productId: 'prod-1', performedByUserId: 'user-1', quantity: -15, reason: null },
    ]);

    const results = await fraudService.getAnomalies(organizationId);

    expect(results.map((r) => r.productId)).toEqual(['prod-1', 'prod-2']);
    expect(results[0].severity).toBe('high');
    expect(results[1].severity).toBe('medium');
  });
});
