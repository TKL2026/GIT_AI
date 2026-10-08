import { useQuery } from '@tanstack/react-query';
import { adminAuditLogsApi, type AdminAuditLogsListParams } from '../api/adminAuditLogs';

export function useAdminAuditLogs(params: AdminAuditLogsListParams) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: () => adminAuditLogsApi.list(params),
  });
}
