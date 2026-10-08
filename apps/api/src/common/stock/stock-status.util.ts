/**
 * Source unique de vérité pour l'état de stock d'un produit — consommée par
 * le module Stock (alertes), les DTO Produits, et le fournisseur de données
 * du Copilot, pour qu'un même produit ne puisse plus produire de verdicts
 * contradictoires selon l'écran (voir BUG-003).
 *
 * Règles (stock = 0 est toujours un problème, même sans seuil configuré —
 * un seuil absent ne peut qualifier que "bas", jamais annuler la rupture) :
 * - stockQuantity === 0                              -> 'out'
 * - minStock non nul et stockQuantity <= minStock     -> 'low'
 * - sinon (y compris minStock non configuré)          -> 'ok'
 */
export type StockStatus = 'out' | 'low' | 'ok';

export function computeStockStatus(stockQuantity: number, minStock: number | null): StockStatus {
  if (stockQuantity <= 0) return 'out';
  if (minStock !== null && stockQuantity <= minStock) return 'low';
  return 'ok';
}
