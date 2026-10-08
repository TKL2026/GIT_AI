import type { ProductDto, SaleDto } from '@copilote/shared';
import { PaymentMethod } from '@copilote/shared';
import { describe, expect, it } from 'vitest';
import { bucketSalesByDay } from './bucketSalesByDay';

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
    stockStatus: 'ok',
    isActive: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function sale(overrides: Partial<SaleDto> = {}): SaleDto {
  return {
    id: 'sale-1',
    organizationId: 'org-1',
    performedByUserId: 'user-1',
    customerName: 'Client',
    customerPhone: null,
    paymentMethod: PaymentMethod.CASH,
    totalAmount: 300,
    items: [{ id: 'item-1', productId: 'prod-1', productName: 'Riz 25kg', quantity: 2, unitPrice: 150, lineTotal: 300 }],
    createdAt: '2026-08-10T10:00:00.000Z',
    ...overrides,
  };
}

describe('bucketSalesByDay', () => {
  // Bornes à midi UTC : évite qu'un décalage de fuseau horaire local (le
  // bucketing est en jour calendaire local, comportement voulu) ne fasse
  // franchir un jour de plus au conteneur de test.
  const from = '2026-08-09T12:00:00.000Z';
  const to = '2026-08-11T12:00:00.000Z';

  it('crée un bucket vide pour chaque jour de la période', () => {
    const buckets = bucketSalesByDay([], [], from, to);
    expect(buckets.map((b) => b.date)).toEqual(['2026-08-09', '2026-08-10', '2026-08-11']);
    expect(buckets.every((b) => b.revenue === 0 && b.salesCount === 0 && b.margin === 0)).toBe(true);
  });

  it('agrège le chiffre d\'affaires et le nombre de ventes dans le bon bucket', () => {
    const buckets = bucketSalesByDay([sale()], [product()], from, to);
    const day = buckets.find((b) => b.date === '2026-08-10')!;
    expect(day.revenue).toBe(300);
    expect(day.salesCount).toBe(1);
  });

  it('calcule une marge estimée à partir du purchasePrice courant', () => {
    const buckets = bucketSalesByDay([sale()], [product()], from, to);
    const day = buckets.find((b) => b.date === '2026-08-10')!;
    // lineTotal 300 - (purchasePrice 100 * quantity 2) = 100
    expect(day.margin).toBe(100);
  });

  it('ignore les ventes hors de la période', () => {
    const outOfRange = sale({ id: 'sale-2', createdAt: '2026-08-20T10:00:00.000Z' });
    const buckets = bucketSalesByDay([outOfRange], [product()], from, to);
    expect(buckets.every((b) => b.revenue === 0)).toBe(true);
  });

  it('traite un produit inconnu comme coût nul plutôt que de planter', () => {
    const orphanSale = sale({ items: [{ id: 'item-2', productId: 'unknown', productName: 'X', quantity: 1, unitPrice: 50, lineTotal: 50 }] });
    const buckets = bucketSalesByDay([orphanSale], [], from, to);
    const day = buckets.find((b) => b.date === '2026-08-10')!;
    expect(day.margin).toBe(50);
  });
});
