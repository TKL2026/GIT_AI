import { useQuery } from '@tanstack/react-query';
import { fraudApi } from '../api/fraud';

export function useFraudAnomalies() {
  return useQuery({
    queryKey: ['fraud', 'anomalies'],
    queryFn: fraudApi.getAnomalies,
  });
}
