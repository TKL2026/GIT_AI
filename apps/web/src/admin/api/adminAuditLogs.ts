import type { AdminAuditLogItemDto, PaginatedResultDto } from '@copilote/shared';
import { toQueryString } from '../../lib/apiClient';
import { adminApiClient } from '../adminApiClient';

export interface AdminAuditLogsListParams {
  page: number;
  pageSize: number;
}

export const adminAuditLogsApi = {
  list: (params: AdminAuditLogsListParams) =>
    adminApiClient.get<PaginatedResultDto<AdminAuditLogItemDto>>(`/admin/audit-logs${toQueryString(params)}`),
};
