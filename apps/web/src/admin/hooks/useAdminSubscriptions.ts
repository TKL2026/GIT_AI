import { useQuery } from '@tanstack/react-query';
import { adminSubscriptionsApi, type AdminSubscriptionsListParams } from '../api/adminSubscriptions';

export function useAdminSubscriptions(params: AdminSubscriptionsListParams) {
  return useQuery({
    queryKey: ['admin', 'subscriptions', params],
    queryFn: () => adminSubscriptionsApi.list(params),
  });
}
