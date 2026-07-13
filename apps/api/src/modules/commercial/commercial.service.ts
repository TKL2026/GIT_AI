import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrossSellPairResponseDto } from './dto/cross-sell-pair-response.dto';
import { CustomerInsightResponseDto } from './dto/customer-insight-response.dto';
import { ProductToPushResponseDto } from './dto/product-to-push-response.dto';

const PUSH_LOOKBACK_DAYS = 30;
const CROSS_SELL_LOOKBACK_DAYS = 90;
const MIN_CO_OCCURRENCE = 2;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function boundLimit(limit?: number): number {
  return Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
}

@Injectable()
export class CommercialService {
  constructor(private readonly prisma: PrismaService) {}

  async getProductsToPush(organizationId: string): Promise<ProductToPushResponseDto[]> {
    const windowStart = daysAgo(PUSH_LOOKBACK_DAYS);

    const [products, recentSaleItems] = await Promise.all([
      this.prisma.product.findMany({ where: { organizationId } }),
      this.prisma.saleItem.findMany({
        where: { sale: { organizationId, createdAt: { gte: windowStart } } },
        select: { productId: true },
      }),
    ]);

    const recentlySoldProductIds = new Set(recentSaleItems.map((item) => item.productId));

    return products
      .map((product) => ({
        product,
        marginPerUnit: Number(product.salePrice) - Number(product.purchasePrice),
      }))
      .filter(
        ({ product, marginPerUnit }) =>
          marginPerUnit > 0 && product.stockQuantity > 0 && !recentlySoldProductIds.has(product.id),
      )
      .sort((a, b) => b.marginPerUnit - a.marginPerUnit)
      .map(({ product, marginPerUnit }) => ({
        productId: product.id,
        productName: product.name,
        marginPerUnit,
        stockQuantity: product.stockQuantity,
        description: `Marge de ${marginPerUnit} FCFA par unité, ${product.stockQuantity} en stock, aucune vente sur les ${PUSH_LOOKBACK_DAYS} derniers jours.`,
      }));
  }

  async getCustomerInsights(organizationId: string, limit?: number): Promise<CustomerInsightResponseDto[]> {
    const sales = await this.prisma.sale.findMany({
      where: { organizationId },
      select: { customerName: true, customerPhone: true, totalAmount: true, createdAt: true },
    });

    const groups = new Map<
      string,
      { customerLabel: string; totalSpent: number; purchaseCount: number; lastPurchaseAt: Date }
    >();

    for (const sale of sales) {
      const key = sale.customerPhone?.trim() || sale.customerName?.trim();
      if (!key) continue;

      const amount = Number(sale.totalAmount);
      const existing = groups.get(key);
      if (existing) {
        existing.totalSpent += amount;
        existing.purchaseCount += 1;
        if (sale.createdAt > existing.lastPurchaseAt) {
          existing.lastPurchaseAt = sale.createdAt;
        }
      } else {
        groups.set(key, {
          customerLabel: key,
          totalSpent: amount,
          purchaseCount: 1,
          lastPurchaseAt: sale.createdAt,
        });
      }
    }

    const now = Date.now();

    return Array.from(groups.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, boundLimit(limit))
      .map((group) => ({
        customerLabel: group.customerLabel,
        totalSpent: group.totalSpent,
        purchaseCount: group.purchaseCount,
        lastPurchaseAt: group.lastPurchaseAt.toISOString(),
        daysSinceLastPurchase: Math.floor((now - group.lastPurchaseAt.getTime()) / MS_PER_DAY),
      }));
  }

  async getCrossSellOpportunities(organizationId: string, limit?: number): Promise<CrossSellPairResponseDto[]> {
    const windowStart = daysAgo(CROSS_SELL_LOOKBACK_DAYS);

    const saleItems = await this.prisma.saleItem.findMany({
      where: { sale: { organizationId, createdAt: { gte: windowStart } } },
      select: { saleId: true, productId: true, productName: true },
    });

    const itemsBySale = new Map<string, { productId: string; productName: string }[]>();
    for (const item of saleItems) {
      const items = itemsBySale.get(item.saleId) ?? [];
      if (!items.some((existing) => existing.productId === item.productId)) {
        items.push({ productId: item.productId, productName: item.productName });
      }
      itemsBySale.set(item.saleId, items);
    }

    const pairCounts = new Map<
      string,
      { productAId: string; productAName: string; productBId: string; productBName: string; count: number }
    >();

    for (const items of itemsBySale.values()) {
      if (items.length < 2) continue;

      for (let i = 0; i < items.length; i += 1) {
        for (let j = i + 1; j < items.length; j += 1) {
          const [first, second] = [items[i], items[j]].sort((a, b) => a.productId.localeCompare(b.productId));
          const key = `${first.productId}::${second.productId}`;
          const existing = pairCounts.get(key);
          if (existing) {
            existing.count += 1;
          } else {
            pairCounts.set(key, {
              productAId: first.productId,
              productAName: first.productName,
              productBId: second.productId,
              productBName: second.productName,
              count: 1,
            });
          }
        }
      }
    }

    return Array.from(pairCounts.values())
      .filter((pair) => pair.count >= MIN_CO_OCCURRENCE)
      .sort((a, b) => b.count - a.count)
      .slice(0, boundLimit(limit))
      .map((pair) => ({
        productAId: pair.productAId,
        productAName: pair.productAName,
        productBId: pair.productBId,
        productBName: pair.productBName,
        coOccurrenceCount: pair.count,
      }));
  }
}
