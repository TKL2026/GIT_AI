import type { AuthResponseDto, InvitePreviewDto, PendingInviteDto, Role } from '@copilote/shared';
import { apiClient } from '../lib/apiClient';

export interface CreateInviteInput {
  email: string;
  role: Role;
}

export interface AcceptInviteInput {
  firstName: string;
  lastName: string;
  password: string;
}

export const invitesApi = {
  list: () => apiClient.get<PendingInviteDto[]>('/organizations/me/invites'),

  create: (input: CreateInviteInput) => apiClient.post<PendingInviteDto>('/organizations/me/invites', input),

  preview: (token: string) => apiClient.get<InvitePreviewDto>(`/invites/${token}`),

  accept: (token: string, input: AcceptInviteInput) =>
    apiClient.post<AuthResponseDto>(`/invites/${token}/accept`, input),
};
