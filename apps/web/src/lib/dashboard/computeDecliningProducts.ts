import type { ProductProfitabilityDto } from '@copilote/shared';

export interface DecliningProduct {
  productId: string;
  productName: string;
  quantitySold: number;
  previousQuantitySold: number;
  changeRatio: number;
}

/**
 * Produits dont les ventes ont reculé entre la période précédente et la
 * période courante — seuls les produits ayant réellement vendu sur la
 * période précédente sont considérés (sinon "0 → 0" ou un nouveau produit
 * ressortirait à tort comme "en baisse").
 */
export function computeDecliningProducts(
  current: ProductProfitabilityDto[],
  previous: ProductProfitabilityDto[],
  limit = 5,
): DecliningProduct[] {
  const currentByProduct = new Map(current.map((p) => [p.productId, p]));

  return previous
    .filter((prev) => prev.quantitySold > 0)
    .map((prev) => {
      const currentEntry = currentByProduct.get(prev.productId);
      const quantitySold = currentEntry?.quantitySold ?? 0;
      return {
        productId: prev.productId,
        productName: prev.productName,
        quantitySold,
        previousQuantitySold: prev.quantitySold,
        changeRatio: (quantitySold - prev.quantitySold) / prev.quantitySold,
      };
    })
    .filter((p) => p.changeRatio < 0)
    .sort((a, b) => a.changeRatio - b.changeRatio)
    .slice(0, limit);
}
