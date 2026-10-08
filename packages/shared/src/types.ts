import type {
  ExpenseCategory,
  MobileMoneyOperator,
  PaymentMethod,
  PaymentProvider,
  PaymentTransactionStatus,
  PurchaseOrderStatus,
  Role,
  StockMovementType,
  SubscriptionPeriod,
  SubscriptionStatus,
} from './enums';
import type { Feature } from './features';

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId: string;
  createdAt: string;
  emailVerifiedAt: string | null;
}

export interface OrganizationDto {
  id: string;
  name: string;
  createdAt: string;
  country: string | null;
  currency: string | null;
  industry: string | null;
  teamSize: string | null;
  modules: string[];
  onboardingStep: string | null;
  onboardingCompletedAt: string | null;
  accessLocked: boolean;
  /** Suspension décidée par un administrateur plateforme — distincte du
   * cycle de facturation. Permet au frontend d'afficher un message précis
   * (plutôt que de supposer "essai terminé") sur /subscription-expired. */
  suspended: boolean;
  /** Représentation UX uniquement — chaque fonctionnalité reste protégée
   * indépendamment côté backend (FeatureGuard), source d'autorité réelle. */
  features: Feature[];
}

export interface PendingInviteDto {
  id: string;
  email: string;
  role: Role;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface InvitePreviewDto {
  organizationName: string;
  email: string;
  role: Role;
}

export type StockStatus = 'out' | 'low' | 'ok';

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
  stockStatus: StockStatus;
  isActive: boolean;
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

export interface PurchaseRecommendationDto {
  productId: string;
  productName: string;
  recommendedQuantity: number;
  daysUntilStockout: number | null;
  recommendedSupplierId: string | null;
  recommendedSupplierName: string | null;
  lastUnitCost: number | null;
  alternativeSupplierCount: number;
  hasSupplierHistory: boolean;
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

export interface PlanDto {
  id: string;
  code: string;
  name: string;
  price: number;
  currency: string;
  period: SubscriptionPeriod;
  features: unknown;
  isActive: boolean;
}

export interface SubscriptionDto {
  id: string;
  status: SubscriptionStatus;
  plan: PlanDto | null;
  startedAt: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
}

export interface PaymentTransactionDto {
  id: string;
  planId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  operator: MobileMoneyOperator;
  phoneNumber: string;
  status: PaymentTransactionStatus;
  externalReference: string;
  providerReference: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface CheckoutResultDto {
  transactionId: string;
  externalReference: string;
  ussdCode: string | null;
  status: string;
}

// ---------------------------------------------------------------------------
// Back-office plateforme (/admin) — PlatformAdmin est une identité distincte
// de UserDto (jamais liée à une organisation cliente).
// ---------------------------------------------------------------------------

export interface PlatformAdminDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AdminAuthResponseDto {
  accessToken: string;
  admin: PlatformAdminDto;
}

export interface PaginatedResultDto<T> {
  data: T[];
  total: number;
}

export interface AdminDashboardStatsDto {
  totalOrganizations: number;
  totalUsers: number;
  subscriptionStatusCounts: Record<string, number>;
  organizationsWithoutSubscription: number;
  totalRevenueCollected: number;
  planDistribution: { planCode: string; planName: string; count: number }[];
  recentOrganizations: {
    id: string;
    name: string;
    createdAt: string;
    planCode: string | null;
    subscriptionStatus: string | null;
  }[];
  signupsLast30Days: { date: string; count: number }[];
}

export interface AdminOrganizationListItemDto {
  id: string;
  name: string;
  country: string | null;
  industry: string | null;
  userCount: number;
  planCode: string | null;
  planName: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  suspended: boolean;
  createdAt: string;
}

export interface AdminOrganizationDetailDto {
  id: string;
  name: string;
  country: string | null;
  industry: string | null;
  teamSize: string | null;
  createdAt: string;
  onboardingStep: string | null;
  onboardingCompletedAt: string | null;
  suspended: boolean;
  suspendedAt: string | null;
  planCode: string | null;
  planName: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  currentPeriodEnd: string | null;
  userCount: number;
  productCount: number;
  salesCount: number;
  lastSaleAt: string | null;
}

export interface AdminUserListItemDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId: string;
  organizationName: string;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface AdminSubscriptionListItemDto {
  id: string;
  organizationId: string;
  organizationName: string;
  planCode: string | null;
  planName: string | null;
  status: SubscriptionStatus;
  startedAt: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
}

export interface AdminPaymentListItemDto {
  id: string;
  organizationId: string;
  organizationName: string;
  planCode: string;
  planName: string;
  amount: number;
  currency: string;
  operator: MobileMoneyOperator;
  status: PaymentTransactionStatus;
  externalReference: string;
  providerReference: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface AdminSystemStatusDto {
  api: 'ok';
  database: 'ok' | 'error';
  environment: string;
  integrations: {
    campay: boolean;
    anthropic: boolean;
    whatsapp: boolean;
    resend: boolean;
  };
}

export interface AdminAuditLogItemDto {
  id: string;
  platformAdminId: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: unknown;
  createdAt: string;
  platformAdmin: { email: string; firstName: string; lastName: string };
}
