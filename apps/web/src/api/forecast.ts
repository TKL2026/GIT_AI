import type { StockForecastDto } from '@copilote/shared';
import { apiClient } from '../lib/apiClient';

export const forecastApi = {
  getReplenishmentForecast: () => apiClient.get<StockForecastDto[]>('/forecast/replenishment'),
};
