import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminOrganizationsApi, type AdminOrganizationsListParams } from '../api/adminOrganizations';

const LIST_KEY = ['admin', 'organizations'] as const;

export function useAdminOrganizations(params: AdminOrganizationsListParams) {
  return useQuery({
    queryKey: [...LIST_KEY, params],
    queryFn: () => adminOrganizationsApi.list(params),
  });
}

export function useAdminOrganization(id: string | undefined) {
  return useQuery({
    queryKey: [...LIST_KEY, id],
    queryFn: () => adminOrganizationsApi.get(id as string),
    enabled: Boolean(id),
  });
}

function useInvalidateAdminOrganizations() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: LIST_KEY });
}

export function useSuspendOrganization(id: string) {
  const invalidate = useInvalidateAdminOrganizations();
  return useMutation({
    mutationFn: () => adminOrganizationsApi.suspend(id),
    onSuccess: invalidate,
  });
}

export function useReactivateOrganization(id: string) {
  const invalidate = useInvalidateAdminOrganizations();
  return useMutation({
    mutationFn: () => adminOrganizationsApi.reactivate(id),
    onSuccess: invalidate,
  });
}

export function useExtendTrial(id: string) {
  const invalidate = useInvalidateAdminOrganizations();
  return useMutation({
    mutationFn: (days: number) => adminOrganizationsApi.extendTrial(id, days),
    onSuccess: invalidate,
  });
}
