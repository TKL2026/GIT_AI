import { useQuery } from '@tanstack/react-query';
import { adminSystemApi } from '../api/adminSystem';

export function useAdminSystem() {
  return useQuery({ queryKey: ['admin', 'system'], queryFn: adminSystemApi.get });
}
