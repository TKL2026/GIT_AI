import { PurchaseOrderStatus, StockMovementType, type PurchaseOrderDto, type SaleDto, type StockMovementDto } from '@copilote/shared';

export type ActivityType = 'sale' | 'stock-in' | 'stock-out' | 'stock-adjustment' | 'purchase-received' | 'purchase-created';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  date: string;
  title: string;
  /** Montant (FCFA) pour vente/achat, quantité pour un mouvement de stock — null sinon. */
  amount: number | null;
  actorUserId: string | null;
  linkTo: string;
}

function saleToActivity(sale: SaleDto): ActivityItem {
  return {
    id: `sale-${sale.id}`,
    type: 'sale',
    date: sale.createdAt,
    title: `Vente — ${sale.customerName ?? 'Client anonyme'}`,
    amount: sale.totalAmount,
    actorUserId: sale.performedByUserId,
    linkTo: `/sales/${sale.id}`,
  };
}

function purchaseOrderToActivity(order: PurchaseOrderDto): ActivityItem | null {
  if (order.status === PurchaseOrderStatus.RECEIVED && order.receivedAt) {
    return {
      id: `po-received-${order.id}`,
      type: 'purchase-received',
      date: order.receivedAt,
      title: `Réception — ${order.supplierName}`,
      amount: order.totalAmount,
      actorUserId: order.performedByUserId,
      linkTo: `/purchases/${order.id}`,
    };
  }
  if (order.status === PurchaseOrderStatus.PENDING) {
    return {
      id: `po-created-${order.id}`,
      type: 'purchase-created',
      date: order.createdAt,
      title: `Nouvelle commande — ${order.supplierName}`,
      amount: order.totalAmount,
      actorUserId: order.performedByUserId,
      linkTo: `/purchases/${order.id}`,
    };
  }
  // Commandes annulées : pas un événement utile à faire remonter dans le fil.
  return null;
}

const MOVEMENT_TYPE_META: Record<StockMovementType, { type: ActivityType; label: string }> = {
  [StockMovementType.IN]: { type: 'stock-in', label: 'Entrée de stock' },
  [StockMovementType.OUT]: { type: 'stock-out', label: 'Sortie de stock' },
  [StockMovementType.ADJUSTMENT]: { type: 'stock-adjustment', label: 'Ajustement de stock' },
};

function stockMovementToActivity(movement: StockMovementDto, productNameById: Map<string, string>): ActivityItem {
  const meta = MOVEMENT_TYPE_META[movement.type];
  const productName = productNameById.get(movement.productId) ?? 'Produit';
  return {
    id: `movement-${movement.id}`,
    type: meta.type,
    date: movement.createdAt,
    title: `${meta.label} — ${productName}`,
    amount: movement.quantity,
    actorUserId: movement.performedByUserId,
    linkTo: `/products/${movement.productId}`,
  };
}

/**
 * Fusionne ventes, réceptions/nouvelles commandes et mouvements de stock en
 * un seul fil chronologique — il n'existe pas de journal d'activité unifié
 * en base, donc cette fusion est purement client-side à partir des données
 * déjà réelles de chaque module.
 */
export function mergeActivity(
  sales: SaleDto[],
  purchaseOrders: PurchaseOrderDto[],
  stockMovements: StockMovementDto[],
  productNameById: Map<string, string>,
  limit = 15,
): ActivityItem[] {
  const items: ActivityItem[] = [
    ...sales.map(saleToActivity),
    ...purchaseOrders.map(purchaseOrderToActivity).filter((item): item is ActivityItem => item !== null),
    ...stockMovements.map((m) => stockMovementToActivity(m, productNameById)),
  ];

  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
}
