import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { purchasesApi, type CreatePurchaseOrderInput } from '../api/purchases';
import { PRODUCTS_QUERY_KEY } from './useProducts';
import { STOCK_ALERTS_QUERY_KEY, STOCK_MOVEMENTS_QUERY_KEY } from './useStock';

export const PURCHASES_QUERY_KEY = ['purchases'] as const;

export function usePurchaseOrders() {
  return useQuery({
    queryKey: PURCHASES_QUERY_KEY,
    queryFn: purchasesApi.list,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePurchaseOrderInput) => purchasesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PURCHASES_QUERY_KEY });
    },
  });
}

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchasesApi.receive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PURCHASES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STOCK_MOVEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STOCK_ALERTS_QUERY_KEY });
    },
  });
}

export function useCancelPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchasesApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PURCHASES_QUERY_KEY });
    },
  });
}
