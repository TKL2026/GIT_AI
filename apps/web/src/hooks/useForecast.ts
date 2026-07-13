import { useQuery } from '@tanstack/react-query';
import { forecastApi } from '../api/forecast';

export function useReplenishmentForecast() {
  return useQuery({
    queryKey: ['forecast', 'replenishment'],
    queryFn: forecastApi.getReplenishmentForecast,
  });
}
