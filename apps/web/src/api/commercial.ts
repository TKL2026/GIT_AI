import type { CrossSellPairDto, CustomerInsightDto, ProductToPushDto } from '@copilote/shared';
import { apiClient } from '../lib/apiClient';

export const commercialApi = {
  getProductsToPush: () => apiClient.get<ProductToPushDto[]>('/commercial/products-to-push'),

  getCustomerInsights: () => apiClient.get<CustomerInsightDto[]>('/commercial/customer-insights'),

  getCrossSellOpportunities: () => apiClient.get<CrossSellPairDto[]>('/commercial/cross-sell'),
};
