import { ExpenseCategory, PaymentMethod, PurchaseOrderStatus } from '@copilote/shared';

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
  [PurchaseOrderStatus.PENDING]: 'yellow',
  [PurchaseOrderStatus.RECEIVED]: 'green',
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
