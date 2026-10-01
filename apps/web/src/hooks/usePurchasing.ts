import { useQuery } from '@tanstack/react-query';
import { purchasingApi } from '../api/purchasing';

export function usePurchaseRecommendations(enabled = true) {
  return useQuery({
    queryKey: ['purchasing', 'recommendations'],
    queryFn: purchasingApi.getRecommendations,
    enabled,
  });
}
