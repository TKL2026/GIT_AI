import type {
  CrossSellPairDto,
  FraudAnomalyDto,
  ProductToPushDto,
  PurchaseOrderDto,
  PurchaseRecommendationDto,
} from '@copilote/shared';
import { PurchaseOrderStatus } from '@copilote/shared';
import { describe, expect, it } from 'vitest';
import { buildAlerts } from './buildAlerts';
import type { StockHealthSummary } from './computeStockHealth';

function emptyStockHealth(overrides: Partial<StockHealthSummary> = {}): StockHealthSummary {
  return {
    totalValue: 0,
    totalUnits: 0,
    ruptureCount: 0,
    soonCount: 0,
    normalCount: 0,
    entries: [],
    ...overrides,
  };
}

function noInput() {
  return {
    stockHealth: emptyStockHealth(),
    fraudAnomalies: [] as FraudAnomalyDto[],
    purchaseRecommendations: [] as PurchaseRecommendationDto[],
    productsToPush: [] as ProductToPushDto[],
    crossSell: [] as CrossSellPairDto[],
    pendingOrders: [] as PurchaseOrderDto[],
    now: new Date('2026-08-24T12:00:00.000Z'),
  };
}

describe('buildAlerts', () => {
  it("ne génère aucune alerte quand tous les signaux sont vides (honnêteté : pas d'alerte fabriquée)", () => {
    expect(buildAlerts(noInput())).toEqual([]);
  });

  it('génère une alerte critique pour les ruptures de stock', () => {
    const alerts = buildAlerts({ ...noInput(), stockHealth: emptyStockHealth({ ruptureCount: 2 }) });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ id: 'stock-rupture', severity: 'critical', actionTo: '/stock' });
    expect(alerts[0].title).toContain('2 produits');
  });

  it('trie par sévérité : critical avant warning avant opportunity avant info', () => {
    const alerts = buildAlerts({
      stockHealth: emptyStockHealth({ ruptureCount: 1, soonCount: 1 }),
      fraudAnomalies: [],
      purchaseRecommendations: [
        { productId: 'p1', productName: 'Riz', recommendedQuantity: 10, daysUntilStockout: 5, recommendedSupplierId: null, recommendedSupplierName: null, lastUnitCost: null, alternativeSupplierCount: 0, hasSupplierHistory: false },
      ],
      productsToPush: [
        { productId: 'p2', productName: 'Sel', marginPerUnit: 50, stockQuantity: 10, description: 'Marge élevée' },
      ],
      crossSell: [],
      pendingOrders: [],
      now: new Date('2026-08-24T12:00:00.000Z'),
    });
    expect(alerts.map((a) => a.severity)).toEqual(['critical', 'warning', 'opportunity', 'info']);
  });

  it('détecte les anomalies de fraude sévères comme critiques et mineures comme attention', () => {
    const fraudAnomalies: FraudAnomalyDto[] = [
      { type: 'below_catalog_price_sale', severity: 'high', productId: 'p1', productName: 'Riz', performedByUserId: 'u1', occurrencesCount: 3, totalImpact: 5000, description: 'Vente sous le prix catalogue.' },
      { type: 'unexplained_stock_adjustment', severity: 'medium', productId: 'p2', productName: 'Sel', performedByUserId: 'u1', occurrencesCount: 1, totalImpact: 500, description: 'Ajustement sans motif.' },
    ];
    const alerts = buildAlerts({ ...noInput(), fraudAnomalies });
    expect(alerts.find((a) => a.id === 'fraud-high')?.severity).toBe('critical');
    expect(alerts.find((a) => a.id === 'fraud-medium')?.severity).toBe('warning');
  });

  it('signale les commandes en attente depuis plus de 7 jours', () => {
    const pendingOrders: PurchaseOrderDto[] = [
      {
        id: 'po1', organizationId: 'org-1', supplierId: 's1', supplierName: 'Fournisseur A',
        performedByUserId: 'u1', status: PurchaseOrderStatus.PENDING, totalAmount: 1000, items: [],
        createdAt: '2026-08-10T00:00:00.000Z', receivedAt: null,
      },
    ];
    const alerts = buildAlerts({ ...noInput(), pendingOrders });
    expect(alerts.find((a) => a.id === 'purchase-stale')).toBeDefined();
  });

  it("ne signale pas une commande en attente récente (moins de 7 jours)", () => {
    const pendingOrders: PurchaseOrderDto[] = [
      {
        id: 'po1', organizationId: 'org-1', supplierId: 's1', supplierName: 'Fournisseur A',
        performedByUserId: 'u1', status: PurchaseOrderStatus.PENDING, totalAmount: 1000, items: [],
        createdAt: '2026-08-22T00:00:00.000Z', receivedAt: null,
      },
    ];
    const alerts = buildAlerts({ ...noInput(), pendingOrders });
    expect(alerts.find((a) => a.id === 'purchase-stale')).toBeUndefined();
  });

  it('génère une opportunité pour les ventes croisées', () => {
    const crossSell: CrossSellPairDto[] = [
      { productAId: 'p1', productAName: 'Riz', productBId: 'p2', productBName: 'Huile', coOccurrenceCount: 5 },
    ];
    const alerts = buildAlerts({ ...noInput(), crossSell });
    expect(alerts[0]).toMatchObject({ id: 'commercial-cross-sell', severity: 'opportunity' });
    expect(alerts[0].description).toContain('Riz');
    expect(alerts[0].description).toContain('Huile');
  });
});
