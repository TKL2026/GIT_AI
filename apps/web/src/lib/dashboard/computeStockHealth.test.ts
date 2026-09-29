import type { ProductDto, StockForecastDto } from '@copilote/shared';
import { describe, expect, it } from 'vitest';
import { computeStockHealth, selectStockAttention, type StockHealthEntry } from './computeStockHealth';

function product(overrides: Partial<ProductDto> = {}): ProductDto {
  return {
    id: 'prod-1',
    organizationId: 'org-1',
    name: 'Riz 25kg',
    sku: 'RIZ25',
    purchasePrice: 100,
    salePrice: 150,
    stockQuantity: 20,
    minStock: 5,
    maxStock: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function forecast(overrides: Partial<StockForecastDto> = {}): StockForecastDto {
  return {
    productId: 'prod-1',
    productName: 'Riz 25kg',
    currentStock: 20,
    averageDailySales: 1,
    daysUntilStockout: 20,
    recommendedReorderQuantity: null,
    ...overrides,
  };
}

describe('computeStockHealth', () => {
  it('classe un produit à 0 en rupture même si minStock est nul', () => {
    const summary = computeStockHealth([product({ stockQuantity: 0, minStock: null })], []);
    expect(summary.entries[0].tier).toBe('rupture');
    expect(summary.ruptureCount).toBe(1);
  });

  it('classe en "bientôt en rupture" quand stock <= minStock', () => {
    const summary = computeStockHealth([product({ stockQuantity: 5, minStock: 5 })], []);
    expect(summary.entries[0].tier).toBe('soon');
  });

  it('classe en "bientôt en rupture" via la prévision même au-dessus de minStock', () => {
    const summary = computeStockHealth(
      [product({ stockQuantity: 50, minStock: 5 })],
      [forecast({ daysUntilStockout: 3 })],
    );
    expect(summary.entries[0].tier).toBe('soon');
  });

  it('classe en normal sinon', () => {
    const summary = computeStockHealth(
      [product({ stockQuantity: 50, minStock: 5 })],
      [forecast({ daysUntilStockout: 60 })],
    );
    expect(summary.entries[0].tier).toBe('normal');
    expect(summary.normalCount).toBe(1);
  });

  it('un produit sans historique de prévision (daysUntilStockout null) n\'est jamais "soon" par ce seul critère', () => {
    const summary = computeStockHealth([product({ stockQuantity: 50, minStock: 5 })], []);
    expect(summary.entries[0].tier).toBe('normal');
  });

  it('calcule la valeur et le total d\'unités en stock', () => {
    const summary = computeStockHealth(
      [product({ stockQuantity: 20, purchasePrice: 100 }), product({ id: 'prod-2', stockQuantity: 5, purchasePrice: 50 })],
      [],
    );
    expect(summary.totalValue).toBe(20 * 100 + 5 * 50);
    expect(summary.totalUnits).toBe(25);
  });
});

describe('selectStockAttention', () => {
  function entry(overrides: Partial<StockHealthEntry> = {}): StockHealthEntry {
    return {
      product: product(),
      tier: 'soon',
      daysUntilStockout: 5,
      averageDailySales: 1,
      ...overrides,
    };
  }

  it('exclut les produits en tier normal', () => {
    const result = selectStockAttention([entry({ tier: 'normal' }), entry({ tier: 'soon' })]);
    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe('soon');
  });

  it('place toujours les ruptures avant les "bientôt en rupture"', () => {
    const result = selectStockAttention([
      entry({ tier: 'soon', daysUntilStockout: 1 }),
      entry({ tier: 'rupture', daysUntilStockout: null }),
    ]);
    expect(result[0].tier).toBe('rupture');
  });

  it('trie par urgence croissante (moins de jours restants = plus urgent) au sein du même tier', () => {
    const result = selectStockAttention([
      entry({ tier: 'soon', daysUntilStockout: 6, product: product({ id: 'p6' }) }),
      entry({ tier: 'soon', daysUntilStockout: 2, product: product({ id: 'p2' }) }),
    ]);
    expect(result.map((e) => e.product.id)).toEqual(['p2', 'p6']);
  });

  it('place les entrées sans prévision (daysUntilStockout null) en fin de leur tier', () => {
    const result = selectStockAttention([
      entry({ tier: 'soon', daysUntilStockout: null, product: product({ id: 'p-null' }) }),
      entry({ tier: 'soon', daysUntilStockout: 3, product: product({ id: 'p-3' }) }),
    ]);
    expect(result.map((e) => e.product.id)).toEqual(['p-3', 'p-null']);
  });

  it('respecte la limite fournie', () => {
    const entries = Array.from({ length: 10 }, (_, i) => entry({ product: product({ id: `p${i}` }) }));
    expect(selectStockAttention(entries, 3)).toHaveLength(3);
  });
});
