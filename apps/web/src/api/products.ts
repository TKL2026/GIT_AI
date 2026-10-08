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

export interface UpdateProductInput {
  name?: string;
  sku?: string;
  purchasePrice?: number;
  salePrice?: number;
  minStock?: number;
  maxStock?: number;
}

export interface ImportProductRow {
  line: number;
  [key: string]: string | number;
}

export interface ImportProductsResult {
  importedCount: number;
  rejectedCount: number;
  errors: { line: number; message: string }[];
}

export const productsApi = {
  list: () => apiClient.get<ProductDto[]>('/products'),

  get: (id: string) => apiClient.get<ProductDto>(`/products/${id}`),

  create: (input: CreateProductInput) => apiClient.post<ProductDto>('/products', input),

  import: (rows: ImportProductRow[]) =>
    apiClient.post<ImportProductsResult>('/products/import', { rows }),

  update: (id: string, input: UpdateProductInput) =>
    apiClient.patch<ProductDto>(`/products/${id}`, input),

  archive: (id: string) => apiClient.delete<ProductDto>(`/products/${id}`),

  updateThresholds: (id: string, input: UpdateThresholdsInput) =>
    apiClient.patch<ProductDto>(`/products/${id}/thresholds`, input),
};
