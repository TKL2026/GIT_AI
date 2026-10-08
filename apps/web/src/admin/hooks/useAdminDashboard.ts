import { useQuery } from '@tanstack/react-query';
import { adminDashboardApi } from '../api/adminDashboard';

export function useAdminDashboard() {
  return useQuery({ queryKey: ['admin', 'dashboard'], queryFn: adminDashboardApi.get });
}
