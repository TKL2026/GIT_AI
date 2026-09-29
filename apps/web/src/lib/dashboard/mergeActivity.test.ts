import { PaymentMethod, PurchaseOrderStatus, StockMovementType, type PurchaseOrderDto, type SaleDto, type StockMovementDto } from '@copilote/shared';
import { describe, expect, it } from 'vitest';
import { mergeActivity } from './mergeActivity';

function sale(overrides: Partial<SaleDto> = {}): SaleDto {
  return {
    id: 'sale-1',
    organizationId: 'org-1',
    performedByUserId: 'user-1',
    customerName: 'Client A',
    customerPhone: null,
    paymentMethod: PaymentMethod.CASH,
    totalAmount: 5000,
    items: [],
    createdAt: '2026-08-20T10:00:00.000Z',
    ...overrides,
  };
}

function order(overrides: Partial<PurchaseOrderDto> = {}): PurchaseOrderDto {
  return {
    id: 'po-1',
    organizationId: 'org-1',
    supplierId: 'sup-1',
    supplierName: 'Fournisseur A',
    performedByUserId: 'user-1',
    status: PurchaseOrderStatus.PENDING,
    totalAmount: 20000,
    items: [],
    createdAt: '2026-08-18T10:00:00.000Z',
    receivedAt: null,
    ...overrides,
  };
}

function movement(overrides: Partial<StockMovementDto> = {}): StockMovementDto {
  return {
    id: 'mov-1',
    organizationId: 'org-1',
    productId: 'prod-1',
    performedByUserId: 'user-1',
    type: StockMovementType.IN,
    quantity: 10,
    previousQuantity: 5,
    newQuantity: 15,
    reason: null,
    createdAt: '2026-08-19T10:00:00.000Z',
    ...overrides,
  };
}

describe('mergeActivity', () => {
  const productNameById = new Map([['prod-1', 'Riz 25kg']]);

  it('trie tous les événements par date décroissante, tous types confondus', () => {
    const items = mergeActivity([sale()], [order()], [movement()], productNameById);
    expect(items.map((i) => i.type)).toEqual(['sale', 'stock-in', 'purchase-created']);
  });

  it('mappe une commande RECEIVED sur sa date de réception, pas de création', () => {
    const received = order({ status: PurchaseOrderStatus.RECEIVED, receivedAt: '2026-08-22T00:00:00.000Z' });
    const items = mergeActivity([], [received], [], productNameById);
    expect(items[0]).toMatchObject({ type: 'purchase-received', date: '2026-08-22T00:00:00.000Z' });
  });

  it('exclut les commandes annulées du fil', () => {
    const cancelled = order({ status: PurchaseOrderStatus.CANCELLED });
    expect(mergeActivity([], [cancelled], [], productNameById)).toEqual([]);
  });

  it('ignore une commande RECEIVED sans receivedAt (donnée incohérente, pas de date fiable)', () => {
    const received = order({ status: PurchaseOrderStatus.RECEIVED, receivedAt: null });
    expect(mergeActivity([], [received], [], productNameById)).toEqual([]);
  });

  it('résout le nom du produit pour un mouvement de stock, avec repli si inconnu', () => {
    const items = mergeActivity([], [], [movement({ productId: 'unknown' })], productNameById);
    expect(items[0].title).toContain('Produit');
  });

  it('conserve la quantité (pas un montant FCFA) comme amount pour un mouvement de stock', () => {
    const items = mergeActivity([], [], [movement({ quantity: 7 })], productNameById);
    expect(items[0].amount).toBe(7);
  });

  it('respecte la limite fournie', () => {
    const sales = Array.from({ length: 20 }, (_, i) => sale({ id: `s${i}`, createdAt: `2026-08-${(i % 28) + 1}T00:00:00.000Z` }));
    expect(mergeActivity(sales, [], [], productNameById, 5)).toHaveLength(5);
  });
});
