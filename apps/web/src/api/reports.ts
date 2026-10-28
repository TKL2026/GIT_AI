import type { ProductProfitabilityDto } from '@copilote/shared';
import { apiClient, toQueryString } from '../lib/apiClient';

export interface StockAlertItem {
  productId: string;
  productName: string;
  stockQuantity: number;
  minStock: number | null;
  status: 'out' | 'low';
}

export interface DailyReport {
  date: string;
  dateLabel: string;
  organizationName: string;
  hasActivity: boolean;
  totalRevenue: number;
  totalExpenses: number;
  totalCogs: number;
  grossMargin: number;
  netProfit: number;
  salesCount: number;
  topProducts: ProductProfitabilityDto[];
  stockAlerts: StockAlertItem[];
}

export interface DailyReportListItem {
  date: string;
  dateLabel: string;
  totalRevenue: number;
  salesCount: number;
  hasActivity: boolean;
}

export interface MonthlyReport {
  month: string;
  monthLabel: string;
  organizationName: string;
  hasActivity: boolean;
  totalRevenue: number;
  totalExpenses: number;
  totalCogs: number;
  grossMargin: number;
  netProfit: number;
  salesCount: number;
  topProducts: ProductProfitabilityDto[];
  stockAlerts: StockAlertItem[];
}

export const reportsApi = {
  getDailyReport: (date?: string) =>
    apiClient.get<DailyReport>(`/reports/daily${toQueryString({ date })}`),

  getDailyReportsList: (from: string, to: string) =>
    apiClient.get<DailyReportListItem[]>(`/reports/daily/list${toQueryString({ from, to })}`),

  getDailyReportPdf: (date: string) =>
    apiClient.getBlob(`/reports/daily/pdf${toQueryString({ date })}`),

  getMonthlyReport: (month?: string) =>
    apiClient.get<MonthlyReport>(`/reports/monthly${toQueryString({ month })}`),

  getMonthlyReportPdf: (month: string) =>
    apiClient.getBlob(`/reports/monthly/pdf${toQueryString({ month })}`),
};
