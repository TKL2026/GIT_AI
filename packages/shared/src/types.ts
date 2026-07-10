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

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseDto extends AuthTokensDto {
  user: UserDto;
}
