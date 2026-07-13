import { useQuery } from '@tanstack/react-query';
import { commercialApi } from '../api/commercial';

export function useProductsToPush() {
  return useQuery({
    queryKey: ['commercial', 'products-to-push'],
    queryFn: commercialApi.getProductsToPush,
  });
}

export function useCustomerInsights() {
  return useQuery({
    queryKey: ['commercial', 'customer-insights'],
    queryFn: commercialApi.getCustomerInsights,
  });
}

export function useCrossSellOpportunities() {
  return useQuery({
    queryKey: ['commercial', 'cross-sell'],
    queryFn: commercialApi.getCrossSellOpportunities,
  });
}
