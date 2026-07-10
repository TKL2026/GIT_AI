import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi, type CreateProductInput, type UpdateThresholdsInput } from '../api/products';

export const PRODUCTS_QUERY_KEY = ['products'] as const;

export function useProducts() {
  return useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: productsApi.list,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductInput) => productsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
}

export function useUpdateThresholds() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateThresholdsInput }) =>
      productsApi.updateThresholds(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
}
