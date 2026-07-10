import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  stockApi,
  type StockAdjustmentInput,
  type StockInInput,
  type StockOutInput,
} from '../api/stock';
import { PRODUCTS_QUERY_KEY } from './useProducts';

export const STOCK_MOVEMENTS_QUERY_KEY = ['stock', 'movements'] as const;
export const STOCK_ALERTS_QUERY_KEY = ['stock', 'alerts'] as const;

export function useStockMovements(productId?: string) {
  return useQuery({
    queryKey: [...STOCK_MOVEMENTS_QUERY_KEY, productId ?? null],
    queryFn: () => stockApi.listMovements(productId),
  });
}

export function useStockAlerts() {
  return useQuery({
    queryKey: STOCK_ALERTS_QUERY_KEY,
    queryFn: stockApi.listAlerts,
  });
}

function useInvalidateStockAndProducts() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: STOCK_MOVEMENTS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: STOCK_ALERTS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
  };
}

export function useRecordStockIn() {
  const invalidate = useInvalidateStockAndProducts();
  return useMutation({
    mutationFn: (input: StockInInput) => stockApi.recordIn(input),
    onSuccess: invalidate,
  });
}

export function useRecordStockOut() {
  const invalidate = useInvalidateStockAndProducts();
  return useMutation({
    mutationFn: (input: StockOutInput) => stockApi.recordOut(input),
    onSuccess: invalidate,
  });
}

export function useRecordStockAdjustment() {
  const invalidate = useInvalidateStockAndProducts();
  return useMutation({
    mutationFn: (input: StockAdjustmentInput) => stockApi.recordAdjustment(input),
    onSuccess: invalidate,
  });
}
