import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invitesApi, type AcceptInviteInput, type CreateInviteInput } from '../api/invites';

const INVITES_QUERY_KEY = ['organization', 'invites'];

export function useInvites(enabled = true) {
  return useQuery({
    queryKey: INVITES_QUERY_KEY,
    queryFn: invitesApi.list,
    enabled,
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInviteInput) => invitesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVITES_QUERY_KEY });
    },
  });
}

export function useInvitePreview(token: string | undefined) {
  return useQuery({
    queryKey: ['invite', 'preview', token],
    queryFn: () => invitesApi.preview(token as string),
    enabled: !!token,
    retry: false,
  });
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: ({ token, input }: { token: string; input: AcceptInviteInput }) =>
      invitesApi.accept(token, input),
  });
}
