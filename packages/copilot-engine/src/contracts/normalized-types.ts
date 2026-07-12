export interface NormalizedProduct {
  id: string;
  name: string;
  sku: string;
  purchasePrice: number;
  salePrice: number;
  stockQuantity: number;
  minStock: number | null;
  maxStock: number | null;
}

export interface NormalizedSaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface NormalizedSale {
  id: string;
  customerName: string | null;
  paymentMethod: string;
  totalAmount: number;
  items: NormalizedSaleItem[];
  createdAt: string;
}

export interface NormalizedPurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface NormalizedPurchaseOrder {
  id: string;
  supplierName: string;
  status: string;
  totalAmount: number;
  items: NormalizedPurchaseOrderItem[];
  createdAt: string;
}

export interface NormalizedSupplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
}

export interface NormalizedFinanceSummary {
  totalRevenue: number;
  totalExpenses: number;
  totalCogs: number;
  grossMargin: number;
  netProfit: number;
  salesCount: number;
}

export interface NormalizedProductProfitability {
  productId: string;
  productName: string;
  quantitySold: number;
  totalRevenue: number;
  estimatedCost: number;
  estimatedMargin: number;
}

export interface NormalizedStockForecast {
  productId: string;
  productName: string;
  currentStock: number;
  averageDailySales: number;
  daysUntilStockout: number | null;
  recommendedReorderQuantity: number | null;
}

export type FraudAnomalyType = 'unexplained_stock_adjustment' | 'below_catalog_price_sale';
export type FraudAnomalySeverity = 'medium' | 'high';

export interface NormalizedFraudAnomaly {
  type: FraudAnomalyType;
  severity: FraudAnomalySeverity;
  productId: string;
  productName: string;
  performedByUserId: string | null;
  occurrencesCount: number;
  totalImpact: number;
  description: string;
}

export interface NormalizedMonthlyFinanceTrend {
  month: string;
  totalRevenue: number;
  totalExpenses: number;
  totalCogs: number;
  grossMargin: number;
  netProfit: number;
  salesCount: number;
  grossMarginRatio: number | null;
  netMarginRatio: number | null;
  revenueGrowthRatio: number | null;
}
