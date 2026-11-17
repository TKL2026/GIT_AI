import type { ChatMessageDto, CopilotQuotaDto } from '@copilote/shared';
import { apiClient } from '../lib/apiClient';

export const copilotApi = {
  chat: (messages: ChatMessageDto[]) =>
    apiClient.post<{ message: string }>('/copilot/chat', { messages }),
  getDailyReport: () => apiClient.get<{ report: string }>('/copilot/daily-report'),
  getQuota: () => apiClient.get<CopilotQuotaDto>('/copilot/quota'),
};
