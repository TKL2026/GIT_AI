import type { PurchaseRecommendationDto } from '@copilote/shared';
import { apiClient } from '../lib/apiClient';

export const purchasingApi = {
  getRecommendations: () => apiClient.get<PurchaseRecommendationDto[]>('/purchasing/recommendations'),
};
