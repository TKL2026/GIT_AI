import { useMutation } from '@tanstack/react-query';
import type { ChatMessageDto } from '@copilote/shared';
import { copilotApi } from '../api/copilot';

export function useCopilotChat() {
  return useMutation({
    mutationFn: (messages: ChatMessageDto[]) => copilotApi.chat(messages),
  });
}

export function useDailyReport() {
  return useMutation({
    mutationFn: () => copilotApi.getDailyReport(),
  });
}
