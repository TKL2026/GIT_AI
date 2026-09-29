import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationsApi, type UpdateOrganizationInput } from '../api/organizations';

const ORGANIZATION_QUERY_KEY = ['organization', 'me'];

export function useOrganization(enabled = true) {
  return useQuery({
    queryKey: ORGANIZATION_QUERY_KEY,
    queryFn: organizationsApi.getMe,
    enabled,
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateOrganizationInput) => organizationsApi.update(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORGANIZATION_QUERY_KEY });
    },
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => organizationsApi.completeOnboarding(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORGANIZATION_QUERY_KEY });
    },
  });
}
