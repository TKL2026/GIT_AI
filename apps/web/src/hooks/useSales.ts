import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { salesApi, type CreateSaleInput } from '../api/sales';
import { PRODUCTS_QUERY_KEY } from './useProducts';
import { STOCK_ALERTS_QUERY_KEY, STOCK_MOVEMENTS_QUERY_KEY } from './useStock';

export const SALES_QUERY_KEY = ['sales'] as const;

export function useSales() {
  return useQuery({
    queryKey: SALES_QUERY_KEY,
    queryFn: salesApi.list,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSaleInput) => salesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STOCK_MOVEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STOCK_ALERTS_QUERY_KEY });
    },
  });
}
