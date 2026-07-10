import type { PurchaseOrderDto } from '@copilote/shared';
import { apiClient } from '../lib/apiClient';

export interface CreatePurchaseOrderItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  items: CreatePurchaseOrderItemInput[];
}

export const purchasesApi = {
  list: () => apiClient.get<PurchaseOrderDto[]>('/purchases'),

  create: (input: CreatePurchaseOrderInput) =>
    apiClient.post<PurchaseOrderDto>('/purchases', input),

  receive: (id: string) => apiClient.post<PurchaseOrderDto>(`/purchases/${id}/receive`),

  cancel: (id: string) => apiClient.post<PurchaseOrderDto>(`/purchases/${id}/cancel`),
};
