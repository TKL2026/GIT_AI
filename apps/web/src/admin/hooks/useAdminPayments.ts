import { useQuery } from '@tanstack/react-query';
import { adminPaymentsApi, type AdminPaymentsListParams } from '../api/adminPayments';

export function useAdminPayments(params: AdminPaymentsListParams) {
  return useQuery({
    queryKey: ['admin', 'payments', params],
    queryFn: () => adminPaymentsApi.list(params),
  });
}
