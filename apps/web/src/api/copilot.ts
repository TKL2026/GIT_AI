import type { ChatMessageDto } from '@copilote/shared';
import { apiClient } from '../lib/apiClient';

export const copilotApi = {
  chat: (messages: ChatMessageDto[]) =>
    apiClient.post<{ message: string }>('/copilot/chat', { messages }),

  getDailyReport: () => apiClient.get<{ report: string }>('/copilot/daily-report'),
};
