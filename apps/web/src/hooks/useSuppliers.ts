import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  suppliersApi,
  type CreateSupplierInput,
  type UpdateSupplierInput,
} from '../api/suppliers';

export const SUPPLIERS_QUERY_KEY = ['suppliers'] as const;

export function useSuppliers() {
  return useQuery({
    queryKey: SUPPLIERS_QUERY_KEY,
    queryFn: suppliersApi.list,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSupplierInput) => suppliersApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSupplierInput }) =>
      suppliersApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY });
    },
  });
}
