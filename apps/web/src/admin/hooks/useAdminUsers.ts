import { useQuery } from '@tanstack/react-query';
import { adminUsersApi, type AdminUsersListParams } from '../api/adminUsers';

export function useAdminUsers(params: AdminUsersListParams) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminUsersApi.list(params),
  });
}

export function useAdminUser(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => adminUsersApi.get(id as string),
    enabled: Boolean(id),
  });
}
