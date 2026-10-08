import type { AdminOrganizationDetailDto, AdminOrganizationListItemDto, PaginatedResultDto } from '@copilote/shared';
import { toQueryString } from '../../lib/apiClient';
import { adminApiClient } from '../adminApiClient';

export interface AdminOrganizationsListParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  planCode?: string;
}

export const adminOrganizationsApi = {
  list: (params: AdminOrganizationsListParams) =>
    adminApiClient.get<PaginatedResultDto<AdminOrganizationListItemDto>>(
      `/admin/organizations${toQueryString(params)}`,
    ),

  get: (id: string) => adminApiClient.get<AdminOrganizationDetailDto>(`/admin/organizations/${id}`),

  suspend: (id: string) => adminApiClient.post<{ success: true }>(`/admin/organizations/${id}/suspend`),

  reactivate: (id: string) => adminApiClient.post<{ success: true }>(`/admin/organizations/${id}/reactivate`),

  extendTrial: (id: string, days: number) =>
    adminApiClient.post<{ success: true }>(`/admin/organizations/${id}/extend-trial`, { days }),
};
