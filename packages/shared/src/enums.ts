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

export enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  EXPIRED = 'EXPIRED',
  /// Essai gratuit de 7 jours consommé sans paiement — distinct de EXPIRED
  /// (voir apps/api/prisma/schema.prisma). Manquait dans ce miroir partagé ;
  /// ajouté pour que l'admin plateforme puisse afficher ce statut réel.
  TRIAL_EXPIRED = 'TRIAL_EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum SubscriptionPeriod {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum PaymentProvider {
  CAMPAY = 'CAMPAY',
}

export enum MobileMoneyOperator {
  MTN = 'MTN',
  ORANGE = 'ORANGE',
}

export enum PaymentTransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}
