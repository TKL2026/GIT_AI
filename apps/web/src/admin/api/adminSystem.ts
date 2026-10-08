import type { AdminSystemStatusDto } from '@copilote/shared';
import { adminApiClient } from '../adminApiClient';

export const adminSystemApi = {
  get: () => adminApiClient.get<AdminSystemStatusDto>('/admin/system'),
};
