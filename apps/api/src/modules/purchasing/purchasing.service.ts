import { Injectable } from '@nestjs/common';
import { ForecastService } from '../forecast/forecast.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PurchaseRecommendationResponseDto } from './dto/purchase-recommendation-response.dto';

interface SupplierHistory {
  supplierId: string;
  supplierName: string;
  lastUnitCost: number;
  orderCount: number;
}

@Injectable()
export class PurchasingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly forecastService: ForecastService,
  ) {}

  async getPurchaseRecommendations(organizationId: string): Promise<PurchaseRecommendationResponseDto[]> {
    const forecasts = await this.forecastService.getReplenishmentForecast(organizationId);
    const productsNeedingReorder = forecasts.filter(
      (forecast) => (forecast.recommendedReorderQuantity ?? 0) > 0,
    );

    if (productsNeedingReorder.length === 0) {
      return [];
    }

    const productIds = productsNeedingReorder.map((forecast) => forecast.productId);
    const items = await this.prisma.purchaseOrderItem.findMany({
      where: { productId: { in: productIds }, purchaseOrder: { organizationId } },
      include: { purchaseOrder: { include: { supplier: true } } },
      orderBy: { purchaseOrder: { createdAt: 'desc' } },
    });

    const historyByProduct = new Map<string, Map<string, SupplierHistory>>();

    for (const item of items) {
      const supplier = item.purchaseOrder.supplier;
      const supplierMap = historyByProduct.get(item.productId) ?? new Map<string, SupplierHistory>();
      const existing = supplierMap.get(supplier.id);
      if (existing) {
        existing.orderCount += 1;
      } else {
        // Trié par date décroissante : la première occurrence par fournisseur est la plus récente.
        supplierMap.set(supplier.id, {
          supplierId: supplier.id,
          supplierName: supplier.name,
          lastUnitCost: Number(item.unitCost),
          orderCount: 1,
        });
      }
      historyByProduct.set(item.productId, supplierMap);
    }

    return productsNeedingReorder
      .map((forecast) => {
        const suppliers = Array.from(historyByProduct.get(forecast.productId)?.values() ?? []);
        const recommendedSupplier = [...suppliers].sort((a, b) => a.lastUnitCost - b.lastUnitCost)[0] ?? null;

        return {
          productId: forecast.productId,
          productName: forecast.productName,
          recommendedQuantity: forecast.recommendedReorderQuantity ?? 0,
          daysUntilStockout: forecast.daysUntilStockout,
          recommendedSupplierId: recommendedSupplier?.supplierId ?? null,
          recommendedSupplierName: recommendedSupplier?.supplierName ?? null,
          lastUnitCost: recommendedSupplier?.lastUnitCost ?? null,
          alternativeSupplierCount: Math.max(suppliers.length - 1, 0),
          hasSupplierHistory: suppliers.length > 0,
        };
      })
      .sort((a, b) => (a.daysUntilStockout ?? Infinity) - (b.daysUntilStockout ?? Infinity));
  }
}
