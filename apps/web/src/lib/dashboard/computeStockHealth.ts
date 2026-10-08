import type { ProductDto, StockForecastDto } from '@copilote/shared';

export type StockHealthTier = 'rupture' | 'soon' | 'normal';

export interface StockHealthEntry {
  product: ProductDto;
  tier: StockHealthTier;
  daysUntilStockout: number | null;
  averageDailySales: number;
}

export interface StockHealthSummary {
  totalValue: number;
  totalUnits: number;
  ruptureCount: number;
  soonCount: number;
  normalCount: number;
  entries: StockHealthEntry[];
}

const SOON_THRESHOLD_DAYS = 7;

/**
 * Part de product.stockStatus (source unique calculée côté backend, voir
 * stock-status.util.ts) et l'enrichit avec daysUntilStockout (prévision de
 * vente) pour une nuance 'soon' supplémentaire — jamais l'inverse.
 */
export function computeStockHealth(
  products: ProductDto[],
  forecast: StockForecastDto[],
): StockHealthSummary {
  const forecastByProduct = new Map(forecast.map((f) => [f.productId, f]));

  const entries: StockHealthEntry[] = products.map((product) => {
    const productForecast = forecastByProduct.get(product.id);
    const daysUntilStockout = productForecast?.daysUntilStockout ?? null;
    const averageDailySales = productForecast?.averageDailySales ?? 0;

    let tier: StockHealthTier;
    if (product.stockStatus === 'out') {
      tier = 'rupture';
    } else if (
      product.stockStatus === 'low' ||
      (daysUntilStockout !== null && daysUntilStockout <= SOON_THRESHOLD_DAYS)
    ) {
      tier = 'soon';
    } else {
      tier = 'normal';
    }

    return { product, tier, daysUntilStockout, averageDailySales };
  });

  return {
    totalValue: products.reduce((sum, p) => sum + p.stockQuantity * p.purchasePrice, 0),
    totalUnits: products.reduce((sum, p) => sum + p.stockQuantity, 0),
    ruptureCount: entries.filter((e) => e.tier === 'rupture').length,
    soonCount: entries.filter((e) => e.tier === 'soon').length,
    normalCount: entries.filter((e) => e.tier === 'normal').length,
    entries,
  };
}

/**
 * Sélectionne les produits "nécessitant votre attention" (rupture ou bientôt
 * en rupture), rupture d'abord, puis par urgence croissante (moins de jours
 * restants = plus urgent ; sans prévision = moins urgent, en fin de liste).
 */
export function selectStockAttention(entries: StockHealthEntry[], limit = 8): StockHealthEntry[] {
  return entries
    .filter((e) => e.tier !== 'normal')
    .sort((a, b) => {
      if (a.tier !== b.tier) return a.tier === 'rupture' ? -1 : 1;
      if (a.daysUntilStockout === null && b.daysUntilStockout === null) return 0;
      if (a.daysUntilStockout === null) return 1;
      if (b.daysUntilStockout === null) return -1;
      return a.daysUntilStockout - b.daysUntilStockout;
    })
    .slice(0, limit);
}
