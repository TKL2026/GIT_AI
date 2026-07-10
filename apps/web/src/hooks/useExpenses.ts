import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { expensesApi, type CreateExpenseInput } from '../api/expenses';

export function useExpenses(from?: string, to?: string) {
  return useQuery({
    queryKey: ['expenses', from ?? null, to ?? null],
    queryFn: () => expensesApi.list({ from, to }),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExpenseInput) => expensesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });
}
