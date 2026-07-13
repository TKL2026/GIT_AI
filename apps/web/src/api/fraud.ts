import type { FraudAnomalyDto } from '@copilote/shared';
import { apiClient } from '../lib/apiClient';

export const fraudApi = {
  getAnomalies: () => apiClient.get<FraudAnomalyDto[]>('/fraud/anomalies'),
};
