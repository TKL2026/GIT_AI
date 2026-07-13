import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../api/finance';

export function useFinanceSummary(from?: string, to?: string) {
  return useQuery({
    queryKey: ['finance', 'summary', from ?? null, to ?? null],
    queryFn: () => financeApi.getSummary({ from, to }),
  });
}

export function useProductsProfitability(from?: string, to?: string) {
  return useQuery({
    queryKey: ['finance', 'products-profitability', from ?? null, to ?? null],
    queryFn: () => financeApi.getProductsProfitability({ from, to }),
  });
}

export function useMonthlyTrend(months?: number) {
  return useQuery({
    queryKey: ['finance', 'monthly-trend', months ?? null],
    queryFn: () => financeApi.getMonthlyTrend(months),
  });
}
