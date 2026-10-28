import { useMutation, useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reports';

export function useDailyReport(date?: string, enabled = true) {
  return useQuery({
    queryKey: ['reports', 'daily', date ?? null],
    queryFn: () => reportsApi.getDailyReport(date),
    enabled,
  });
}

export function useDailyReportsList(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: ['reports', 'daily-list', from, to],
    queryFn: () => reportsApi.getDailyReportsList(from, to),
    enabled,
  });
}

export function useMonthlyReport(month?: string, enabled = true) {
  return useQuery({
    queryKey: ['reports', 'monthly', month ?? null],
    queryFn: () => reportsApi.getMonthlyReport(month),
    enabled,
  });
}

export function useDownloadDailyReportPdf() {
  return useMutation({
    mutationFn: (date: string) => reportsApi.getDailyReportPdf(date),
  });
}

export function useDownloadMonthlyReportPdf() {
  return useMutation({
    mutationFn: (month: string) => reportsApi.getMonthlyReportPdf(month),
  });
}
