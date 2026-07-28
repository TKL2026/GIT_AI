import { useMutation } from '@tanstack/react-query';
import { whatsappApi } from '../api/whatsapp';

export function useSendWhatsAppTest() {
  return useMutation({
    mutationFn: whatsappApi.sendTest,
  });
}

export function useSendWhatsAppDailyReport() {
  return useMutation({
    mutationFn: whatsappApi.sendDailyReport,
  });
}
