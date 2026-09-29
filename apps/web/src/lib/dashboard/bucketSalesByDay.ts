import type { ProductDto, SaleDto } from '@copilote/shared';
import dayjs from 'dayjs';

export interface DailyBucket {
  date: string;
  revenue: number;
  salesCount: number;
  /** Marge estimée : prix de vente - purchasePrice courant, même méthodologie que /finance/products-profitability. */
  margin: number;
}

/**
 * Agrège les ventes par jour sur [from, to] (bornes ISO incluses). purchasePrice
 * est le prix courant du produit (pas d'historique de prix en base), donc la
 * marge journalière est une estimation — cohérente avec estimatedMargin côté backend.
 */
export function bucketSalesByDay(
  sales: SaleDto[],
  products: ProductDto[],
  from: string,
  to: string,
): DailyBucket[] {
  const costByProduct = new Map(products.map((p) => [p.id, p.purchasePrice]));
  const start = dayjs(from).startOf('day');
  const end = dayjs(to).startOf('day');
  const dayCount = Math.max(end.diff(start, 'day') + 1, 0);

  const buckets = new Map<string, DailyBucket>();
  for (let i = 0; i < dayCount; i++) {
    const date = start.add(i, 'day').format('YYYY-MM-DD');
    buckets.set(date, { date, revenue: 0, salesCount: 0, margin: 0 });
  }

  const rangeStart = dayjs(from);
  const rangeEnd = dayjs(to);

  for (const sale of sales) {
    const saleDate = dayjs(sale.createdAt);
    if (saleDate.isBefore(rangeStart) || saleDate.isAfter(rangeEnd)) continue;

    const bucket = buckets.get(saleDate.format('YYYY-MM-DD'));
    if (!bucket) continue;

    bucket.revenue += sale.totalAmount;
    bucket.salesCount += 1;
    for (const item of sale.items) {
      const cost = costByProduct.get(item.productId) ?? 0;
      bucket.margin += item.lineTotal - cost * item.quantity;
    }
  }

  return Array.from(buckets.values());
}
