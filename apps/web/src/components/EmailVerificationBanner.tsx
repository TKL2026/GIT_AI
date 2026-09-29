import { Alert, Anchor, Group, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconMailExclamation } from '@tabler/icons-react';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiClient, ApiError } from '../lib/apiClient';

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);

  if (!user || user.emailVerifiedAt) {
    return null;
  }

  async function handleResend() {
    setIsSending(true);
    try {
      await apiClient.post('/auth/resend-verification');
      notifications.show({ color: 'emerald', message: 'Email de confirmation renvoyé.' });
    } catch (err) {
      notifications.show({
        color: 'red',
        message: err instanceof ApiError ? err.message : "Impossible d'envoyer l'email.",
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Alert color="amber" icon={<IconMailExclamation size={16} />} radius={0} mb="md">
      <Group justify="space-between" wrap="wrap" gap="xs">
        <Text size="sm">
          Confirmez votre adresse email ({user.email}) pour sécuriser votre compte.
        </Text>
        <Anchor component="button" type="button" size="sm" fw={600} onClick={handleResend} disabled={isSending}>
          {isSending ? 'Envoi...' : "Renvoyer l'email"}
        </Anchor>
      </Group>
    </Alert>
  );
}
