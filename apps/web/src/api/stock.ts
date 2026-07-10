import type { ProductDto, StockMovementDto } from '@copilote/shared';
import { apiClient } from '../lib/apiClient';

export interface StockInInput {
  productId: string;
  quantity: number;
  reason?: string;
}

export interface StockOutInput {
  productId: string;
  quantity: number;
  reason?: string;
}

export interface StockAdjustmentInput {
  productId: string;
  newQuantity: number;
  reason: string;
}

export const stockApi = {
  listMovements: (productId?: string) =>
    apiClient.get<StockMovementDto[]>(
      productId ? `/stock/movements?productId=${productId}` : '/stock/movements',
    ),

  listAlerts: () => apiClient.get<ProductDto[]>('/stock/alerts'),

  recordIn: (input: StockInInput) => apiClient.post<StockMovementDto>('/stock/movements/in', input),

  recordOut: (input: StockOutInput) =>
    apiClient.post<StockMovementDto>('/stock/movements/out', input),

  recordAdjustment: (input: StockAdjustmentInput) =>
    apiClient.post<StockMovementDto>('/stock/movements/adjustment', input),
};
