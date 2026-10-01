import { useQuery } from '@tanstack/react-query';
import { commercialApi } from '../api/commercial';

export function useProductsToPush(enabled = true) {
  return useQuery({
    queryKey: ['commercial', 'products-to-push'],
    queryFn: commercialApi.getProductsToPush,
    enabled,
  });
}

export function useCustomerInsights(enabled = true) {
  return useQuery({
    queryKey: ['commercial', 'customer-insights'],
    queryFn: commercialApi.getCustomerInsights,
    enabled,
  });
}

export function useCrossSellOpportunities(enabled = true) {
  return useQuery({
    queryKey: ['commercial', 'cross-sell'],
    queryFn: commercialApi.getCrossSellOpportunities,
    enabled,
  });
}
