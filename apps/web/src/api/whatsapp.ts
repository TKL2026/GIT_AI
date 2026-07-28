import { apiClient } from '../lib/apiClient';

export const whatsappApi = {
  sendTest: () => apiClient.post<{ messageId: string }>('/whatsapp/send-test'),

  sendDailyReport: () => apiClient.post<{ messageId: string }>('/whatsapp/send-daily-report'),
};
