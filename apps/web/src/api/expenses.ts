import type { ExpenseCategory, ExpenseDto } from '@copilote/shared';
import { apiClient, toQueryString } from '../lib/apiClient';
import type { FinanceQuery } from './finance';

export interface CreateExpenseInput {
  category: ExpenseCategory;
  description?: string;
  amount: number;
  expenseDate?: string;
}

export const expensesApi = {
  list: (query: FinanceQuery) => apiClient.get<ExpenseDto[]>(`/expenses${toQueryString(query)}`),

  create: (input: CreateExpenseInput) => apiClient.post<ExpenseDto>('/expenses', input),
};
