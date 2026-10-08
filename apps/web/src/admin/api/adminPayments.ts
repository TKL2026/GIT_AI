import type { AdminPaymentListItemDto, PaginatedResultDto } from '@copilote/shared';
import { toQueryString } from '../../lib/apiClient';
import { adminApiClient } from '../adminApiClient';

export interface AdminPaymentsListParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  organizationId?: string;
}

export const adminPaymentsApi = {
  list: (params: AdminPaymentsListParams) =>
    adminApiClient.get<PaginatedResultDto<AdminPaymentListItemDto>>(`/admin/payments${toQueryString(params)}`),
};
