import { Injectable } from '@nestjs/common';
import { StockMovementType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FraudAnomalyResponseDto } from './dto/fraud-anomaly-response.dto';

const LOOKBACK_DAYS = 30;
const ADJUSTMENT_HIGH_THRESHOLD_UNITS = 10;
const PRICE_GAP_FLAG_RATIO = 0.05;
const PRICE_GAP_HIGH_RATIO = 0.1;

interface GroupKey {
  productId: string;
  performedByUserId: string | null;
}

function groupKey({ productId, performedByUserId }: GroupKey): string {
  return `${productId}::${performedByUserId ?? 'unknown'}`;
}

@Injectable()
export class FraudService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnomalies(organizationId: string): Promise<FraudAnomalyResponseDto[]> {
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - LOOKBACK_DAYS);

    const [products, adjustments, saleItems] = await Promise.all([
      this.prisma.product.findMany({ where: { organizationId } }),
      this.prisma.stockMovement.findMany({
        where: {
          organizationId,
          type: StockMovementType.ADJUSTMENT,
          quantity: { lt: 0 },
          createdAt: { gte: windowStart },
        },
        select: { productId: true, performedByUserId: true, quantity: true, reason: true },
      }),
      this.prisma.saleItem.findMany({
        where: { sale: { organizationId, createdAt: { gte: windowStart } } },
        select: {
          productId: true,
          quantity: true,
          unitPrice: true,
          product: { select: { salePrice: true } },
          sale: { select: { performedByUserId: true } },
        },
      }),
    ]);

    const productNames = new Map(products.map((product) => [product.id, product.name]));

    const anomalies: FraudAnomalyResponseDto[] = [
      ...this.detectUnexplainedAdjustments(adjustments, productNames),
      ...this.detectBelowCatalogPriceSales(saleItems, productNames),
    ];

    return anomalies.sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === 'high' ? -1 : 1;
      return b.totalImpact - a.totalImpact;
    });
  }

  private detectUnexplainedAdjustments(
    adjustments: { productId: string; performedByUserId: string; quantity: number; reason: string | null }[],
    productNames: Map<string, string>,
  ): FraudAnomalyResponseDto[] {
    const groups = new Map<string, GroupKey & { occurrencesCount: number; totalImpact: number }>();

    for (const movement of adjustments) {
      if (movement.reason && movement.reason.trim() !== '') continue;

      const key: GroupKey = { productId: movement.productId, performedByUserId: movement.performedByUserId };
      const mapKey = groupKey(key);
      const existing = groups.get(mapKey);
      if (existing) {
        existing.occurrencesCount += 1;
        existing.totalImpact += Math.abs(movement.quantity);
      } else {
        groups.set(mapKey, { ...key, occurrencesCount: 1, totalImpact: Math.abs(movement.quantity) });
      }
    }

    return Array.from(groups.values()).map((group) => ({
      type: 'unexplained_stock_adjustment',
      severity: group.totalImpact >= ADJUSTMENT_HIGH_THRESHOLD_UNITS ? 'high' : 'medium',
      productId: group.productId,
      productName: productNames.get(group.productId) ?? 'Produit inconnu',
      performedByUserId: group.performedByUserId,
      occurrencesCount: group.occurrencesCount,
      totalImpact: group.totalImpact,
      description: `${group.occurrencesCount} ajustement(s) de stock à la baisse sans motif renseigné, totalisant ${group.totalImpact} unité(s).`,
    }));
  }

  private detectBelowCatalogPriceSales(
    saleItems: {
      productId: string;
      quantity: number;
      unitPrice: unknown;
      product: { salePrice: unknown };
      sale: { performedByUserId: string };
    }[],
    productNames: Map<string, string>,
  ): FraudAnomalyResponseDto[] {
    const groups = new Map<
      string,
      GroupKey & { occurrencesCount: number; totalImpact: number; maxGapRatio: number }
    >();

    for (const item of saleItems) {
      const unitPrice = Number(item.unitPrice);
      const salePrice = Number(item.product.salePrice);
      if (salePrice <= 0) continue;

      const gapRatio = (salePrice - unitPrice) / salePrice;
      if (gapRatio <= PRICE_GAP_FLAG_RATIO) continue;

      const key: GroupKey = { productId: item.productId, performedByUserId: item.sale.performedByUserId };
      const mapKey = groupKey(key);
      const impact = (salePrice - unitPrice) * item.quantity;
      const existing = groups.get(mapKey);
      if (existing) {
        existing.occurrencesCount += 1;
        existing.totalImpact += impact;
        existing.maxGapRatio = Math.max(existing.maxGapRatio, gapRatio);
      } else {
        groups.set(mapKey, { ...key, occurrencesCount: 1, totalImpact: impact, maxGapRatio: gapRatio });
      }
    }

    return Array.from(groups.values()).map((group) => ({
      type: 'below_catalog_price_sale',
      severity: group.maxGapRatio >= PRICE_GAP_HIGH_RATIO ? 'high' : 'medium',
      productId: group.productId,
      productName: productNames.get(group.productId) ?? 'Produit inconnu',
      performedByUserId: group.performedByUserId,
      occurrencesCount: group.occurrencesCount,
      totalImpact: Math.round(group.totalImpact),
      description: `${group.occurrencesCount} vente(s) à un prix inférieur au prix catalogue, écart total estimé à ${Math.round(group.totalImpact)} FCFA.`,
    }));
  }
}
