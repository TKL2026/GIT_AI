import type { UserDto } from '@copilote/shared';
import { apiClient } from '../lib/apiClient';

export const usersApi = {
  list: () => apiClient.get<UserDto[]>('/users'),
};
