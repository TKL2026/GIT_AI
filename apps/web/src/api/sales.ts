import type { PaymentMethod, SaleDto } from '@copilote/shared';
import { apiClient } from '../lib/apiClient';

export interface CreateSaleItemInput {
  productId: string;
  quantity: number;
}

export interface CreateSaleInput {
  customerName?: string;
  customerPhone?: string;
  paymentMethod: PaymentMethod;
  items: CreateSaleItemInput[];
}

export const salesApi = {
  list: () => apiClient.get<SaleDto[]>('/sales'),

  create: (input: CreateSaleInput) => apiClient.post<SaleDto>('/sales', input),
};
