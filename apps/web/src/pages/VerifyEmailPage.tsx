import { Alert, Anchor, Button, Center, Loader, Paper, Stack, Text } from '@mantine/core';
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { apiClient, ApiError } from '../lib/apiClient';

type Status = 'loading' | 'success' | 'error';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    apiClient
      .post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.');
        setStatus('error');
      });
  }, [token]);

  return (
    <Center
      mih="100vh"
      p="md"
      style={{ background: 'linear-gradient(160deg, var(--mantine-color-emerald-0) 0%, #ffffff 55%)' }}
    >
      <Paper withBorder shadow="sm" radius="md" p="xl" w="100%" maw={380}>
        <Stack gap="xs" mb="lg" align="center">
          <Logo size="lg" />
          <Text c="dimmed" size="sm" ta="center">
            Confirmation d'email
          </Text>
        </Stack>

        {status === 'loading' && (
          <Center py="md">
            <Loader size="sm" />
          </Center>
        )}

        {status === 'success' && (
          <Stack gap="md">
            <Alert color="emerald" icon={<IconCircleCheck size={16} />}>
              Votre adresse email est confirmée.
            </Alert>
            {/* Rechargement complet nécessaire pour rafraîchir la session en
                cours et faire disparaître le bandeau de rappel. */}
            <Button component="a" href="/dashboard" fullWidth>
              Aller au tableau de bord
            </Button>
          </Stack>
        )}

        {status === 'error' && (
          <Stack gap="md">
            <Alert color="red" icon={<IconAlertCircle size={16} />} role="alert">
              {token ? error : 'Ce lien de confirmation est invalide.'}
            </Alert>
            <Anchor component={Link} to="/dashboard" size="sm" ta="center">
              Retour au tableau de bord
            </Anchor>
          </Stack>
        )}
      </Paper>
    </Center>
  );
}
