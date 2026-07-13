import type { FinanceSummaryDto, MonthlyFinanceTrendDto, ProductProfitabilityDto } from '@copilote/shared';
import { apiClient, toQueryString } from '../lib/apiClient';

export interface FinanceQuery {
  from?: string;
  to?: string;
}

export const financeApi = {
  getSummary: (query: FinanceQuery) =>
    apiClient.get<FinanceSummaryDto>(`/finance/summary${toQueryString(query)}`),

  getProductsProfitability: (query: FinanceQuery) =>
    apiClient.get<ProductProfitabilityDto[]>(
      `/finance/products-profitability${toQueryString(query)}`,
    ),

  getMonthlyTrend: (months?: number) =>
    apiClient.get<MonthlyFinanceTrendDto[]>(
      `/finance/monthly-trend${toQueryString({ months: months?.toString() })}`,
    ),
};
