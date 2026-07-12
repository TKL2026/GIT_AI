import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ForecastResponseDto } from './dto/forecast-response.dto';

const LOOKBACK_DAYS = 30;
const TARGET_COVERAGE_DAYS = 30;

@Injectable()
export class ForecastService {
  constructor(private readonly prisma: PrismaService) {}

  async getReplenishmentForecast(organizationId: string): Promise<ForecastResponseDto[]> {
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - LOOKBACK_DAYS);

    const [products, saleItems] = await Promise.all([
      this.prisma.product.findMany({ where: { organizationId } }),
      this.prisma.saleItem.findMany({
        where: { sale: { organizationId, createdAt: { gte: windowStart } } },
        select: { productId: true, quantity: true },
      }),
    ]);

    const soldByProductId = new Map<string, number>();
    for (const item of saleItems) {
      soldByProductId.set(item.productId, (soldByProductId.get(item.productId) ?? 0) + item.quantity);
    }

    const forecasts = products.map((product) => {
      const quantitySold = soldByProductId.get(product.id) ?? 0;
      const averageDailySales = quantitySold / LOOKBACK_DAYS;

      const daysUntilStockout =
        averageDailySales > 0 ? Math.round(product.stockQuantity / averageDailySales) : null;

      const recommendedReorderQuantity =
        averageDailySales > 0
          ? Math.max(0, Math.round(averageDailySales * TARGET_COVERAGE_DAYS - product.stockQuantity))
          : null;

      return {
        productId: product.id,
        productName: product.name,
        currentStock: product.stockQuantity,
        averageDailySales,
        daysUntilStockout,
        recommendedReorderQuantity,
      };
    });

    return forecasts.sort((a, b) => {
      if (a.daysUntilStockout === null) return 1;
      if (b.daysUntilStockout === null) return -1;
      return a.daysUntilStockout - b.daysUntilStockout;
    });
  }
}
