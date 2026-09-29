import type { OrganizationDto } from '@copilote/shared';
import { apiClient } from '../lib/apiClient';

export interface UpdateOrganizationInput {
  name?: string;
  country?: string;
  currency?: string;
  industry?: string;
  teamSize?: string;
  modules?: string[];
  onboardingStep?: string;
}

export const organizationsApi = {
  getMe: () => apiClient.get<OrganizationDto>('/organizations/me'),

  update: (input: UpdateOrganizationInput) => apiClient.patch<OrganizationDto>('/organizations/me', input),

  completeOnboarding: () => apiClient.post<OrganizationDto>('/organizations/me/complete-onboarding'),
};
