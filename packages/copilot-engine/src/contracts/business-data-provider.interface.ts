import {
  NormalizedFinanceSummary,
  NormalizedProduct,
  NormalizedProductProfitability,
  NormalizedPurchaseOrder,
  NormalizedSale,
  NormalizedSupplier,
} from './normalized-types';

/**
 * Frontière entre le moteur IA (agnostique de la source de données) et une
 * source concrète (notre ERP aujourd'hui ; Odoo, Sage, un import CSV,
 * demain). `tenantId` est un identifiant d'entreprise générique — pour
 * notre ERP c'est `organizationId`, mais l'interface ne le présuppose pas.
 */
export interface BusinessDataProvider {
  getFinanceSummary(tenantId: string, from?: string, to?: string): Promise<NormalizedFinanceSummary>;

  getProductsProfitability(
    tenantId: string,
    from?: string,
    to?: string,
  ): Promise<NormalizedProductProfitability[]>;

  getStockAlerts(tenantId: string): Promise<NormalizedProduct[]>;

  getProducts(tenantId: string): Promise<NormalizedProduct[]>;

  getRecentSales(tenantId: string, limit?: number): Promise<NormalizedSale[]>;

  getPendingPurchaseOrders(tenantId: string): Promise<NormalizedPurchaseOrder[]>;

  getSuppliers(tenantId: string): Promise<NormalizedSupplier[]>;
}
