import type {
  ExpenseCategory,
  PaymentMethod,
  PurchaseOrderStatus,
  Role,
  StockMovementType,
} from './enums';

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId: string;
  createdAt: string;
}

export interface OrganizationDto {
  id: string;
  name: string;
  createdAt: string;
}

export interface ProductDto {
  id: string;
  organizationId: string;
  name: string;
  sku: string;
  purchasePrice: number;
  salePrice: number;
  stockQuantity: number;
  minStock: number | null;
  maxStock: number | null;
  createdAt: string;
}

export interface StockMovementDto {
  id: string;
  organizationId: string;
  productId: string;
  performedByUserId: string;
  type: StockMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string | null;
  createdAt: string;
}

export interface SaleItemDto {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SaleDto {
  id: string;
  organizationId: string;
  performedByUserId: string;
  customerName: string | null;
  customerPhone: string | null;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  items: SaleItemDto[];
  createdAt: string;
}

export interface SupplierDto {
  id: string;
  organizationId: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  createdAt: string;
}

export interface PurchaseOrderItemDto {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface PurchaseOrderDto {
  id: string;
  organizationId: string;
  supplierId: string;
  supplierName: string;
  performedByUserId: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  items: PurchaseOrderItemDto[];
  createdAt: string;
  receivedAt: string | null;
}

export interface ExpenseDto {
  id: string;
  organizationId: string;
  performedByUserId: string;
  category: ExpenseCategory;
  description: string | null;
  amount: number;
  expenseDate: string;
  createdAt: string;
}

export interface FinanceSummaryDto {
  totalRevenue: number;
  totalExpenses: number;
  totalCogs: number;
  grossMargin: number;
  netProfit: number;
  salesCount: number;
}

export interface ProductProfitabilityDto {
  productId: string;
  productName: string;
  quantitySold: number;
  totalRevenue: number;
  estimatedCost: number;
  estimatedMargin: number;
}

export interface StockForecastDto {
  productId: string;
  productName: string;
  currentStock: number;
  averageDailySales: number;
  daysUntilStockout: number | null;
  recommendedReorderQuantity: number | null;
}

export type FraudAnomalyType = 'unexplained_stock_adjustment' | 'below_catalog_price_sale';
export type FraudAnomalySeverity = 'medium' | 'high';

export interface FraudAnomalyDto {
  type: FraudAnomalyType;
  severity: FraudAnomalySeverity;
  productId: string;
  productName: string;
  performedByUserId: string | null;
  occurrencesCount: number;
  totalImpact: number;
  description: string;
}

export interface MonthlyFinanceTrendDto {
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

export interface ProductToPushDto {
  productId: string;
  productName: string;
  marginPerUnit: number;
  stockQuantity: number;
  description: string;
}

export interface CustomerInsightDto {
  customerLabel: string;
  totalSpent: number;
  purchaseCount: number;
  lastPurchaseAt: string;
  daysSinceLastPurchase: number;
}

export interface CrossSellPairDto {
  productAId: string;
  productAName: string;
  productBId: string;
  productBName: string;
  coOccurrenceCount: number;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessageDto {
  role: ChatRole;
  content: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseDto extends AuthTokensDto {
  user: UserDto;
}
