import {
  ExpenseCategory,
  MobileMoneyOperator,
  PaymentMethod,
  PaymentTransactionStatus,
  PurchaseOrderStatus,
  SubscriptionStatus,
} from '@copilote/shared';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Espèces',
  [PaymentMethod.MOBILE_MONEY]: 'Mobile Money',
  [PaymentMethod.CARD]: 'Carte',
  [PaymentMethod.OTHER]: 'Autre',
};

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  [PurchaseOrderStatus.PENDING]: 'En attente',
  [PurchaseOrderStatus.RECEIVED]: 'Reçue',
  [PurchaseOrderStatus.CANCELLED]: 'Annulée',
};

export const PURCHASE_ORDER_STATUS_COLORS: Record<PurchaseOrderStatus, string> = {
  [PurchaseOrderStatus.PENDING]: 'warning',
  [PurchaseOrderStatus.RECEIVED]: 'emerald',
  [PurchaseOrderStatus.CANCELLED]: 'gray',
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.RENT]: 'Loyer',
  [ExpenseCategory.UTILITIES]: 'Charges (eau/électricité)',
  [ExpenseCategory.SALARIES]: 'Salaires',
  [ExpenseCategory.SUPPLIES]: 'Fournitures',
  [ExpenseCategory.TRANSPORT]: 'Transport',
  [ExpenseCategory.OTHER]: 'Autre',
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.TRIAL]: 'Essai',
  [SubscriptionStatus.AWAITING_PAYMENT]: 'En attente de paiement',
  [SubscriptionStatus.ACTIVE]: 'Actif',
  [SubscriptionStatus.PAST_DUE]: 'Paiement en retard',
  [SubscriptionStatus.EXPIRED]: 'Expiré',
  [SubscriptionStatus.CANCELLED]: 'Annulé',
};

export const SUBSCRIPTION_STATUS_COLORS: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.TRIAL]: 'gray',
  [SubscriptionStatus.AWAITING_PAYMENT]: 'warning',
  [SubscriptionStatus.ACTIVE]: 'emerald',
  [SubscriptionStatus.PAST_DUE]: 'warning',
  [SubscriptionStatus.EXPIRED]: 'error',
  [SubscriptionStatus.CANCELLED]: 'gray',
};

export const PAYMENT_TRANSACTION_STATUS_LABELS: Record<PaymentTransactionStatus, string> = {
  [PaymentTransactionStatus.PENDING]: 'En attente',
  [PaymentTransactionStatus.SUCCESS]: 'Réussi',
  [PaymentTransactionStatus.FAILED]: 'Échoué',
  [PaymentTransactionStatus.EXPIRED]: 'Expiré',
  [PaymentTransactionStatus.CANCELLED]: 'Annulé',
};

export const PAYMENT_TRANSACTION_STATUS_COLORS: Record<PaymentTransactionStatus, string> = {
  [PaymentTransactionStatus.PENDING]: 'warning',
  [PaymentTransactionStatus.SUCCESS]: 'emerald',
  [PaymentTransactionStatus.FAILED]: 'error',
  [PaymentTransactionStatus.EXPIRED]: 'gray',
  [PaymentTransactionStatus.CANCELLED]: 'gray',
};

export const MOBILE_MONEY_OPERATOR_LABELS: Record<MobileMoneyOperator, string> = {
  [MobileMoneyOperator.MTN]: 'MTN Mobile Money',
  [MobileMoneyOperator.ORANGE]: 'Orange Money',
};
