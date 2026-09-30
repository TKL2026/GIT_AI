import type { CheckoutResultDto, PaymentTransactionDto, PlanDto, SubscriptionDto } from '@copilote/shared';
import { MobileMoneyOperator } from '@copilote/shared';
import { apiClient } from '../lib/apiClient';

export interface CheckoutInput {
  planId: string;
  operator: MobileMoneyOperator;
  phoneNumber: string;
}

export const billingApi = {
  getPlans: () => apiClient.get<PlanDto[]>('/billing/plans'),

  getSubscription: () => apiClient.get<SubscriptionDto | null>('/billing/subscription'),

  listTransactions: () => apiClient.get<PaymentTransactionDto[]>('/billing/transactions'),

  getTransaction: (externalReference: string) =>
    apiClient.get<PaymentTransactionDto>(`/billing/transactions/${externalReference}`),

  checkout: (input: CheckoutInput) => apiClient.post<CheckoutResultDto>('/billing/checkout', input),
};
