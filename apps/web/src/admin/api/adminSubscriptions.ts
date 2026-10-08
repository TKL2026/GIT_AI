import type { AdminSubscriptionListItemDto, PaginatedResultDto } from '@copilote/shared';
import { toQueryString } from '../../lib/apiClient';
import { adminApiClient } from '../adminApiClient';

export interface AdminSubscriptionsListParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  planCode?: string;
}

export const adminSubscriptionsApi = {
  list: (params: AdminSubscriptionsListParams) =>
    adminApiClient.get<PaginatedResultDto<AdminSubscriptionListItemDto>>(
      `/admin/subscriptions${toQueryString(params)}`,
    ),
};
