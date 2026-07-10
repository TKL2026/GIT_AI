import type { ProductDto } from '@copilote/shared';
import { apiClient } from '../lib/apiClient';

export interface CreateProductInput {
  name: string;
  sku: string;
  purchasePrice: number;
  salePrice: number;
  initialStock?: number;
  minStock?: number;
  maxStock?: number;
}

export interface UpdateThresholdsInput {
  minStock?: number;
  maxStock?: number;
}

export const productsApi = {
  list: () => apiClient.get<ProductDto[]>('/products'),

  create: (input: CreateProductInput) => apiClient.post<ProductDto>('/products', input),

  updateThresholds: (id: string, input: UpdateThresholdsInput) =>
    apiClient.patch<ProductDto>(`/products/${id}/thresholds`, input),
};
