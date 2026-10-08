import type { AdminDashboardStatsDto } from '@copilote/shared';
import { adminApiClient } from '../adminApiClient';

export const adminDashboardApi = {
  get: () => adminApiClient.get<AdminDashboardStatsDto>('/admin/dashboard'),
};
