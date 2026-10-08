import type { AdminUserListItemDto, PaginatedResultDto } from '@copilote/shared';
import { toQueryString } from '../../lib/apiClient';
import { adminApiClient } from '../adminApiClient';

export interface AdminUsersListParams {
  page: number;
  pageSize: number;
  search?: string;
  organizationId?: string;
}

export const adminUsersApi = {
  list: (params: AdminUsersListParams) =>
    adminApiClient.get<PaginatedResultDto<AdminUserListItemDto>>(`/admin/users${toQueryString(params)}`),

  get: (id: string) => adminApiClient.get<AdminUserListItemDto>(`/admin/users/${id}`),
};
