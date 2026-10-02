import {
  NormalizedCrossSellPair,
  NormalizedCustomerInsight,
  NormalizedFinanceSummary,
  NormalizedFraudAnomaly,
  NormalizedMonthlyFinanceTrend,
  NormalizedProduct,
  NormalizedProductProfitability,
  NormalizedProductToPush,
  NormalizedPurchaseOrder,
  NormalizedPurchaseRecommendation,
  NormalizedSale,
  NormalizedStockForecast,
  NormalizedSupplier,
  PaginatedResult,
} from './normalized-types';

/**
 * Frontière entre le moteur IA (agnostique de la source de données) et une
 * source concrète (notre ERP aujourd'hui ; Odoo, Sage, un import CSV,
 * demain). `tenantId` est un identifiant d'entreprise générique — pour
 * notre ERP c'est `organizationId`, mais l'interface ne le présuppose pas.
 *
 * Les méthodes susceptibles de renvoyer beaucoup de lignes (catalogue,
 * fournisseurs, commandes...) prennent un `limit` optionnel et renvoient un
 * `PaginatedResult` plutôt qu'un tableau brut, pour permettre de répondre à
 * des questions de comptage sans envoyer l'intégralité des données au
 * modèle, tout en lui laissant la possibilité de redemander plus de lignes
 * si une analyse l'exige réellement.
 */
export interface BusinessDataProvider {
  getFinanceSummary(tenantId: string, from?: string, to?: string): Promise<NormalizedFinanceSummary>;

  getProductsProfitability(
    tenantId: string,
    from?: string,
    to?: string,
  ): Promise<NormalizedProductProfitability[]>;

  getStockAlerts(tenantId: string, limit?: number): Promise<PaginatedResult<NormalizedProduct>>;

  getProducts(tenantId: string, limit?: number): Promise<PaginatedResult<NormalizedProduct>>;

  getRecentSales(tenantId: string, limit?: number): Promise<NormalizedSale[]>;

  getPendingPurchaseOrders(tenantId: string, limit?: number): Promise<PaginatedResult<NormalizedPurchaseOrder>>;

  getSuppliers(tenantId: string, limit?: number): Promise<PaginatedResult<NormalizedSupplier>>;

  getReplenishmentForecast(tenantId: string, limit?: number): Promise<PaginatedResult<NormalizedStockForecast>>;

  getFraudAnomalies(tenantId: string): Promise<NormalizedFraudAnomaly[]>;

  getMonthlyFinanceTrend(tenantId: string, monthsBack?: number): Promise<NormalizedMonthlyFinanceTrend[]>;

  getProductsToPush(tenantId: string): Promise<NormalizedProductToPush[]>;

  getCustomerInsights(tenantId: string, limit?: number): Promise<NormalizedCustomerInsight[]>;

  getCrossSellOpportunities(tenantId: string, limit?: number): Promise<NormalizedCrossSellPair[]>;

  getPurchaseRecommendations(
    tenantId: string,
    limit?: number,
  ): Promise<PaginatedResult<NormalizedPurchaseRecommendation>>;
}
