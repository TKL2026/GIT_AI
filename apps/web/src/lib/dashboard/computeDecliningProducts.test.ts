import type { ProductProfitabilityDto } from '@copilote/shared';
import { describe, expect, it } from 'vitest';
import { computeDecliningProducts } from './computeDecliningProducts';

function profit(overrides: Partial<ProductProfitabilityDto> = {}): ProductProfitabilityDto {
  return {
    productId: 'p1',
    productName: 'Riz 25kg',
    quantitySold: 10,
    totalRevenue: 1000,
    estimatedCost: 400,
    estimatedMargin: 600,
    ...overrides,
  };
}

describe('computeDecliningProducts', () => {
  it('détecte un produit dont les ventes ont reculé', () => {
    const previous = [profit({ productId: 'p1', quantitySold: 10 })];
    const current = [profit({ productId: 'p1', quantitySold: 4 })];
    const result = computeDecliningProducts(current, previous);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ productId: 'p1', quantitySold: 4, previousQuantitySold: 10 });
    expect(result[0].changeRatio).toBeCloseTo(-0.6);
  });

  it('traite un produit absent de la période courante comme 0 vente (baisse de 100%)', () => {
    const previous = [profit({ productId: 'p1', quantitySold: 5 })];
    const result = computeDecliningProducts([], previous);
    expect(result[0]).toMatchObject({ quantitySold: 0, changeRatio: -1 });
  });

  it("ignore les produits en hausse ou stables", () => {
    const previous = [profit({ productId: 'p1', quantitySold: 5 })];
    const current = [profit({ productId: 'p1', quantitySold: 8 })];
    expect(computeDecliningProducts(current, previous)).toEqual([]);
  });

  it("ignore un produit qui n'avait aucune vente sur la période précédente (évite un faux 0→0 ou un nouveau produit)", () => {
    const previous = [profit({ productId: 'p1', quantitySold: 0 })];
    const current = [profit({ productId: 'p1', quantitySold: 0 })];
    expect(computeDecliningProducts(current, previous)).toEqual([]);
  });

  it('trie par baisse la plus sévère en premier', () => {
    const previous = [
      profit({ productId: 'p1', productName: 'A', quantitySold: 10 }),
      profit({ productId: 'p2', productName: 'B', quantitySold: 10 }),
    ];
    const current = [
      profit({ productId: 'p1', productName: 'A', quantitySold: 8 }),
      profit({ productId: 'p2', productName: 'B', quantitySold: 1 }),
    ];
    const result = computeDecliningProducts(current, previous);
    expect(result.map((r) => r.productId)).toEqual(['p2', 'p1']);
  });

  it('respecte la limite fournie', () => {
    const previous = Array.from({ length: 8 }, (_, i) => profit({ productId: `p${i}`, quantitySold: 10 }));
    const current = Array.from({ length: 8 }, (_, i) => profit({ productId: `p${i}`, quantitySold: 1 }));
    expect(computeDecliningProducts(current, previous, 3)).toHaveLength(3);
  });
});
