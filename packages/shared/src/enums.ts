export enum Role {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  DIRECTOR = 'DIRECTOR',
  STOCK_MANAGER = 'STOCK_MANAGER',
  CASHIER = 'CASHIER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum PaymentMethod {
  CASH = 'CASH',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CARD = 'CARD',
  OTHER = 'OTHER',
}

export enum PurchaseOrderStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export enum ExpenseCategory {
  RENT = 'RENT',
  UTILITIES = 'UTILITIES',
  SALARIES = 'SALARIES',
  SUPPLIES = 'SUPPLIES',
  TRANSPORT = 'TRANSPORT',
  OTHER = 'OTHER',
}
